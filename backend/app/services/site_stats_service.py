"""站点统计服务：request_logs 的查询聚合、内存计数与响应组装。

数据访问与多维度聚合集中在本模块，路由层（app/api/v1/site_stats.py）
只负责 HTTP 参数与权限；请求中间件通过 record_request 上报计数。
"""
import re
import threading
from datetime import datetime, timedelta
from typing import Any, Dict, List, NamedTuple, Optional, Set
from urllib.parse import urlparse

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.unified_logging import get_logger
from app.models.request_log import RequestLog
from app.schemas.site_stats import (
    CountryDistributionItem,
    DetailedStatsResponse,
    HourlyItem,
    LiveLogItem,
    LiveLogsResponse,
    LocationDistributionItem,
    PageSectionItem,
    PreviousPeriod,
    ProvinceDistributionItem,
    ReferrerItem,
    SiteStatsResponse,
    TopIpItem,
    TopPageItem,
    TrafficBreakdown,
    TrendItem,
    VisitorStatsResponse,
)
from app.services.ip_location import (
    get_ip_location_service,
    to_country_bucket,
    to_province_bucket,
)

logger = get_logger(__name__)

# 全局变量，记录启动时间
START_TIME = datetime.now()
# 请求统计用锁保护，避免 += 的读-改-写竞态
_STATS_LOCK = threading.Lock()
TOTAL_REQUESTS = 0
# 访客 IP 集合设上限，防止长期运行内存单调增长；超过后停止新增，
# 精确访客数由 request_logs 表的 DB 查询提供（见 _get_unique_visitors）
VISITOR_IPS: set = set()
MAX_VISITOR_IPS = 10_000

# 访客统计展示条数与最大统计天数（受限于访问日志 30 天保留期）
VISITOR_TOP_IP_LIMIT = 20
VISITOR_LOCATION_LIMIT = 20
VISITOR_STATS_MAX_DAYS = 30
# 实时日志单次拉取上限
LIVE_LOGS_MAX_LIMIT = 200

# 详细统计的周期预设：period 参数 -> (天数, 描述)；未匹配时回落到 7days
_PERIOD_PRESETS = {
    "7days": (7, "最近7天"),
    "30days": (30, "最近30天"),
    "90days": (90, "最近90天"),
}
_PERIOD_DEFAULT = "7days"


def get_excluded_visitor_ips() -> Set[str]:
    """访客统计的排除 IP：本机回环 + BACKEND_BASE_URL 的主机名（服务器自身流量）+ 配置补充。

    博客前台 SSR 调后端会产生大量服务器自身 IP 的请求，不排除会淹没真实游客分布。
    """
    excluded = {"127.0.0.1", "::1"}
    if settings.BACKEND_BASE_URL:
        host = urlparse(settings.BACKEND_BASE_URL).hostname
        if host:
            excluded.add(host)
    extra = settings.VISITOR_EXCLUDED_IPS
    excluded.update(ip.strip() for ip in extra.split(",") if ip.strip())
    return excluded


def get_site_stats(db: Session) -> SiteStatsResponse:
    """组装站点基本统计（公开仪表盘数据源）"""
    # 计算运行时间
    now = datetime.now()
    uptime = now - START_TIME
    uptime_days = uptime.days
    uptime_hours = uptime.seconds // 3600

    # 获取今日日期范围
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_requests = _get_total_requests(db)
    today_requests = _get_requests_count(db, today_start, now)
    total_visitors = _get_unique_visitors(db)
    today_visitors = _get_today_visitors(db, today_start)

    # 计算平均每日请求数
    if uptime_days > 0:
        average_requests_per_day = round(total_requests / uptime_days, 2)
    else:
        average_requests_per_day = 0.0

    return SiteStatsResponse(
        uptime_days=uptime_days,
        uptime_hours=uptime_hours,
        start_time=START_TIME,
        total_requests=total_requests,
        today_requests=today_requests,
        total_visitors=total_visitors,
        today_visitors=today_visitors,
        average_requests_per_day=average_requests_per_day,
        top_pages=_get_top_pages(db, limit=5),
        album_count=_get_album_count(db),
        photo_count=_get_photo_count(db),
        diary_count=_get_diary_count(db),
        memory_usage_mb=_get_memory_usage(),
        db_connections=_get_db_connections(db),
    )


def get_detailed_stats(db: Session, period: str) -> DetailedStatsResponse:
    """组装详细统计（按周期）"""
    days, period_desc = _PERIOD_PRESETS.get(period, _PERIOD_PRESETS[_PERIOD_DEFAULT])

    now = datetime.now()
    start_date = now - timedelta(days=days)

    return DetailedStatsResponse(
        period=period_desc,
        start_date=start_date,
        end_date=now,
        requests_by_day=_get_requests_by_day(db, start_date, now),
        visitors_by_day=_get_visitors_by_day(db, start_date, now),
        popular_pages=_get_top_pages(db, limit=10),
        referrers=_get_referrers(db, start_date, now),
    )


def get_visitor_stats(db: Session, days: int) -> VisitorStatsResponse:
    """组装访客统计：流量、趋势、来源、板块、Top IP、IP 归属地分布"""
    now = datetime.now()
    # 对齐到自然日：近 N 天 = 今天 + 之前 N-1 个完整自然日，趋势图恰好 N 个点
    start_date = (now - timedelta(days=days - 1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    prev_start = start_date - timedelta(days=days)

    # 一次拉取两个周期的原始行（当前 + 上一周期，用于环比），Python 端统一聚合
    raw_rows = _get_visitor_raw_rows(db, prev_start, now)

    # 服务器自身/内部调用不是游客流量，先排除再聚合
    excluded_ips = get_excluded_visitor_ips()
    rows = [row for row in raw_rows if row.ip not in excluded_ips]
    current_rows = [row for row in rows if row.time >= start_date]
    previous_rows = [row for row in rows if row.time < start_date]

    location_service = get_ip_location_service()

    # ---- 现有口径的聚合（按 IP 归属地 / 省份 / 国家） ----
    ip_groups: Dict[str, Dict[str, Any]] = {}
    for row in current_rows:
        group = ip_groups.setdefault(
            row.ip, {"requests": 0, "first": row.time, "last": row.time}
        )
        group["requests"] += 1
        group["first"] = min(group["first"], row.time)
        group["last"] = max(group["last"], row.time)

    total_requests = sum(g["requests"] for g in ip_groups.values())
    location_totals: Dict[str, Dict[str, int]] = {}
    province_totals: Dict[str, Dict[str, int]] = {}
    country_totals: Dict[str, Dict[str, int]] = {}
    for ip, group in ip_groups.items():
        location = location_service.lookup(ip)
        bucket = location_totals.setdefault(
            location, {"unique_visitors": 0, "requests": 0}
        )
        bucket["unique_visitors"] += 1
        bucket["requests"] += group["requests"]
        province = to_province_bucket(location)
        province_bucket = province_totals.setdefault(
            province, {"unique_visitors": 0, "requests": 0}
        )
        province_bucket["unique_visitors"] += 1
        province_bucket["requests"] += group["requests"]
        country = to_country_bucket(location)
        country_bucket = country_totals.setdefault(
            country, {"unique_visitors": 0, "requests": 0}
        )
        country_bucket["unique_visitors"] += 1
        country_bucket["requests"] += group["requests"]

    top_ips = [
        TopIpItem(
            ip=ip,
            requests=group["requests"],
            first_seen=group["first"],
            last_seen=group["last"],
            location=location_service.lookup(ip),
        )
        for ip, group in sorted(
            ip_groups.items(), key=lambda kv: kv[1]["requests"], reverse=True
        )[:VISITOR_TOP_IP_LIMIT]
    ]
    locations = sorted(
        (
            LocationDistributionItem(location=location, **totals)
            for location, totals in location_totals.items()
        ),
        key=lambda item: (item.unique_visitors, item.requests),
        reverse=True,
    )[:VISITOR_LOCATION_LIMIT]
    province_distribution = sorted(
        (
            ProvinceDistributionItem(province=province, **totals)
            for province, totals in province_totals.items()
        ),
        key=lambda item: (item.unique_visitors, item.requests),
        reverse=True,
    )
    country_distribution = sorted(
        (
            CountryDistributionItem(country=country, **totals)
            for country, totals in country_totals.items()
        ),
        key=lambda item: (item.unique_visitors, item.requests),
        reverse=True,
    )

    return VisitorStatsResponse(
        days=days,
        start_date=start_date,
        end_date=now,
        total_requests=total_requests,
        unique_visitors=len(ip_groups),
        top_ips=top_ips,
        locations=locations,
        province_distribution=province_distribution,
        country_distribution=country_distribution,
        trend=_build_trend(current_rows, start_date, now),
        hourly=_build_hourly(current_rows),
        top_pages=_build_top_pages(current_rows),
        page_sections=_build_page_sections(current_rows),
        referrers=_build_referrers(current_rows),
        traffic_breakdown=_build_traffic_breakdown(current_rows),
        previous_period=_build_previous_period(previous_rows),
    )


def get_live_logs(db: Session, after_id: int, limit: int) -> LiveLogsResponse:
    """增量拉取博客访问日志。

    初始加载（after_id=0）返回最新一页；之后客户端传上次响应的 last_id。
    服务器自身与内部调用流量已排除（与访客统计同一套排除规则）。
    """
    excluded = get_excluded_visitor_ips()
    rows = _get_live_log_rows(db, after_id, limit, excluded)

    location_service = get_ip_location_service()
    logs = [
        LiveLogItem(
            id=row.id,
            ip=row.ip_address,
            location=location_service.lookup(row.ip_address),
            method=row.method,
            path=row.path,
            referrer=row.referrer,
            time=row.created_at,
        )
        for row in rows
    ]
    # 初始加载为 DESC（最新在前），last_id 取首条；增量拉取为 ASC（不丢行），last_id 取末条
    if after_id <= 0:
        last_id = rows[0].id if rows else 0
    else:
        last_id = rows[-1].id if rows else after_id

    return LiveLogsResponse(logs=logs, last_id=last_id)


# 全局函数，用于请求中间件调用
def record_request(ip_address: str, path: str, referrer: str | None = None):
    """记录请求，供中间件使用（线程安全）"""
    global TOTAL_REQUESTS
    with _STATS_LOCK:
        TOTAL_REQUESTS += 1
        # 访客集合有上限，防止长期运行内存泄漏；超出后依赖 DB 查询精确值
        if len(VISITOR_IPS) < MAX_VISITOR_IPS:
            VISITOR_IPS.add(ip_address)


# ==================== 查询辅助函数 ====================


def _get_total_requests(db: Session) -> int:
    """获取总请求数"""
    try:
        # 尝试从请求日志表获取
        result = db.execute(text("SELECT COUNT(*) FROM request_logs")).scalar()
        return result or 0
    except SQLAlchemyError as e:
        # 表不存在时降级到全局计数器
        logger.debug("request_logs 表不可用，降级到内存计数器", exception=e)
        with _STATS_LOCK:
            return TOTAL_REQUESTS


def _get_requests_count(db: Session, start_time: datetime, end_time: datetime) -> int:
    """获取指定时间范围内的请求数"""
    try:
        result = db.execute(
            text(
                "SELECT COUNT(*) FROM request_logs "
                "WHERE created_at BETWEEN :start AND :end"
            ),
            {"start": start_time, "end": end_time},
        ).scalar()
        return result or 0
    except SQLAlchemyError as e:
        logger.debug("request_logs 表查询失败，返回 0", exception=e)
        return 0


def _get_unique_visitors(db: Session) -> int:
    """获取总访问者数量（去重IP）"""
    try:
        result = db.execute(
            text("SELECT COUNT(DISTINCT ip_address) FROM request_logs")
        ).scalar()
        return result or 0
    except SQLAlchemyError as e:
        logger.debug("request_logs 表不可用，降级到内存访客集合", exception=e)
        with _STATS_LOCK:
            return len(VISITOR_IPS)


def _get_today_visitors(db: Session, start_time: datetime) -> int:
    """获取今日访问者数量"""
    try:
        result = db.execute(
            text(
                "SELECT COUNT(DISTINCT ip_address) FROM request_logs "
                "WHERE created_at >= :start"
            ),
            {"start": start_time},
        ).scalar()
        return result or 0
    except SQLAlchemyError as e:
        logger.debug("request_logs 表查询失败，返回 0", exception=e)
        return 0


def _get_top_pages(db: Session, limit: int = 5) -> list:
    """获取热门页面"""
    try:
        result = db.execute(
            text(
                """
                SELECT path, COUNT(*) as visits
                FROM request_logs
                GROUP BY path
                ORDER BY visits DESC
                LIMIT :limit
            """
            ),
            {"limit": limit},
        ).fetchall()

        return [{"path": row[0], "visits": row[1]} for row in result]
    except SQLAlchemyError as e:
        logger.debug("request_logs 表查询失败，返回空列表", exception=e)
        return []


def _get_requests_by_day(db: Session, start_date: datetime, end_date: datetime) -> list:
    """获取每日请求数据"""
    try:
        result = db.execute(
            text(
                """
                SELECT DATE(created_at) as date, COUNT(*) as requests
                FROM request_logs
                WHERE created_at BETWEEN :start AND :end
                GROUP BY DATE(created_at)
                ORDER BY date
            """
            ),
            {"start": start_date, "end": end_date},
        ).fetchall()

        return [{"date": row[0], "requests": row[1]} for row in result]
    except SQLAlchemyError as e:
        # 表不存在时返回空数据
        logger.debug("request_logs 表查询失败，返回空列表", exception=e)
        return []


def _get_visitors_by_day(db: Session, start_date: datetime, end_date: datetime) -> list:
    """获取每日访问者数据"""
    try:
        result = db.execute(
            text(
                """
                SELECT DATE(created_at) as date, COUNT(DISTINCT ip_address) as visitors
                FROM request_logs
                WHERE created_at BETWEEN :start AND :end
                GROUP BY DATE(created_at)
                ORDER BY date
            """
            ),
            {"start": start_date, "end": end_date},
        ).fetchall()

        return [{"date": row[0], "visits": row[1]} for row in result]
    except SQLAlchemyError as e:
        # 表不存在时返回空数据
        logger.debug("request_logs 表查询失败，返回空列表", exception=e)
        return []


def _get_referrers(db: Session, start_date: datetime, end_date: datetime) -> list:
    """获取来源网站"""
    try:
        result = db.execute(
            text(
                """
                SELECT referrer, COUNT(*) as visits
                FROM request_logs
                WHERE created_at BETWEEN :start AND :end
                AND referrer IS NOT NULL AND referrer != ''
                GROUP BY referrer
                ORDER BY visits DESC
                LIMIT 10
            """
            ),
            {"start": start_date, "end": end_date},
        ).fetchall()

        return [{"referrer": row[0], "visits": row[1]} for row in result]
    except SQLAlchemyError as e:
        logger.debug("request_logs 表查询失败，返回空列表", exception=e)
        return []


def _get_album_count(db: Session) -> int:
    """获取相册数量"""
    try:
        result = db.execute(text("SELECT COUNT(*) FROM albums")).scalar()
        return result or 0
    except SQLAlchemyError as e:
        logger.debug("albums 表查询失败，返回 0", exception=e)
        return 0


def _get_photo_count(db: Session) -> int:
    """获取照片数量"""
    try:
        result = db.execute(text("SELECT COUNT(*) FROM photos")).scalar()
        return result or 0
    except SQLAlchemyError as e:
        logger.debug("photos 表查询失败，返回 0", exception=e)
        return 0


def _get_diary_count(db: Session) -> int:
    """获取日记数量"""
    try:
        result = db.execute(text("SELECT COUNT(*) FROM diaries")).scalar()
        return result or 0
    except SQLAlchemyError as e:
        logger.debug("diaries 表查询失败，返回 0", exception=e)
        return 0


def _get_memory_usage() -> float:
    """获取内存使用量(MB)"""
    try:
        import psutil

        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
        return round(memory_mb, 2)
    except Exception as e:
        logger.debug("psutil 不可用，返回 0.0", exception=e)
        return 0.0


def _get_db_connections(db: Session) -> int:
    """获取数据库连接数"""
    try:
        # 这里返回连接池中的连接数，实际可能需要更复杂的查询
        return 1
    except Exception:
        return 0


# ==================== 访客深度分析辅助函数 ====================


class _VisitorRow(NamedTuple):
    """访客日志原始行（内存聚合用）"""

    ip: str
    path: str
    user_agent: Optional[str]
    referrer: Optional[str]
    time: datetime


def _to_datetime(value) -> datetime:
    """原生 SQL 的 created_at 只有 ORM 查询才会转成 datetime，SQLite 驱动返回字符串；
    在查询边界统一收口为 datetime，避免 Python 端聚合因数据库差异抛 TypeError"""
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


def _get_visitor_raw_rows(
    db: Session, start_date: datetime, end_date: datetime
) -> List[_VisitorRow]:
    """拉取时间范围内全部请求日志原始行（Python 端聚合，灵活支撑多维度）"""
    try:
        result = db.execute(
            text(
                """
                SELECT ip_address, path, user_agent, referrer, created_at
                FROM request_logs
                WHERE created_at >= :start AND created_at <= :end
            """
            ),
            {"start": start_date, "end": end_date},
        ).fetchall()
        return [
            _VisitorRow(
                ip=row[0],
                path=row[1],
                user_agent=row[2],
                referrer=row[3],
                time=_to_datetime(row[4]),
            )
            for row in result
        ]
    except SQLAlchemyError as e:
        logger.debug("request_logs 原始行查询失败，返回空列表", exception=e)
        return []


_BOT_UA_RE = re.compile(
    r"bot|spider|crawler|slurp|curl|wget|python-requests|aiohttp|httpx|scrapy|"
    r"facebookexternalhit|twitterbot|whatsapp|telegram|headless|phantom|puppeteer",
    re.IGNORECASE,
)


def _is_bot(user_agent: Optional[str]) -> bool:
    """基于 User-Agent 的简易爬虫判定（user_agent 为空的旧日志按真人计）"""
    return bool(user_agent) and bool(_BOT_UA_RE.search(user_agent or ""))


def _build_trend(
    rows: List[_VisitorRow], start_date: datetime, end_date: datetime
) -> List[TrendItem]:
    """每日趋势：请求数 + 去重访客，缺失日期补零，保证折线连续"""
    day_map: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        key = row.time.strftime("%Y-%m-%d")
        bucket = day_map.setdefault(key, {"requests": 0, "ips": set()})
        bucket["requests"] += 1
        bucket["ips"].add(row.ip)

    items: List[TrendItem] = []
    cursor = start_date.date()
    end_day = end_date.date()
    while cursor <= end_day:
        key = cursor.strftime("%Y-%m-%d")
        bucket = day_map.get(key, {"requests": 0, "ips": set()})
        items.append(
            TrendItem(
                date=key,
                requests=bucket["requests"],
                unique_visitors=len(bucket["ips"]),
            )
        )
        cursor += timedelta(days=1)
    return items


def _build_hourly(rows: List[_VisitorRow]) -> List[HourlyItem]:
    """24 小时访问分布：看出一天中的访问高峰时段"""
    hour_map: Dict[int, Dict[str, Any]] = {
        hour: {"requests": 0, "ips": set()} for hour in range(24)
    }
    for row in rows:
        bucket = hour_map[row.time.hour]
        bucket["requests"] += 1
        bucket["ips"].add(row.ip)
    return [
        HourlyItem(
            hour=hour, requests=bucket["requests"], unique_visitors=len(bucket["ips"])
        )
        for hour, bucket in hour_map.items()
    ]


# 受访页面 TOP 统计排除：后台自身的轮询/登录等噪声路径
_TOP_PAGE_EXCLUDED_PREFIXES = (
    "/api/v1/site-stats",
    "/api/v1/auth",
    "/docs",
    "/openapi.json",
    "/redoc",
)


def _build_top_pages(rows: List[_VisitorRow]) -> List[TopPageItem]:
    """受访页面 TOP：按独立访客优先排序"""
    page_map: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        if row.path.startswith(_TOP_PAGE_EXCLUDED_PREFIXES):
            continue
        bucket = page_map.setdefault(row.path, {"requests": 0, "ips": set()})
        bucket["requests"] += 1
        bucket["ips"].add(row.ip)
    items = sorted(
        page_map.items(),
        key=lambda kv: (len(kv[1]["ips"]), kv[1]["requests"]),
        reverse=True,
    )[:15]
    return [
        TopPageItem(
            path=path, requests=bucket["requests"], unique_visitors=len(bucket["ips"])
        )
        for path, bucket in items
    ]


# 路径前缀 → 内容板块（按主路由挂载整理，命中第一个前缀即止）
_PAGE_SECTION_RULES = [
    ("/api/v1/md-files", "博客文章"),
    ("/api/v1/md-file-archive", "博客归档"),
    ("/api/v1/diaries", "日记"),
    ("/api/v1/albums", "相册"),
    ("/api/v1/music", "音乐"),
    ("/api/v1/game", "游戏"),
    ("/api/v1/projects", "项目"),
    ("/api/v1/skills", "技能"),
    ("/api/v1/timelines", "时间线"),
    ("/api/v1/about", "关于"),
    ("/api/v1/links", "友情链接"),
    ("/api/v1/anime-watchlist", "追番追剧"),
    ("/api/v1/ai", "AI 服务"),
    ("/api/v1/proxy", "媒体代理"),
    ("/api/proxy", "媒体代理"),
    ("/api/v1/site-config", "站点配置"),
    ("/api/v1/site-stats", "统计面板"),
    ("/api/v1/system-logs", "系统日志"),
    ("/api/v1/admin", "后台管理"),
    ("/api/v1/scheduler", "定时任务"),
    ("/api/v1/users", "账户管理"),
    ("/api/v1/auth", "登录鉴权"),
    ("/rss", "订阅推送"),
]


def _classify_section(path: str) -> str:
    """把请求路径归入业务板块"""
    if path == "/":
        return "首页"
    if "." in path.rsplit("/", 1)[-1]:
        return "静态资源"
    for prefix, section in _PAGE_SECTION_RULES:
        if path.startswith(prefix):
            return section
    if path.startswith("/api/"):
        return "其他接口"
    return "其他"


def _build_page_sections(rows: List[_VisitorRow]) -> List[PageSectionItem]:
    """内容板块分布：访客真正在消费哪类内容"""
    section_map: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        section = _classify_section(row.path)
        bucket = section_map.setdefault(section, {"requests": 0, "ips": set()})
        bucket["requests"] += 1
        bucket["ips"].add(row.ip)
    items = sorted(
        section_map.items(),
        key=lambda kv: (len(kv[1]["ips"]), kv[1]["requests"]),
        reverse=True,
    )
    return [
        PageSectionItem(
            section=section,
            requests=bucket["requests"],
            unique_visitors=len(bucket["ips"]),
        )
        for section, bucket in items
    ]


# 搜索引擎域名特征（命中即归类为搜索来源）
_SEARCH_ENGINE_HINTS = (
    "baidu.com",
    "google.",
    "bing.com",
    "sogou.com",
    "so.com",
    "duckduckgo.com",
    "yahoo.",
    "yandex.",
    "sm.cn",
)


def _classify_referrer(referrer: Optional[str]) -> tuple:
    """来源归类：返回 (域名, 类型)；无来源返回 ('', 'direct')"""
    if not referrer:
        return "", "direct"
    host = urlparse(referrer).netloc.lower()
    if not host:
        return "", "direct"
    if any(hint in host for hint in _SEARCH_ENGINE_HINTS):
        return host, "search"
    return host, "external"


def _build_referrers(rows: List[_VisitorRow]) -> List[ReferrerItem]:
    """来源分布：按域名聚合，区分直接访问/搜索引擎/外部链接"""
    ref_map: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        domain, ref_type = _classify_referrer(row.referrer)
        key = f"{ref_type}:{domain}"
        bucket = ref_map.setdefault(
            key,
            {"domain": domain, "referrer_type": ref_type, "requests": 0, "ips": set()},
        )
        bucket["requests"] += 1
        bucket["ips"].add(row.ip)
    buckets = sorted(
        ref_map.values(), key=lambda b: (b["requests"], len(b["ips"])), reverse=True
    )[:15]
    return [
        ReferrerItem(
            domain=bucket["domain"],
            referrer_type=bucket["referrer_type"],
            requests=bucket["requests"],
            unique_visitors=len(bucket["ips"]),
        )
        for bucket in buckets
    ]


def _build_traffic_breakdown(rows: List[_VisitorRow]) -> TrafficBreakdown:
    """流量构成：真人访客 vs 爬虫（user_agent 为空的旧日志按真人计）"""
    human_requests = bot_requests = 0
    human_ips: Set[str] = set()
    bot_ips: Set[str] = set()
    for row in rows:
        if _is_bot(row.user_agent):
            bot_requests += 1
            bot_ips.add(row.ip)
        else:
            human_requests += 1
            human_ips.add(row.ip)
    return TrafficBreakdown(
        human_requests=human_requests,
        bot_requests=bot_requests,
        human_visitors=len(human_ips),
        bot_visitors=len(bot_ips),
    )


def _build_previous_period(rows: List[_VisitorRow]) -> PreviousPeriod:
    """上一同长周期概览，用于环比对比"""
    return PreviousPeriod(
        total_requests=len(rows),
        unique_visitors=len({row.ip for row in rows}),
    )


def _get_live_log_rows(
    db: Session, after_id: int, limit: int, excluded_ips: Set[str]
) -> list:
    """拉取实时日志行：初始加载取最新 limit 条（新→旧），增量拉取取游标之后的最早 limit 条（旧→新，保证不丢行）"""
    try:
        query = db.query(RequestLog)
        if excluded_ips:
            query = query.filter(~RequestLog.ip_address.in_(excluded_ips))
        if after_id > 0:
            query = query.filter(RequestLog.id > after_id).order_by(RequestLog.id.asc())
        else:
            query = query.order_by(RequestLog.id.desc())
        return query.limit(limit).all()
    except SQLAlchemyError as e:
        logger.debug("request_logs 表查询失败，返回空列表", exception=e)
        return []

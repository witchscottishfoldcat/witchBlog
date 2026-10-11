"""站点统计 API 的响应模型。"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class SiteStatsResponse(BaseModel):
    """站点统计响应模型"""

    uptime_days: int = Field(..., description="站点运行天数")
    uptime_hours: int = Field(..., description="站点运行小时数")
    start_time: datetime = Field(..., description="站点启动时间")
    total_requests: int = Field(..., description="总请求次数")
    today_requests: int = Field(..., description="今日请求次数")
    total_visitors: int = Field(..., description="总访问者数量")
    today_visitors: int = Field(..., description="今日访问者数量")
    average_requests_per_day: float = Field(..., description="平均每日请求数")
    top_pages: list = Field(default_factory=list, description="热门页面")
    album_count: int = Field(..., description="相册数量")
    photo_count: int = Field(..., description="照片数量")
    diary_count: int = Field(..., description="日记数量")
    memory_usage_mb: float = Field(..., description="内存使用量(MB)")
    db_connections: int = Field(..., description="数据库连接数")


class DetailedStatsResponse(BaseModel):
    """详细统计响应模型"""

    period: str = Field(..., description="统计周期")
    start_date: datetime = Field(..., description="开始日期")
    end_date: datetime = Field(..., description="结束日期")
    requests_by_day: list = Field(..., description="每日请求数据")
    visitors_by_day: list = Field(..., description="每日访问者数据")
    popular_pages: list = Field(..., description="热门页面")
    referrers: list = Field(default_factory=list, description="来源网站")


class TopIpItem(BaseModel):
    """访客 IP 明细项"""

    ip: str = Field(..., description="访客 IP")
    requests: int = Field(..., description="请求次数")
    first_seen: datetime = Field(..., description="首次访问时间")
    last_seen: datetime = Field(..., description="最近访问时间")
    location: str = Field(..., description="IP 归属地")


class LocationDistributionItem(BaseModel):
    """IP 归属地分布项"""

    location: str = Field(..., description="归属地")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")
    requests: int = Field(..., description="请求次数")


class ProvinceDistributionItem(BaseModel):
    """省份维度分布项（地图展示用：国内按省聚合，海外/本地网络/未知各一桶）"""

    province: str = Field(..., description="省份短名或聚合桶名")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")
    requests: int = Field(..., description="请求次数")


class CountryDistributionItem(BaseModel):
    """国家维度分布项（世界地图展示用：国内统一为「中国」，国外为中文国家名）"""

    country: str = Field(..., description="国家名或聚合桶名")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")
    requests: int = Field(..., description="请求次数")


class LiveLogItem(BaseModel):
    """实时日志条目"""

    id: int = Field(..., description="日志自增 ID（游标）")
    ip: str = Field(..., description="访客 IP")
    location: str = Field(..., description="IP 归属地")
    method: str = Field(..., description="HTTP 方法")
    path: str = Field(..., description="请求路径")
    referrer: Optional[str] = Field(None, description="来源页")
    time: datetime = Field(..., description="请求时间")


class LiveLogsResponse(BaseModel):
    """实时日志响应"""

    logs: List[LiveLogItem] = Field(default_factory=list, description="日志条目（新→旧）")
    last_id: int = Field(..., description="最新日志 ID，下次拉取作为 after_id 游标传入")


class TrendItem(BaseModel):
    """每日趋势项"""

    date: str = Field(..., description="日期（YYYY-MM-DD）")
    requests: int = Field(..., description="请求次数")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")


class HourlyItem(BaseModel):
    """小时分布项"""

    hour: int = Field(..., description="小时（0-23）")
    requests: int = Field(..., description="请求次数")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")


class TopPageItem(BaseModel):
    """受访页面项"""

    path: str = Field(..., description="请求路径")
    requests: int = Field(..., description="请求次数")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")


class PageSectionItem(BaseModel):
    """内容板块分布项"""

    section: str = Field(..., description="板块名（文章/相册/首页/接口等）")
    requests: int = Field(..., description="请求次数")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")


class ReferrerItem(BaseModel):
    """来源分布项（按域名聚合）"""

    domain: str = Field(..., description="来源域名；空串表示直接访问")
    referrer_type: str = Field(..., description="来源类型：direct / search / external")
    requests: int = Field(..., description="请求次数")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")


class TrafficBreakdown(BaseModel):
    """流量构成：真人访客与爬虫"""

    human_requests: int = Field(..., description="真人请求数")
    bot_requests: int = Field(..., description="爬虫请求数")
    human_visitors: int = Field(..., description="真人独立访客数")
    bot_visitors: int = Field(..., description="爬虫独立 IP 数")


class PreviousPeriod(BaseModel):
    """上一同长统计周期（用于环比）"""

    total_requests: int = Field(..., description="上一周期总请求数")
    unique_visitors: int = Field(..., description="上一周期独立访客数")


class VisitorStatsResponse(BaseModel):
    """访客统计响应模型"""

    days: int = Field(..., description="统计天数")
    start_date: datetime = Field(..., description="开始时间")
    end_date: datetime = Field(..., description="结束时间")
    total_requests: int = Field(..., description="总请求数")
    unique_visitors: int = Field(..., description="独立访客数（去重 IP）")
    top_ips: list = Field(default_factory=list, description="访问次数最多的 IP 列表")
    locations: list = Field(default_factory=list, description="IP 归属地分布")
    province_distribution: list = Field(
        default_factory=list, description="省份维度分布（国内按省聚合）"
    )
    country_distribution: list = Field(
        default_factory=list, description="国家维度分布（国内统一为中国）"
    )
    trend: list = Field(default_factory=list, description="每日趋势（请求 + 独立访客）")
    hourly: list = Field(default_factory=list, description="24 小时访问分布")
    top_pages: list = Field(default_factory=list, description="受访页面 TOP（已过滤静态资源与接口）")
    page_sections: list = Field(default_factory=list, description="内容板块分布")
    referrers: list = Field(default_factory=list, description="来源分布（按域名聚合）")
    traffic_breakdown: Optional[TrafficBreakdown] = Field(
        default=None, description="真人/爬虫流量构成"
    )
    previous_period: Optional[PreviousPeriod] = Field(
        default=None, description="上一同长周期概览（环比用）"
    )

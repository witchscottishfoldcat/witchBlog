"""站点统计 API：HTTP 参数与权限控制，数据查询与聚合见 site_stats_service。"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser
from app.core.database import get_db
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.site_stats import (
    DetailedStatsResponse,
    LiveLogsResponse,
    SiteStatsResponse,
    VisitorStatsResponse,
)
from app.services import site_stats_service

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=SiteStatsResponse)
async def get_site_stats(
    db: Session = Depends(get_db),
) -> SiteStatsResponse:
    """获取站点基本统计信息（公开只读，供公开仪表盘展示；/detailed 仍仅超级管理员）。"""
    try:
        return site_stats_service.get_site_stats(db)
    except Exception as e:
        logger.error(f"获取站点统计失败: {e}", exception=e)
        raise


@router.get("/detailed", response_model=DetailedStatsResponse)
async def get_detailed_stats(
    period: str = Query("7days", description="统计周期: 7days, 30days, 90days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> DetailedStatsResponse:
    """获取详细统计信息（仅超级管理员）。"""
    try:
        return site_stats_service.get_detailed_stats(db, period)
    except Exception as e:
        logger.error(f"获取详细统计失败: {e}", exception=e)
        raise


@router.get("/visitors", response_model=VisitorStatsResponse)
async def get_visitor_stats(
    days: int = Query(
        7,
        ge=1,
        le=site_stats_service.VISITOR_STATS_MAX_DAYS,
        description="统计天数（访问日志保留 30 天）",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> VisitorStatsResponse:
    """获取访客统计：流量、趋势、来源、板块、Top IP、IP 归属地分布（仅超级管理员）"""
    try:
        return site_stats_service.get_visitor_stats(db, days)
    except Exception as e:
        logger.error(f"获取访客统计失败: {e}", exception=e)
        raise


@router.get("/live-logs", response_model=LiveLogsResponse)
async def get_live_logs(
    after_id: int = Query(
        0,
        ge=0,
        description="游标：只返回 id 大于该值的日志；0 表示初始加载（返回最新一页）",
    ),
    limit: int = Query(
        50, ge=1, le=site_stats_service.LIVE_LOGS_MAX_LIMIT, description="单次拉取条数"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> LiveLogsResponse:
    """增量拉取博客访问日志（仅超级管理员）。

    客户端轮询：首次不传 after_id 拿最新一页；之后每次传上次响应的 last_id。
    服务器自身与内部调用流量已排除（与访客统计同一套排除规则）。
    """
    try:
        return site_stats_service.get_live_logs(db, after_id, limit)
    except Exception as e:
        logger.error(f"获取实时日志失败: {e}", exception=e)
        raise

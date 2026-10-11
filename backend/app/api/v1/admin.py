"""
后台管理 API - 仅超级管理员可访问
提供系统监控、日志查看、性能指标等功能
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser
from app.core.database import get_db
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.admin import (
    ApplicationPerformanceMetrics,
    BusinessMetrics,
    DatabasePerformanceMetrics,
    DatabasePoolStatus,
    PerformanceResponse,
    SystemPerformanceMetrics,
    SystemStatusResponse,
)
from app.services.log_stream_service import get_log_stream_service
from app.services.performance_monitor import get_performance_monitor

logger = get_logger(__name__)
router = APIRouter()


@router.get("/logs/stream")
async def stream_logs(
    level: Optional[str] = Query(None, description="日志级别过滤"),
    module: Optional[str] = Query(None, description="模块名过滤"),
    lines: int = Query(100, ge=1, le=10000, description="初始返回的日志行数"),
    follow: bool = Query(True, description="是否持续跟踪新日志"),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    实时日志流接口

    使用 Server-Sent Events (SSE) 实时推送日志

    参数:
        level: 日志级别过滤 (DEBUG, INFO, WARNING, ERROR)
        module: 模块名过滤
        lines: 初始返回的日志行数
        follow: 是否持续跟踪新日志

    返回:
        SSE 流，每行日志作为一个事件
    """
    logger.info(f"超级管理员 {current_user.username} 请求实时日志流")

    log_stream_service = get_log_stream_service()

    async def generate():
        async for log_line in log_stream_service.stream_logs(
            level=level, module=module, initial_lines=lines, follow=follow
        ):
            yield log_line

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/logs/files")
async def get_log_files(current_user: User = Depends(get_current_active_superuser)):
    """
    获取可用的日志文件列表

    返回:
        日志文件列表，包含文件名、路径、大小和修改时间
    """
    logger.info(f"超级管理员 {current_user.username} 请求日志文件列表")

    log_stream_service = get_log_stream_service()
    log_files = log_stream_service.get_log_files()

    return {"success": True, "data": log_files, "count": len(log_files)}


@router.get("/logs/stats")
async def get_log_stats(current_user: User = Depends(get_current_active_superuser)):
    """
    获取日志统计信息

    返回:
        日志统计信息，包含总行数、各级别日志数量、文件大小等
    """
    logger.info(f"超级管理员 {current_user.username} 请求日志统计信息")

    log_stream_service = get_log_stream_service()
    stats = log_stream_service.get_log_stats()

    return {"success": True, "data": stats}


@router.get("/performance", response_model=PerformanceResponse)
async def get_performance_metrics(
    use_cache: bool = Query(True, description="是否使用缓存"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    获取性能监控指标

    返回系统、应用、数据库和业务的完整性能指标

    返回:
        PerformanceResponse 包含所有性能指标
    """
    logger.info(f"超级管理员 {current_user.username} 请求性能指标")

    performance_monitor = get_performance_monitor()
    metrics = performance_monitor.get_all_metrics(db, use_cache=use_cache)

    return metrics


@router.get("/system-status", response_model=SystemStatusResponse)
async def get_system_status(current_user: User = Depends(get_current_active_superuser)):
    """
    获取系统状态

    返回系统整体健康状态和各组件状态

    返回:
        SystemStatusResponse 包含系统状态信息
    """
    logger.info(f"超级管理员 {current_user.username} 请求系统状态")

    performance_monitor = get_performance_monitor()
    status_data = performance_monitor.get_system_status()

    return SystemStatusResponse(**status_data)


@router.get("/database-pool", response_model=DatabasePoolStatus)
async def get_database_pool_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    获取数据库连接池状态

    返回数据库连接池的详细状态信息

    返回:
        DatabasePoolStatus 包含连接池状态
    """
    logger.info(f"超级管理员 {current_user.username} 请求数据库连接池状态")

    from app.core.database import get_connection_pool_stats, health_check

    pool_stats = get_connection_pool_stats()
    health_result = health_check()

    return DatabasePoolStatus(
        pool_size=pool_stats.get("pool_size", 0),
        max_overflow=pool_stats.get("max_overflow", 0),
        checked_in=pool_stats.get("checked_in", 0),
        checked_out=pool_stats.get("checked_out", 0),
        overflow=pool_stats.get("overflow", 0),
        invalid=pool_stats.get("connection_errors", 0),
        total_connections=pool_stats.get("total_connections", 0),
        connection_errors=pool_stats.get("connection_errors", 0),
        current_connections=pool_stats.get("current_connections", 0),
        status=health_result.get("status", "unknown"),
    )


@router.get("/performance/system", response_model=SystemPerformanceMetrics)
async def get_system_performance(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    获取系统性能指标

    返回 CPU、内存、磁盘、网络等系统性能指标

    返回:
        SystemPerformanceMetrics 系统性能指标
    """
    logger.info(f"超级管理员 {current_user.username} 请求系统性能指标")

    performance_monitor = get_performance_monitor()
    metrics = performance_monitor.get_system_metrics()

    return metrics


@router.get("/performance/application", response_model=ApplicationPerformanceMetrics)
async def get_application_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    获取应用性能指标

    返回请求数、响应时间、错误率等应用性能指标

    返回:
        ApplicationPerformanceMetrics 应用性能指标
    """
    logger.info(f"超级管理员 {current_user.username} 请求应用性能指标")

    performance_monitor = get_performance_monitor()
    metrics = performance_monitor.get_application_metrics(db)

    return metrics


@router.get("/performance/database", response_model=DatabasePerformanceMetrics)
async def get_database_performance(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    获取数据库性能指标

    返回连接池、查询等数据库性能指标

    返回:
        DatabasePerformanceMetrics 数据库性能指标
    """
    logger.info(f"超级管理员 {current_user.username} 请求数据库性能指标")

    performance_monitor = get_performance_monitor()
    metrics = performance_monitor.get_database_metrics()

    return metrics


@router.get("/performance/business", response_model=BusinessMetrics)
async def get_business_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    获取业务指标

    返回用户数、内容数、访问量等业务指标

    返回:
        BusinessMetrics 业务指标
    """
    logger.info(f"超级管理员 {current_user.username} 请求业务指标")

    performance_monitor = get_performance_monitor()
    metrics = performance_monitor.get_business_metrics(db)

    return metrics


@router.get("/dashboard")
async def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    获取后台管理仪表盘数据

    返回后台管理所需的所有关键数据

    返回:
        包含系统状态、性能指标、日志统计等综合数据
    """
    logger.info(f"超级管理员 {current_user.username} 请求后台管理仪表盘")

    performance_monitor = get_performance_monitor()
    log_stream_service = get_log_stream_service()

    performance = performance_monitor.get_all_metrics(db, use_cache=True)
    system_status = performance_monitor.get_system_status()
    log_stats = log_stream_service.get_log_stats()
    log_files = log_stream_service.get_log_files()

    return {
        "success": True,
        "data": {
            "system_status": system_status,
            "performance": performance,
            "log_stats": log_stats,
            "log_files": log_files,
            "timestamp": performance.timestamp,
        },
    }


@router.get("/health-check")
async def admin_health_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    后台管理健康检查

    检查后台管理功能是否正常工作

    返回:
        健康检查结果
    """
    try:
        performance_monitor = get_performance_monitor()
        log_stream_service = get_log_stream_service()

        checks = {
            "performance_monitor": performance_monitor is not None,
            "log_stream_service": log_stream_service is not None,
            "database": db is not None,
            "system_metrics": True,
            "log_file": log_stream_service._log_file_path is not None
            if hasattr(log_stream_service, "_log_file_path")
            else False,
        }

        all_healthy = all(checks.values())

        return {
            "status": "healthy" if all_healthy else "degraded",
            "checks": checks,
            "timestamp": str(performance_monitor.start_time),
        }
    except Exception as e:
        logger.error(f"后台管理健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": str(performance_monitor.start_time),
        }

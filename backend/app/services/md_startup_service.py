import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

from app.core.config import settings
from app.core.storage_paths import MD_PROXY_URL_PREFIX
from app.services.md_monitor_service import md_monitor_service

logger = logging.getLogger(__name__)


class MDStartupService:
    """MD文件缓存代理系统的启动服务"""

    def __init__(self):
        self.monitor_task: Optional[asyncio.Task] = None
        self.enabled = getattr(settings, "ENABLE_MD_CACHE_MONITOR", True)  # 默认启用监控

    async def start_services(self):
        """启动所有相关服务"""
        logger.info("启动MD文件缓存代理服务")

        # 启动文件监控任务
        if self.enabled:
            self.monitor_task = asyncio.create_task(
                md_monitor_service.start_monitoring()
            )
            logger.info("文件监控任务已启动")
        else:
            logger.info("文件监控任务已禁用")

    async def stop_services(self):
        """停止所有相关服务"""
        logger.info("停止MD文件缓存代理服务")

        # 停止文件监控任务
        if self.monitor_task and not self.monitor_task.done():
            md_monitor_service.stop_monitoring()
            try:
                self.monitor_task.cancel()
                await self.monitor_task
            except asyncio.CancelledError:
                logger.info("文件监控任务已取消")

        logger.info("MD文件缓存代理服务已停止")


# 创建全局启动服务实例
md_startup_service = MDStartupService()


@asynccontextmanager
async def lifespan_manager(app):
    """FastAPI应用生命周期管理器"""
    # 启动时执行
    await md_startup_service.start_services()

    yield

    # 关闭时执行
    await md_startup_service.stop_services()


# 启动服务的便捷函数
def get_proxy_url(file_id: int) -> str:
    """获取MD文件的代理URL"""
    return f"{MD_PROXY_URL_PREFIX}{file_id}"


def get_cache_stats():
    """获取缓存统计信息"""
    from app.services.md_cache_service import md_cache_service

    return md_cache_service.get_cache_stats()


def invalidate_cache(file_url: str) -> bool:
    """使指定文件的缓存失效"""
    from app.services.md_cache_service import md_cache_service

    return md_cache_service.invalidate_cache(file_url)


def clean_expired_cache() -> int:
    """清理过期的缓存文件"""
    from app.services.md_cache_service import md_cache_service

    return md_cache_service.clean_expired_cache()

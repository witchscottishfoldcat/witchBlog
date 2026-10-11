"""前台（Next.js）页面缓存刷新通知。

归档/删除等后台操作会改变前台 ISR 页面（如 /zh/archive）的数据，
而页面 revalidate=60 意味着最长一分钟内访客看到的仍是旧页面。
操作成功后主动调用前台 /api/site-config/revalidate 可立即失效缓存。

配置（与 POST /api/v1/site-config/revalidate-frontend 端点共用同一组）：
- FRONTEND_BASE_URL：前台地址，如 http://127.0.0.1:8888
- FRONTEND_REVALIDATE_SECRET：须与前台的 REVALIDATE_SECRET 一致

任何失败只记日志、绝不抛异常：缓存刷新是尽力而为的增强，
不能影响归档/删除等业务操作本身的结果。
"""

import httpx

from app.core.config import settings
from app.core.unified_logging import get_logger

logger = get_logger(__name__)

REVALIDATE_TIMEOUT_SECONDS = 5


def notify_frontend_revalidate() -> bool:
    """尽力通知前台清除页面缓存；未配置或失败时返回 False，不抛异常。"""
    if not settings.FRONTEND_BASE_URL or not settings.FRONTEND_REVALIDATE_SECRET:
        return False
    url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/api/site-config/revalidate"
    try:
        with httpx.Client(timeout=REVALIDATE_TIMEOUT_SECONDS) as client:
            resp = client.post(
                url, json={"secret": settings.FRONTEND_REVALIDATE_SECRET}
            )
        if resp.status_code == 200:
            logger.info(f"前台页面缓存刷新成功: {url}")
            return True
        logger.warning(f"前台页面缓存刷新返回 HTTP {resp.status_code}: {url}")
    except httpx.HTTPError as e:
        logger.warning(f"前台页面缓存刷新失败（网络错误）: {e}")
    return False

"""出站图片抓取服务：SSRF 防护 + 响应大小限制 + 内容类型校验的统一入口。

全局图片代理（/api/proxy-image）、/api/v1/proxy 图片族端点、
追番封面代理共用本模块，避免各路由重复实现同一套抓取与校验逻辑。
"""
import httpx
from fastapi import HTTPException

from app.core import ssrf_guard
from app.core.unified_logging import get_logger

logger = get_logger(__name__)

# 安全常量：限制单次代理请求的响应体大小，防止大文件耗尽内存/带宽
PROXY_MAX_CONTENT_BYTES = 10 * 1024 * 1024  # 10MB
PROXY_TIMEOUT_SECONDS = 15.0

# 模拟常见浏览器头的出站请求头，降低被目标站点拒绝的概率
BROWSER_LIKE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/91.0.4472.124 Safari/537.36"
    ),
    "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


async def fetch_with_size_limit(client: httpx.AsyncClient, url: str) -> httpx.Response:
    """
    发起 GET 请求并在读取响应时做大小限制。

    通过逐块读取 content-length 或流式累加实现，超过上限立即中断。
    """
    response = await client.get(url)
    response.raise_for_status()

    # 先检查 content-length（如果服务端提供）
    declared_length = response.headers.get("content-length")
    if declared_length and declared_length.isdigit():
        if int(declared_length) > PROXY_MAX_CONTENT_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"目标资源过大（{int(declared_length) // 1024}KB），超过代理上限",
            )

    # 再检查实际读取到的内容大小（防止服务端不返回 content-length 或撒谎）
    if len(response.content) > PROXY_MAX_CONTENT_BYTES:
        raise HTTPException(
            status_code=413,
            detail="目标资源过大，超过代理上限",
        )

    return response


async def fetch_image(
    url: str,
    *,
    timeout: float = PROXY_TIMEOUT_SECONDS,
    headers: dict | None = None,
    default_content_type: str = "image/jpeg",
) -> tuple[bytes, str]:
    """抓取远程图片并校验内容类型，返回 (content, content_type)。

    错误语义（与历史各图片代理端点保持一致）：
    - 无效/被禁 URL（SSRF 校验失败）-> 400
    - 目标 HTTP 失败 -> 404
    - 响应不是图片 -> 400
    - 超过大小上限 -> 413
    - 其他异常 -> 500
    """
    try:
        # 在 async with 内读完内容再返回，避免 StreamingResponse 在上下文退出后读已关闭的流
        # 关闭 follow_redirects 防止外网→内网重定向绕过 SSRF 校验
        async with ssrf_guard.create_safe_async_client(
            url, timeout=timeout, follow_redirects=False, headers=headers
        ) as client:
            response = await fetch_with_size_limit(client, url)

            content_type = response.headers.get("content-type", default_content_type)
            if not content_type.startswith("image/"):
                raise HTTPException(
                    status_code=400, detail="URL does not point to an image"
                )

            return response.content, content_type

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or forbidden image URL")
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching image: {e}")
        raise HTTPException(status_code=404, detail="Failed to fetch image")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error proxying image: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

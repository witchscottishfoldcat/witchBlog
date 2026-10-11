"""全局图片代理路由（/api/proxy-image），供前端跨域引用外部图片。"""
from fastapi import APIRouter, Query
from fastapi.responses import Response

from app.services.image_proxy_service import BROWSER_LIKE_HEADERS, fetch_image

router = APIRouter()

# 全局匿名代理的抓取超时：比 /api/v1/proxy 族的 15s 更宽松，保持历史行为
GLOBAL_PROXY_TIMEOUT_SECONDS = 30.0


@router.get("/proxy-image")
async def proxy_image(url: str = Query(..., description="图片URL")):
    """
    全局图片代理端点 - 解决前端跨域获取图片的问题

    使用方式:
    前端: <img src="/api/proxy-image?url=<图片URL>" />
    """
    content, content_type = await fetch_image(
        url, timeout=GLOBAL_PROXY_TIMEOUT_SECONDS, headers=BROWSER_LIKE_HEADERS
    )

    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",  # 缓存一天
            "X-Content-Type-Options": "nosniff",  # 防止图片被当作可执行内容
            "Access-Control-Allow-Origin": "*",  # 允许跨域访问
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",  # 允许跨域使用资源
        },
    )

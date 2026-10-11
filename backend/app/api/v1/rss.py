"""RSS API路由模块，提供RSS feed访问接口"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from loguru import logger
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.services.rss import rss_service

router = APIRouter()


@router.get("/feed", response_class=Response)
def get_rss_feed(
    request: Request,
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="RSS feed中包含的文章数量"),
    refresh: bool = Query(False, description="是否强制刷新缓存"),
) -> Response:
    """
    获取全局RSS feed

    返回包含最新公开文章的RSS 2.0格式XML内容。

    - 包含最新的公开MD文件（is_public=True）
    - 默认显示10篇文章，最多支持100篇
    - 使用站点配置作为feed元数据
    - 符合RSS 2.0标准格式
    - 支持缓存（默认10分钟），可通过refresh参数强制刷新

    Returns:
        Response: application/xml格式的RSS内容
    """
    try:
        # 构建feed URL
        scheme = request.url.scheme
        host = request.url.netloc
        feed_url = f"{scheme}://{host}/rss/feed"

        logger.info(f"正在生成RSS feed，URL: {feed_url}，限制: {limit} 篇文章，强制刷新: {refresh}")

        # 生成RSS XML（带缓存）
        rss_xml = rss_service.generate_rss_feed(
            db=db, feed_url=feed_url, limit=limit, force_refresh=refresh
        )

        # 返回XML响应
        return Response(
            content=rss_xml,
            media_type="application/rss+xml",
            headers={
                "Cache-Control": "public, max-age=300",  # 缓存5分钟
                "X-Content-Type-Options": "nosniff",
            },
        )

    except Exception as e:
        logger.error(f"生成RSS feed时发生错误: {str(e)}")
        # 返回错误信息（以XML格式，保持一致性）
        error_xml = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RSS Feed Error</title>
    <description>无法生成RSS feed，请稍后再试</description>
  </channel>
</rss>"""
        return Response(
            content=error_xml, media_type="application/rss+xml", status_code=500
        )


@router.delete("/cache", response_model=dict)
def clear_rss_cache(
    limit: Optional[int] = Query(None, ge=1, le=100, description="清除指定limit的缓存"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    清除RSS缓存（需要认证）

    - 清除RSS feed缓存，下次访问时会重新生成
    - 可以清除所有缓存或指定limit的缓存
    - 只有认证用户才能调用

    Returns:
        操作结果
    """
    try:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="只有超级用户才能清除RSS缓存")

        rss_service.clear_cache(limit=limit)

        return {
            "success": True,
            "message": f"RSS缓存已清除{'（所有缓存）' if limit is None else f'（limit={limit}）'}",
            "detail": "缓存清除成功",
        }
    except Exception as e:
        logger.error(f"清除RSS缓存时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail="清除缓存失败")


@router.get("/cache/info", response_model=dict)
def get_cache_info(current_user: User = Depends(get_current_active_user)) -> dict:
    """
    获取RSS缓存信息（需要认证）

    - 查看当前缓存状态
    - 包括缓存数量、缓存键、过期时间等信息
    - 只有认证用户才能调用

    Returns:
        缓存信息
    """
    try:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="只有超级用户才能查看缓存信息")

        cache_info = rss_service.get_cache_info()
        return {"success": True, "cache_info": cache_info}
    except Exception as e:
        logger.error(f"获取缓存信息时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail="获取缓存信息失败")

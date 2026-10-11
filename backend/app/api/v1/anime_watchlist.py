from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_db
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.anime_watchlist import (
    AnimeWatchlist,
    AnimeWatchlistCategoryStats,
    AnimeWatchlistCreate,
    AnimeWatchlistList,
    AnimeWatchlistStatusStats,
    AnimeWatchlistTagStats,
    AnimeWatchlistUpdate,
)
from app.services.anime_watchlist import AnimeWatchlistService
from app.services.image_proxy_service import fetch_image

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=List[AnimeWatchlist])
async def get_anime_watchlist(
    category: Optional[str] = Query(None, description="分类: anime, drama, other"),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    status: Optional[str] = Query(
        None, description="状态: want_watch, watching, completed, dropped"
    ),
    is_favorite: Optional[bool] = Query(None, description="是否收藏"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(100, ge=1, le=1000, description="返回数量"),
    sort_by: str = Query(
        "sort_order",
        description="排序方式: sort_order, created_at, title, progress, rating",
    ),
    db: Session = Depends(get_db),
):
    """获取追番追剧列表"""
    try:
        service = AnimeWatchlistService(db)
        items = service.get_anime_watchlist_items(
            category=category,
            tags=tags,
            status=status,
            is_favorite=is_favorite,
            is_active=is_active,
            skip=skip,
            limit=limit,
            sort_by=sort_by,
        )
        return items
    except Exception as e:
        logger.error(f"获取追番追剧列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取追番追剧列表失败")


@router.get("/list", response_model=AnimeWatchlistList)
async def get_anime_watchlist_paginated(
    category: Optional[str] = Query(None, description="分类: anime, drama, other"),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    status: Optional[str] = Query(
        None, description="状态: want_watch, watching, completed, dropped"
    ),
    is_favorite: Optional[bool] = Query(None, description="是否收藏"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    sort_by: str = Query(
        "sort_order",
        description="排序方式: sort_order, created_at, title, progress, rating",
    ),
    db: Session = Depends(get_db),
):
    """分页获取追番追剧列表"""
    service = AnimeWatchlistService(db)
    items, total = service.get_anime_watchlist_paginated(
        category=category,
        tags=tags,
        status=status,
        is_favorite=is_favorite,
        is_active=is_active,
        page=page,
        size=size,
        sort_by=sort_by,
    )

    pages = (total + size - 1) // size

    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}


@router.get("/want-watch", response_model=List[AnimeWatchlist])
async def get_want_watch_anime(db: Session = Depends(get_db)):
    """获取想看的动漫/剧集"""
    service = AnimeWatchlistService(db)
    items = service.get_anime_watchlist_items(
        status="want_watch", is_active=True, sort_by="sort_order"
    )
    return items


@router.get("/watching", response_model=List[AnimeWatchlist])
async def get_watching_anime(db: Session = Depends(get_db)):
    """获取正在看的动漫/剧集"""
    service = AnimeWatchlistService(db)
    items = service.get_anime_watchlist_items(
        status="watching", is_active=True, sort_by="progress"
    )
    return items


@router.get("/completed", response_model=List[AnimeWatchlist])
async def get_completed_anime(db: Session = Depends(get_db)):
    """获取已看完的动漫/剧集"""
    service = AnimeWatchlistService(db)
    items = service.get_anime_watchlist_items(
        status="completed", is_active=True, sort_by="rating"
    )
    return items


@router.get("/favorites", response_model=List[AnimeWatchlist])
async def get_favorite_anime(db: Session = Depends(get_db)):
    """获取收藏的动漫/剧集"""
    service = AnimeWatchlistService(db)
    items = service.get_anime_watchlist_items(
        is_favorite=True, is_active=True, sort_by="sort_order"
    )
    return items


@router.get("/statuses", response_model=List[AnimeWatchlistStatusStats])
async def get_anime_status_stats(
    is_active: Optional[bool] = Query(True, description="是否启用"),
    db: Session = Depends(get_db),
):
    """获取追番追剧状态统计"""
    service = AnimeWatchlistService(db)
    stats = service.get_status_stats(is_active=is_active)

    return [
        AnimeWatchlistStatusStats(status=stat.status, count=stat.count)
        for stat in stats
    ]


@router.get("/categories", response_model=List[AnimeWatchlistCategoryStats])
async def get_anime_category_stats(
    is_active: Optional[bool] = Query(True, description="是否启用"),
    db: Session = Depends(get_db),
):
    """获取追番追剧分类统计"""
    service = AnimeWatchlistService(db)
    stats = service.get_category_stats(is_active=is_active)

    return [
        AnimeWatchlistCategoryStats(category=stat.category, count=stat.count)
        for stat in stats
    ]


@router.get("/tags", response_model=List[AnimeWatchlistTagStats])
async def get_anime_tag_stats(
    is_active: Optional[bool] = Query(True, description="是否启用"),
    db: Session = Depends(get_db),
):
    """获取追番追剧标签统计"""
    service = AnimeWatchlistService(db)
    stats = service.get_tag_stats(is_active=is_active)

    return [
        AnimeWatchlistTagStats(tag=stat["tag"], count=stat["count"]) for stat in stats
    ]


@router.get("/proxy-image")
async def proxy_anime_image(url: str = Query(..., description="要代理的图片URL")):
    """
    代理获取图片，解决前端跨域问题

    使用方式:
    前端: <img src="/api/v1/anime-watchlist/proxy-image?url=<图片URL>" />
    """
    content, content_type = await fetch_image(url)

    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",  # 缓存一天
            "Access-Control-Allow-Origin": "*",  # 允许跨域访问
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*",
        },
    )


@router.get("/{item_id}", response_model=AnimeWatchlist)
async def get_anime_watchlist_item(item_id: int, db: Session = Depends(get_db)):
    """获取单个追番追剧项目"""
    service = AnimeWatchlistService(db)
    item = service.get_anime_watchlist(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="追番追剧项目不存在")
    return item


@router.get("/{item_id}/cover-url")
async def get_anime_cover_url(item_id: int, db: Session = Depends(get_db)):
    """即时抓取 B 站元数据并返回封面 URL

    不再只读数据库：调用时根据条目的观看链接现场抓取（标题/封面/集数/标签），
    抓取失败但库中已有封面时仍会返回已有 URL。
    """
    service = AnimeWatchlistService(db)
    result = service.refresh_anime_metadata(item_id)
    if result.get("status") != "success" and not result.get("cover_url"):
        raise HTTPException(status_code=404, detail=result.get("message", "动漫封面图片不存在"))
    return {
        "cover_url": result.get("cover_url"),
        "message": result.get("message"),
        "updated_fields": result.get("updated_fields", []),
    }


@router.post("/batch-update-covers")
async def batch_update_anime_covers(
    limit: int = Query(50, ge=1, le=200, description="批量处理数量限制，最大200"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    批量更新动漫封面图片（已废弃，请使用batch-update-metadata）

    为所有没有MinIO封面图片的追番项目下载并上传封面图片

    Args:
        limit: 批量处理的数量限制

    Returns:
        dict: 包含处理结果的字典
    """
    service = AnimeWatchlistService(db)
    result = service.batch_update_anime_metadata(limit=limit)
    return result


@router.post("/batch-update-metadata")
async def batch_update_anime_metadata(
    limit: int = Query(50, ge=1, le=200, description="批量处理数量限制，最大200"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    批量更新动漫元数据

    为所有有URL的追番项目从B站页面提取并更新元数据

    Args:
        limit: 批量处理的数量限制

    Returns:
        dict: 包含处理结果的字典
    """
    service = AnimeWatchlistService(db)
    result = service.batch_update_anime_metadata(limit=limit)
    return result


@router.post("/", response_model=AnimeWatchlist)
async def create_anime_watchlist_item(
    item: AnimeWatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建追番追剧项目"""
    service = AnimeWatchlistService(db)
    return service.create_anime_watchlist(item)


@router.put("/{item_id}", response_model=AnimeWatchlist)
async def update_anime_watchlist_item(
    item_id: int,
    item: AnimeWatchlistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新追番追剧项目"""
    service = AnimeWatchlistService(db)
    return service.update_anime_watchlist(item_id, item)


@router.patch("/{item_id}/progress", response_model=AnimeWatchlist)
async def update_anime_progress(
    item_id: int,
    progress: float = Query(..., description="观看进度百分比(0-100)", ge=0, le=100),
    current_episode: Optional[int] = Query(None, description="当前看到第几集", ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新观看进度"""
    service = AnimeWatchlistService(db)
    return service.update_progress(item_id, progress, current_episode)


@router.delete("/{item_id}")
async def delete_anime_watchlist_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除追番追剧项目"""
    service = AnimeWatchlistService(db)
    success = service.delete_anime_watchlist(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="追番追剧项目不存在")

    return {"message": "追番追剧项目删除成功"}

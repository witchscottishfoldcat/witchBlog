"""
游戏展示 - 后台管理 API

提供游戏的增删改查、Steam 导入、统计等管理功能。
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_db
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.game_showcase import (
    GameCategoryStats,
    GameOverallStats,
    GamePlatformStats,
    GameShowcase,
    GameShowcaseCreate,
    GameShowcaseList,
    GameShowcaseUpdate,
    GameStatusStats,
    SteamImportRequest,
    SteamImportResponse,
)
from app.services.game_showcase_service import GameShowcaseService

logger = get_logger(__name__)
router = APIRouter()


# ==================== 列表和查询 ====================


@router.get("/", response_model=List[GameShowcase])
async def get_games(
    platform: Optional[str] = Query(
        None, description="平台: steam, epic, ps, switch, pc, mobile, other"
    ),
    category: Optional[str] = Query(
        None,
        description="分类: rpg, fps, strategy, simulation, indie, adventure, other",
    ),
    status: Optional[str] = Query(
        None, description="状态: want_play, playing, completed, shelved, dropped"
    ),
    tags: Optional[str] = Query(None, description="标签，逗号分隔"),
    is_favorite: Optional[bool] = Query(None, description="是否收藏"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    is_r18: Optional[bool] = Query(None, description="是否 R18 成人内容"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: str = Query(
        "sort_order",
        description="排序: sort_order, created_at, title, play_time, rating",
    ),
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
):
    """获取游戏列表"""
    service = GameShowcaseService(db)
    return service.get_games(
        platform=platform,
        category=category,
        status=status,
        tags=tags,
        is_favorite=is_favorite,
        is_active=is_active,
        is_r18=is_r18,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
    )


@router.get("/list", response_model=GameShowcaseList)
async def get_games_paginated(
    platform: Optional[str] = Query(None, description="平台"),
    category: Optional[str] = Query(None, description="分类"),
    status: Optional[str] = Query(None, description="状态"),
    tags: Optional[str] = Query(None, description="标签"),
    is_favorite: Optional[bool] = Query(None, description="是否收藏"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    is_r18: Optional[bool] = Query(None, description="是否 R18 成人内容"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("sort_order"),
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
):
    """分页获取游戏列表"""
    service = GameShowcaseService(db)
    items, total = service.get_games_paginated(
        page=page,
        size=size,
        platform=platform,
        category=category,
        status=status,
        tags=tags,
        is_favorite=is_favorite,
        is_active=is_active,
        is_r18=is_r18,
        sort_by=sort_by,
    )
    pages = (total + size - 1) // size
    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}


@router.get("/stats", response_model=GameOverallStats)
async def get_game_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取游戏总体统计"""
    service = GameShowcaseService(db)
    return service.get_overall_stats()


@router.get("/stats/status", response_model=List[GameStatusStats])
async def get_status_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取游戏状态统计"""
    return GameShowcaseService(db).get_status_stats()


@router.get("/stats/platform", response_model=List[GamePlatformStats])
async def get_platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取游戏平台统计"""
    return GameShowcaseService(db).get_platform_stats()


@router.get("/stats/category", response_model=List[GameCategoryStats])
async def get_category_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取游戏分类统计"""
    return GameShowcaseService(db).get_category_stats()


# ==================== Steam 导入 ====================


@router.post("/import-from-steam", response_model=SteamImportResponse)
async def import_from_steam(
    request: SteamImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """从 Steam 批量导入游戏"""
    try:
        service = GameShowcaseService(db)
        result = await service.import_from_steam(
            steam_id=request.steam_id,
            import_all=request.import_all,
            default_status=request.default_status,
        )
        return SteamImportResponse(
            total_found=result["total_found"],
            imported=result["imported"],
            updated=result["updated"],
            skipped=result["skipped"],
            failed=result["failed"],
            message=(
                f"导入完成: 新增 {result['imported']}, "
                f"更新 {result['updated']}, 失败 {result['failed']}"
            ),
        )
    except Exception as e:
        logger.error(f"Steam 导入失败: {e}")
        raise HTTPException(status_code=500, detail="Steam 导入失败")


@router.post("/sync-from-steam")
async def sync_from_steam(
    steam_id: str = Query(..., description="Steam 64位用户ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """同步 Steam 游戏数据（更新游玩时长等）"""
    try:
        service = GameShowcaseService(db)
        result = await service.import_from_steam(
            steam_id=steam_id, import_all=False, default_status="playing"
        )
        return {
            "message": f"同步完成: 更新 {result['updated']}, 新增 {result['imported']}",
            **result,
        }
    except Exception as e:
        logger.error(f"Steam 同步失败: {e}")
        raise HTTPException(status_code=500, detail="同步失败")


# ==================== 单个游戏 CRUD ====================


@router.get("/{game_id}", response_model=GameShowcase)
async def get_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取单个游戏详情"""
    service = GameShowcaseService(db)
    game = service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="游戏不存在")
    return game


@router.post("/", response_model=GameShowcase)
async def create_game(
    game_in: GameShowcaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建游戏"""
    try:
        return GameShowcaseService(db).create_game(game_in)
    except Exception as e:
        logger.error(f"创建游戏失败: {e}")
        raise HTTPException(status_code=500, detail="创建游戏失败")


@router.put("/{game_id}", response_model=GameShowcase)
async def update_game(
    game_id: int,
    game_in: GameShowcaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新游戏"""
    try:
        return GameShowcaseService(db).update_game(game_id, game_in)
    except Exception as e:
        logger.error(f"更新游戏失败: {e}")
        raise HTTPException(status_code=500, detail="更新游戏失败")


@router.delete("/{game_id}")
async def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除游戏"""
    try:
        GameShowcaseService(db).delete_game(game_id)
        return {"message": "删除成功"}
    except Exception as e:
        logger.error(f"删除游戏失败: {e}")
        raise HTTPException(status_code=500, detail="删除游戏失败")

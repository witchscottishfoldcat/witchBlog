"""
游戏展示 - 前台展示 API

只读接口，仅返回已启用的游戏数据，供博客前端展示使用。
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.unified_logging import get_logger
from app.schemas.game_showcase import GameOverallStats, GameShowcase, GameShowcaseList
from app.services.game_showcase_service import GameShowcaseService

logger = get_logger(__name__)
router = APIRouter()


@router.get("/")
async def get_games_overview(db: Session = Depends(get_db)):
    """游戏展示首页概览（排除 R18 成人内容）"""
    service = GameShowcaseService(db)
    stats = service.get_overall_stats(is_r18=False)

    # 最近添加的游戏
    recent_games = service.get_games(
        is_active=True, is_r18=False, sort_by="created_at", limit=6
    )

    # 正在玩的游戏
    playing_games = service.get_games(
        is_active=True, is_r18=False, status="playing", sort_by="play_time", limit=6
    )

    # 收藏的游戏
    favorite_games = service.get_games(
        is_active=True, is_r18=False, is_favorite=True, sort_by="rating", limit=6
    )

    return {
        "stats": stats,
        "recent_games": recent_games,
        "playing_games": playing_games,
        "favorite_games": favorite_games,
    }


@router.get("/list", response_model=GameShowcaseList)
async def get_public_games(
    platform: Optional[str] = Query(None, description="平台"),
    category: Optional[str] = Query(None, description="分类"),
    status: Optional[str] = Query(None, description="状态"),
    tags: Optional[str] = Query(None, description="标签"),
    is_favorite: Optional[bool] = Query(None, description="是否收藏"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("sort_order"),
    db: Session = Depends(get_db),
):
    """公开游戏列表（分页，排除 R18 成人内容）"""
    service = GameShowcaseService(db)
    items, total = service.get_games_paginated(
        page=page,
        size=size,
        platform=platform,
        category=category,
        status=status,
        tags=tags,
        is_favorite=is_favorite,
        is_r18=False,
        is_active=True,
        sort_by=sort_by,
    )
    pages = (total + size - 1) // size
    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}


@router.get("/random", response_model=List[GameShowcase])
async def get_random_games(
    count: int = Query(5, ge=1, le=20, description="随机数量"),
    db: Session = Depends(get_db),
):
    """随机推荐游戏（排除 R18 成人内容）"""
    return GameShowcaseService(db).get_random_games(count, is_r18=False)


@router.get("/stats", response_model=GameOverallStats)
async def get_public_stats(db: Session = Depends(get_db)):
    """公开统计数据（排除 R18 成人内容）"""
    return GameShowcaseService(db).get_overall_stats(is_r18=False)


@router.get("/{game_id}", response_model=GameShowcase)
async def get_public_game(game_id: int, db: Session = Depends(get_db)):
    """获取单个游戏详情（仅已启用且非 R18 的）"""
    service = GameShowcaseService(db)
    game = service.get_game(game_id)
    if not game or not game.is_active or game.is_r18:
        raise HTTPException(status_code=404, detail="游戏不存在")
    return game

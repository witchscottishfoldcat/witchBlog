from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_current_active_user, get_db
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.music import (
    LyricsResponse,
    MusicTrack,
    MusicTrackCreate,
    MusicTrackList,
    MusicTrackUpdate,
    PlayerCode,
)
from app.services.music_service import MusicTrackService

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=List[MusicTrack])
async def get_music_tracks(
    library_id: Optional[int] = Query(None, description="所属歌单ID"),
    category: Optional[str] = Query(None, description="分类"),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    status: Optional[str] = Query(
        None, description="状态: unplayed, listening, completed, disliked"
    ),
    is_favorite: Optional[bool] = Query(None, description="是否收藏"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(100, ge=1, le=1000, description="返回数量"),
    sort_by: str = Query(
        "sort_order",
        description="排序方式: sort_order, created_at, title, rating, play_count",
    ),
    db: Session = Depends(get_db),
):
    """获取音乐曲目列表"""
    try:
        service = MusicTrackService(db)
        items = service.get_music_tracks(
            library_id=library_id,
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
        logger.error(f"获取音乐曲目列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取音乐曲目列表失败")


@router.get("/list", response_model=MusicTrackList)
async def get_music_tracks_paginated(
    library_id: Optional[int] = Query(None, description="所属歌单ID"),
    category: Optional[str] = Query(None, description="分类"),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    status: Optional[str] = Query(
        None, description="状态: unplayed, listening, completed, disliked"
    ),
    is_favorite: Optional[bool] = Query(None, description="是否收藏"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    sort_by: str = Query(
        "sort_order",
        description="排序方式: sort_order, created_at, title, rating, play_count",
    ),
    db: Session = Depends(get_db),
):
    """分页获取音乐曲目列表"""
    service = MusicTrackService(db)
    items, total = service.get_music_tracks_paginated(
        library_id=library_id,
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


@router.get("/favorites", response_model=List[MusicTrack])
async def get_favorite_tracks(db: Session = Depends(get_db)):
    """获取收藏的歌曲"""
    service = MusicTrackService(db)
    items = service.get_music_tracks(
        is_favorite=True, is_active=True, sort_by="created_at"
    )
    return items


@router.get("/unplayed", response_model=List[MusicTrack])
async def get_unplayed_tracks(db: Session = Depends(get_db)):
    """获取未听的歌曲"""
    service = MusicTrackService(db)
    items = service.get_music_tracks(
        status="unplayed", is_active=True, sort_by="created_at"
    )
    return items


@router.get("/listening", response_model=List[MusicTrack])
async def get_listening_tracks(db: Session = Depends(get_db)):
    """获取在听的歌曲"""
    service = MusicTrackService(db)
    items = service.get_music_tracks(
        status="listening", is_active=True, sort_by="created_at"
    )
    return items


@router.get("/completed", response_model=List[MusicTrack])
async def get_completed_tracks(db: Session = Depends(get_db)):
    """获取已听完的歌曲"""
    service = MusicTrackService(db)
    items = service.get_music_tracks(
        status="completed", is_active=True, sort_by="created_at"
    )
    return items


@router.get("/{track_id}", response_model=MusicTrack)
async def get_music_track(track_id: int, db: Session = Depends(get_db)):
    """获取音乐曲目详情"""
    service = MusicTrackService(db)
    track = service.get_music_track(track_id)

    if not track:
        raise HTTPException(status_code=404, detail="音乐曲目不存在")

    return track


@router.post("/", response_model=MusicTrack)
async def create_music_track(
    track_in: MusicTrackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建音乐曲目"""
    try:
        service = MusicTrackService(db)
        track = await service.create_music_track(track_in)
        return track
    except Exception as e:
        logger.error(f"创建音乐曲目失败: {e}")
        raise HTTPException(status_code=500, detail="创建音乐曲目失败")


@router.put("/{track_id}", response_model=MusicTrack)
async def update_music_track(
    track_id: int,
    track_in: MusicTrackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新音乐曲目"""
    try:
        service = MusicTrackService(db)
        track = service.update_music_track(track_id, track_in)
        return track
    except Exception as e:
        logger.error(f"更新音乐曲目失败: {e}")
        raise HTTPException(status_code=500, detail="更新音乐曲目失败")


@router.delete("/{track_id}")
async def delete_music_track(
    track_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除音乐曲目"""
    try:
        service = MusicTrackService(db)
        service.delete_music_track(track_id)
        return {"message": "删除成功"}
    except Exception as e:
        logger.error(f"删除音乐曲目失败: {e}")
        raise HTTPException(status_code=500, detail="删除音乐曲目失败")


@router.get("/{track_id}/lyrics", response_model=LyricsResponse)
async def get_track_lyrics(track_id: int, db: Session = Depends(get_db)):
    """获取歌词"""
    try:
        service = MusicTrackService(db)
        lyrics = await service.get_lyrics(track_id)

        return LyricsResponse(lyrics=lyrics, message="获取歌词成功" if lyrics else "暂无歌词")
    except Exception as e:
        logger.error(f"获取歌词失败: {e}")
        raise HTTPException(status_code=500, detail="获取歌词失败")


@router.get("/{track_id}/player", response_model=PlayerCode)
async def get_player_code(track_id: int, db: Session = Depends(get_db)):
    """获取播放器代码"""
    try:
        service = MusicTrackService(db)
        track = service.get_music_track(track_id)

        if not track:
            raise HTTPException(status_code=404, detail="音乐曲目不存在")

        # 生成网易云音乐 iframe 播放器代码
        iframe_code = f"""<iframe
    src="https://music.163.com/outchain/player?type=2&id={track.netease_id}&auto=0&height=66"
    width="100%"
    height="86"
    frameborder="no"
    marginwidth="0"
    marginheight="0">
</iframe>"""

        return PlayerCode(iframe_code=iframe_code)
    except Exception as e:
        logger.error(f"获取播放器代码失败: {e}")
        raise HTTPException(status_code=500, detail="获取播放器代码失败")


@router.post("/{track_id}/play")
async def record_play(
    track_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """记录播放"""
    try:
        service = MusicTrackService(db)
        track = service.get_music_track(track_id)

        if not track:
            raise HTTPException(status_code=404, detail="音乐曲目不存在")

        # 更新播放次数
        track.play_count = (track.play_count or 0) + 1

        # 更新最后播放时间
        from datetime import datetime

        track.last_played_at = datetime.utcnow()

        # 如果状态是未听，更新为在听
        if track.status == "unplayed":
            track.status = "listening"

        db.commit()

        return {"message": "记录播放成功", "play_count": track.play_count}
    except Exception as e:
        logger.error(f"记录播放失败: {e}")
        raise HTTPException(status_code=500, detail="记录播放失败")


@router.post("/backfill-netease-ids")
async def backfill_netease_ids(
    dry_run: bool = Query(False, description="预览模式，不实际修改数据"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """批量补全无效的 netease_id

    扫描所有歌曲，对 netease_id 非纯数字的记录通过网易云搜索 API 自动匹配补全。
    使用 dry_run=true 可先预览将要修复的内容。
    """
    try:
        from app.services.netease_id_resolver import backfill_database

        result = await backfill_database(db, dry_run=dry_run)

        return {
            "message": f"{'预览' if dry_run else '修复'}完成",
            "dry_run": dry_run,
            "success_count": len(result["success"]),
            "failed_count": len(result["failed"]),
            "skipped_count": len(result["skipped"]),
            "details": result,
        }
    except Exception as e:
        logger.error(f"批量补全 netease_id 失败: {e}")
        raise HTTPException(status_code=500, detail="批量补全失败")

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_db
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.music import (
    ImportFromNeteaseRequest,
    ImportFromNeteaseResponse,
    MusicLibrary,
    MusicLibraryCreate,
    MusicLibraryDetail,
    MusicLibraryList,
    MusicLibraryUpdate,
    MusicTrack,
)
from app.services.music_service import MusicLibraryService, MusicTrackService

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=List[MusicLibrary])
async def get_music_libraries(
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    is_public: Optional[bool] = Query(None, description="是否公开"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(100, ge=1, le=1000, description="返回数量"),
    sort_by: str = Query(
        "sort_order", description="排序方式: sort_order, created_at, title, track_count"
    ),
    db: Session = Depends(get_db),
):
    """获取音乐库列表"""
    try:
        service = MusicLibraryService(db)
        items = service.get_music_libraries(
            tags=tags,
            is_public=is_public,
            is_active=is_active,
            skip=skip,
            limit=limit,
            sort_by=sort_by,
        )
        return items
    except Exception as e:
        logger.error(f"获取音乐库列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取音乐库列表失败")


@router.get("/list", response_model=MusicLibraryList)
async def get_music_libraries_paginated(
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    is_public: Optional[bool] = Query(None, description="是否公开"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    sort_by: str = Query(
        "sort_order", description="排序方式: sort_order, created_at, title, track_count"
    ),
    db: Session = Depends(get_db),
):
    """分页获取音乐库列表"""
    service = MusicLibraryService(db)
    items, total = service.get_music_libraries_paginated(
        tags=tags,
        is_public=is_public,
        is_active=is_active,
        page=page,
        size=size,
        sort_by=sort_by,
    )

    pages = (total + size - 1) // size

    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}


@router.get("/{library_id}", response_model=MusicLibraryDetail)
async def get_music_library(library_id: int, db: Session = Depends(get_db)):
    """获取音乐库详情（包含歌曲列表）"""
    service = MusicLibraryService(db)
    library = service.get_music_library(library_id)

    if not library:
        raise HTTPException(status_code=404, detail="音乐库不存在")

    # 获取歌曲列表
    track_service = MusicTrackService(db)
    tracks = track_service.get_music_tracks(
        library_id=library_id, is_active=True, sort_by="sort_order"
    )

    return {**library.__dict__, "tracks": tracks}


@router.post("/", response_model=MusicLibrary)
async def create_music_library(
    library_in: MusicLibraryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建音乐库"""
    try:
        service = MusicLibraryService(db)
        library = service.create_music_library(library_in)
        return library
    except Exception as e:
        logger.error(f"创建音乐库失败: {e}")
        raise HTTPException(status_code=500, detail="创建音乐库失败")


@router.post("/import-from-netease", response_model=ImportFromNeteaseResponse)
async def import_from_netease(
    request: ImportFromNeteaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """从网易云导入歌单"""
    try:
        service = MusicLibraryService(db)
        library = await service.import_from_netease(
            netease_playlist_id=request.netease_playlist_id,
            title=request.title,
            description=request.description,
            tags=request.tags,
            is_public=request.is_public,
        )

        return ImportFromNeteaseResponse(
            library_id=library.id,
            title=library.title,
            track_count=library.track_count,
            message=f"成功导入歌单 '{library.title}'，共 {library.track_count} 首歌曲",
        )
    except Exception as e:
        logger.error(f"从网易云导入歌单失败: {e}")
        raise HTTPException(status_code=500, detail="从网易云导入歌单失败")


@router.put("/{library_id}", response_model=MusicLibrary)
async def update_music_library(
    library_id: int,
    library_in: MusicLibraryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新音乐库"""
    try:
        service = MusicLibraryService(db)
        library = service.update_music_library(library_id, library_in)
        return library
    except Exception as e:
        logger.error(f"更新音乐库失败: {e}")
        raise HTTPException(status_code=500, detail="更新音乐库失败")


@router.delete("/{library_id}")
async def delete_music_library(
    library_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除音乐库"""
    try:
        service = MusicLibraryService(db)
        service.delete_music_library(library_id)
        return {"message": "删除成功"}
    except Exception as e:
        logger.error(f"删除音乐库失败: {e}")
        raise HTTPException(status_code=500, detail="删除音乐库失败")


@router.get("/{library_id}/tracks", response_model=List[MusicTrack])
async def get_library_tracks(
    library_id: int,
    category: Optional[str] = Query(None, description="分类"),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    status: Optional[str] = Query(
        None, description="状态: unplayed, listening, completed, disliked"
    ),
    is_favorite: Optional[bool] = Query(None, description="是否收藏"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    sort_by: str = Query(
        "sort_order",
        description="排序方式: sort_order, created_at, title, rating, play_count",
    ),
    db: Session = Depends(get_db),
):
    """获取音乐库中的歌曲列表"""
    try:
        service = MusicTrackService(db)
        items = service.get_music_tracks(
            library_id=library_id,
            category=category,
            tags=tags,
            status=status,
            is_favorite=is_favorite,
            is_active=is_active,
            sort_by=sort_by,
        )
        return items
    except Exception as e:
        logger.error(f"获取歌曲列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取歌曲列表失败")


@router.post("/{library_id}/sync")
async def sync_library_from_netease(
    library_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """从网易云同步歌单"""
    try:
        library_service = MusicLibraryService(db)
        track_service = MusicTrackService(db)

        library = library_service.get_music_library(library_id)
        if not library:
            raise HTTPException(status_code=404, detail="音乐库不存在")

        # 从网易云获取歌单详情
        from app.services.netease_service import netease_service

        playlist_data = await netease_service.get_playlist_detail(
            library.netease_playlist_id
        )
        tracks = playlist_data.get("playlist", {}).get("tracks", [])

        if not tracks:
            return {"updated_count": 0, "new_count": 0, "message": "歌单中没有歌曲"}

        updated_count = 0
        new_count = 0

        for idx, track in enumerate(tracks):
            netease_id = str(track.get("id", ""))
            existing_track = track_service.get_music_track_by_netease_id(netease_id)

            track_data = library_service._parse_netease_track(track, library_id, idx)

            if existing_track:
                # 更新现有歌曲
                for key, value in track_data.items():
                    if key != "library_id":
                        setattr(existing_track, key, value)
                updated_count += 1
            else:
                # 创建新歌曲
                from app.models.music import MusicTrack

                db_track = MusicTrack(**track_data)
                db.add(db_track)
                new_count += 1

        # 更新歌曲数量
        library.track_count = len(tracks)

        db.commit()

        return {
            "updated_count": updated_count,
            "new_count": new_count,
            "message": f"同步成功，新增 {new_count} 首歌曲，更新 {updated_count} 首歌曲",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"同步歌单失败: {e}")
        raise HTTPException(status_code=500, detail="同步歌单失败")

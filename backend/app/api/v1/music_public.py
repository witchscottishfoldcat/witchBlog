"""
音乐馆前台展示 API - 公开只读接口
提供博客前端音乐馆页面所需的展示数据（查询与组装见 music_public_service）
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.exceptions import NotFoundException
from app.core.unified_logging import get_logger
from app.schemas.music import (
    LyricsResponse,
    MusicPublicOverview,
    MusicPublicPlaylistDetail,
    MusicPublicPlaylistList,
    MusicPublicStats,
    MusicPublicTrack,
    MusicPublicTrackList,
    PlayerCode,
)
from app.services.music_public_service import MusicPublicService

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=MusicPublicOverview)
async def get_music_overview(
    db: Session = Depends(get_db),
):
    """
    音乐馆首页概览

    返回统计数据、歌单列表和最近添加的歌曲
    """
    try:
        return MusicPublicService(db).get_overview()
    except Exception as e:
        logger.error(f"获取音乐馆概览失败: {e}")
        raise HTTPException(status_code=500, detail="获取音乐馆概览失败")


@router.get("/playlists", response_model=MusicPublicPlaylistList)
async def get_public_playlists(
    tags: Optional[str] = Query(None, description="标签筛选，逗号分隔"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    """
    获取公开歌单列表（分页）

    仅返回公开且启用的歌单
    """
    try:
        return MusicPublicService(db).get_playlists(tags=tags, page=page, size=size)
    except Exception as e:
        logger.error(f"获取公开歌单列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取公开歌单列表失败")


@router.get("/playlists/{playlist_id}", response_model=MusicPublicPlaylistDetail)
async def get_public_playlist_detail(
    playlist_id: int,
    page: int = Query(1, ge=1, description="歌曲页码"),
    size: int = Query(50, ge=1, le=200, description="每页歌曲数"),
    db: Session = Depends(get_db),
):
    """
    获取歌单详情（含歌曲列表）

    自动增加浏览次数
    """
    try:
        return MusicPublicService(db).get_playlist_detail(
            playlist_id, page=page, size=size
        )
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/playlists/{playlist_id}/tracks", response_model=MusicPublicTrackList)
async def get_public_playlist_tracks(
    playlist_id: int,
    category: Optional[str] = Query(None, description="分类筛选"),
    tags: Optional[str] = Query(None, description="标签筛选，逗号分隔"),
    status: Optional[str] = Query(None, description="状态筛选"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    """
    获取歌单内歌曲列表（分页，支持筛选）
    """
    try:
        return MusicPublicService(db).get_playlist_tracks(
            playlist_id,
            category=category,
            tags=tags,
            status=status,
            page=page,
            size=size,
        )
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/tracks/random", response_model=List[MusicPublicTrack])
async def get_random_tracks(
    count: int = Query(5, ge=1, le=20, description="推荐数量"),
    db: Session = Depends(get_db),
):
    """
    随机推荐歌曲

    从所有公开歌单中随机抽取歌曲
    """
    try:
        return MusicPublicService(db).get_random_tracks(count=count)
    except Exception as e:
        logger.error(f"获取随机推荐歌曲失败: {e}")
        raise HTTPException(status_code=500, detail="获取随机推荐歌曲失败")


@router.get("/tracks/{track_id}", response_model=MusicPublicTrack)
async def get_public_track_detail(
    track_id: int,
    db: Session = Depends(get_db),
):
    """
    获取歌曲详情

    仅返回公开歌单下的歌曲
    """
    try:
        return MusicPublicService(db).verify_public_track(track_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/tracks/{track_id}/player", response_model=PlayerCode)
async def get_public_player_code(
    track_id: int,
    db: Session = Depends(get_db),
):
    """
    获取播放器 iframe 代码

    仅返回公开歌单下的歌曲播放器
    """
    try:
        track = MusicPublicService(db).verify_public_track(track_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))

    iframe_code = f"""<iframe
    src="https://music.163.com/outchain/player?type=2&id={track.netease_id}&auto=0&height=66"
    width="100%"
    height="86"
    frameborder="no"
    marginwidth="0"
    marginheight="0">
</iframe>"""

    return PlayerCode(iframe_code=iframe_code)


@router.get("/tracks/{track_id}/lyrics", response_model=LyricsResponse)
async def get_public_track_lyrics(
    track_id: int,
    db: Session = Depends(get_db),
):
    """
    获取歌词

    仅返回公开歌单下的歌曲歌词
    """
    try:
        track = MusicPublicService(db).verify_public_track(track_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))

    lyrics = track.lyrics if hasattr(track, "lyrics") else None

    # 如果本地没有歌词，尝试从网易云获取
    if not lyrics and track.netease_id:
        try:
            from app.services.netease_service import netease_service

            lyrics_data = await netease_service.get_lyrics(track.netease_id)
            lyrics = str(lyrics_data.get("lrc", {}).get("lyric", "") or "")
        except Exception as e:
            logger.warning(f"从网易云获取歌词失败: {e}")

    return LyricsResponse(
        lyrics=lyrics,
        message="获取歌词成功" if lyrics else "暂无歌词",
    )


@router.get("/stats", response_model=MusicPublicStats)
async def get_music_stats(
    db: Session = Depends(get_db),
):
    """
    音乐馆统计数据

    返回歌单数、歌曲数、播放统计、分类统计等
    """
    try:
        return MusicPublicService(db).build_stats()
    except Exception as e:
        logger.error(f"获取音乐馆统计数据失败: {e}")
        raise HTTPException(status_code=500, detail="获取音乐馆统计数据失败")

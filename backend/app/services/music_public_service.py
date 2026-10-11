"""音乐馆前台公开数据服务：公开歌单/歌曲的查询、统计与组装。

数据访问集中在本模块，前台路由（app/api/v1/music_public.py）只负责
HTTP 参数、播放器代码拼装与错误映射。
"""
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.music import MusicLibrary, MusicTrack
from app.schemas.music import (
    MusicPublicOverview,
    MusicPublicPlaylistDetail,
    MusicPublicPlaylistList,
    MusicPublicStats,
    MusicPublicTrackList,
    MusicTrackCategoryStats,
    MusicTrackStatusStats,
)

# 公开歌单列表的默认排序：权重升序，其次创建时间降序
_PLAYLIST_ORDER = (
    MusicLibrary.sort_order.asc(),
    MusicLibrary.created_at.desc(),
)
# 歌曲列表的默认排序：权重升序，其次创建时间降序
_TRACK_ORDER = (
    MusicTrack.sort_order.asc(),
    MusicTrack.created_at.desc(),
)
# 概览页最近添加歌曲的展示上限
_RECENT_TRACKS_LIMIT = 10


class MusicPublicService:
    """音乐馆前台公开数据服务类"""

    def __init__(self, db: Session):
        self.db = db

    # ==================== 基础查询 ====================

    def _public_library_query(self):
        """获取公开且活跃的歌单基础查询"""
        return self.db.query(MusicLibrary).filter(
            MusicLibrary.is_public.is_(True),
            MusicLibrary.is_active.is_(True),
        )

    def _active_track_query(self, library_id: int):
        """获取指定歌单下活跃的歌曲基础查询"""
        return self.db.query(MusicTrack).filter(
            MusicTrack.library_id == library_id,
            MusicTrack.is_active.is_(True),
        )

    def get_public_library_ids(self) -> List[int]:
        """全部公开歌单的 ID 列表"""
        return [lib.id for lib in self._public_library_query().all()]

    def verify_public_track(self, track_id: int) -> MusicTrack:
        """验证歌曲存在且所属歌单为公开状态，返回歌曲对象；否则视为不存在"""
        track = (
            self.db.query(MusicTrack)
            .filter(
                MusicTrack.id == track_id,
                MusicTrack.is_active.is_(True),
            )
            .first()
        )

        if not track:
            raise NotFoundException("歌曲不存在")

        if track.library_id:
            library = (
                self._public_library_query()
                .filter(MusicLibrary.id == track.library_id)
                .first()
            )
            if not library:
                raise NotFoundException("歌曲不存在")

        return track

    # ==================== 统计 ====================

    def build_stats(self) -> MusicPublicStats:
        """构建音乐馆统计数据"""
        public_library_ids = self.get_public_library_ids()

        if not public_library_ids:
            return MusicPublicStats()

        active_tracks_query = self.db.query(MusicTrack).filter(
            MusicTrack.library_id.in_(public_library_ids),
            MusicTrack.is_active.is_(True),
        )

        total_tracks = active_tracks_query.count()
        total_play_count = active_tracks_query.with_entities(
            func.coalesce(func.sum(MusicTrack.play_count), 0)
        ).scalar()
        favorite_count = active_tracks_query.filter(
            MusicTrack.is_favorite.is_(True)
        ).count()

        # 分类统计
        category_rows = (
            active_tracks_query.with_entities(
                MusicTrack.category, func.count(MusicTrack.id)
            )
            .group_by(MusicTrack.category)
            .all()
        )
        category_stats = [
            MusicTrackCategoryStats(category=row[0] or "other", count=row[1])
            for row in category_rows
        ]

        # 状态统计
        status_rows = (
            active_tracks_query.with_entities(
                MusicTrack.status, func.count(MusicTrack.id)
            )
            .group_by(MusicTrack.status)
            .all()
        )
        status_stats = [
            MusicTrackStatusStats(status=row[0] or "unplayed", count=row[1])
            for row in status_rows
        ]

        return MusicPublicStats(
            total_playlists=len(public_library_ids),
            total_tracks=total_tracks,
            total_play_count=int(total_play_count),
            favorite_count=favorite_count,
            category_stats=category_stats,
            status_stats=status_stats,
        )

    # ==================== 端点数据组装 ====================

    def get_overview(self) -> MusicPublicOverview:
        """音乐馆首页概览：统计数据 + 歌单列表 + 最近添加歌曲"""
        stats = self.build_stats()

        playlists = self._public_library_query().order_by(*_PLAYLIST_ORDER).all()

        public_library_ids = [p.id for p in playlists]
        recent_tracks = []
        if public_library_ids:
            recent_tracks = (
                self.db.query(MusicTrack)
                .filter(
                    MusicTrack.library_id.in_(public_library_ids),
                    MusicTrack.is_active.is_(True),
                )
                .order_by(MusicTrack.created_at.desc())
                .limit(_RECENT_TRACKS_LIMIT)
                .all()
            )

        return MusicPublicOverview(
            stats=stats,
            playlists=playlists,
            recent_tracks=recent_tracks,
        )

    def get_playlists(
        self,
        tags: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> MusicPublicPlaylistList:
        """公开歌单分页列表，支持标签筛选（逗号分隔）"""
        query = self._public_library_query()

        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            for tag in tag_list:
                query = query.filter(MusicLibrary.tags.contains(tag))

        total = query.count()
        items = (
            query.order_by(*_PLAYLIST_ORDER).offset((page - 1) * size).limit(size).all()
        )

        pages = (total + size - 1) // size

        return MusicPublicPlaylistList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    def get_playlist_detail(
        self, playlist_id: int, page: int = 1, size: int = 50
    ) -> MusicPublicPlaylistDetail:
        """歌单详情（含分页歌曲列表），自动增加浏览次数"""
        library = (
            self._public_library_query().filter(MusicLibrary.id == playlist_id).first()
        )

        if not library:
            raise NotFoundException("歌单不存在")

        # 增加浏览次数
        library.view_count += 1
        self.db.commit()
        self.db.refresh(library)

        tracks_query = self._active_track_query(playlist_id)
        total_tracks = tracks_query.count()

        tracks = (
            tracks_query.order_by(*_TRACK_ORDER)
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        # 计算总时长
        total_duration = tracks_query.with_entities(
            func.coalesce(func.sum(MusicTrack.duration), 0)
        ).scalar()

        return MusicPublicPlaylistDetail(
            **{c.name: getattr(library, c.name) for c in library.__table__.columns},
            tracks=tracks,
            total_tracks=total_tracks,
            total_duration=int(total_duration),
        )

    def get_playlist_tracks(
        self,
        playlist_id: int,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> MusicPublicTrackList:
        """歌单内歌曲分页列表，支持分类/标签/状态筛选"""
        library = (
            self._public_library_query().filter(MusicLibrary.id == playlist_id).first()
        )
        if not library:
            raise NotFoundException("歌单不存在")

        query = self._active_track_query(playlist_id)

        if category:
            query = query.filter(MusicTrack.category == category)
        if status:
            query = query.filter(MusicTrack.status == status)
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            for tag in tag_list:
                query = query.filter(MusicTrack.tags.contains(tag))

        total = query.count()
        items = (
            query.order_by(*_TRACK_ORDER).offset((page - 1) * size).limit(size).all()
        )

        pages = (total + size - 1) // size

        return MusicPublicTrackList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    def get_random_tracks(self, count: int = 5) -> List[MusicTrack]:
        """从所有公开歌单中随机抽取歌曲"""
        public_library_ids = self.get_public_library_ids()

        if not public_library_ids:
            return []

        return (
            self.db.query(MusicTrack)
            .filter(
                MusicTrack.library_id.in_(public_library_ids),
                MusicTrack.is_active.is_(True),
            )
            .order_by(func.random())
            .limit(count)
            .all()
        )

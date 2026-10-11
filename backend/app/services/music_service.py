from typing import List, Optional, Tuple

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException
from app.core.unified_logging import get_logger
from app.models.music import MusicLibrary, MusicTrack
from app.schemas.music import (
    MusicLibraryCreate,
    MusicLibraryUpdate,
    MusicTrackCreate,
    MusicTrackUpdate,
)
from app.services.minio_service import minio_service as _minio_singleton
from app.services.netease_service import netease_service

logger = get_logger(__name__)


class MusicLibraryService:
    """音乐库服务类"""

    def __init__(self, db: Session):
        """初始化服务"""
        self.db = db
        self.minio_service = _minio_singleton

    def get_music_library(self, library_id: int) -> Optional[MusicLibrary]:
        """获取单个音乐库"""
        return self.db.query(MusicLibrary).filter(MusicLibrary.id == library_id).first()

    def get_music_library_by_netease_id(
        self, netease_id: str
    ) -> Optional[MusicLibrary]:
        """根据网易云ID获取音乐库"""
        return (
            self.db.query(MusicLibrary)
            .filter(MusicLibrary.netease_playlist_id == netease_id)
            .first()
        )

    def get_music_libraries(
        self,
        skip: int = 0,
        limit: int = 100,
        tags: Optional[str] = None,
        is_public: Optional[bool] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> List[MusicLibrary]:
        """获取音乐库列表"""
        try:
            query = self.db.query(MusicLibrary)

            # 按公开状态筛选
            if is_public is not None:
                query = query.filter(MusicLibrary.is_public == is_public)

            # 按启用状态筛选
            if is_active is not None:
                query = query.filter(MusicLibrary.is_active == is_active)

            # 按标签筛选
            if tags:
                tag_list = [tag.strip() for tag in tags.split(",")]
                tag_conditions = []
                for tag in tag_list:
                    tag_conditions.append(MusicLibrary.tags.like(f"%{tag}%"))
                if tag_conditions:
                    query = query.filter(or_(*tag_conditions))

            # 排序
            if sort_by == "sort_order":
                query = query.order_by(
                    desc(MusicLibrary.sort_order), desc(MusicLibrary.created_at)
                )
            elif sort_by == "created_at":
                query = query.order_by(desc(MusicLibrary.created_at))
            elif sort_by == "title":
                query = query.order_by(MusicLibrary.title)
            elif sort_by == "track_count":
                query = query.order_by(
                    desc(MusicLibrary.track_count), MusicLibrary.title
                )
            else:
                query = query.order_by(
                    desc(MusicLibrary.sort_order), desc(MusicLibrary.created_at)
                )

            # 分页
            return query.offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"获取音乐库列表失败: {e}")
            raise e

    def count_music_libraries(
        self,
        tags: Optional[str] = None,
        is_public: Optional[bool] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """统计音乐库数量"""
        query = self.db.query(func.count(MusicLibrary.id))

        # 按公开状态筛选
        if is_public is not None:
            query = query.filter(MusicLibrary.is_public == is_public)

        # 按启用状态筛选
        if is_active is not None:
            query = query.filter(MusicLibrary.is_active == is_active)

        # 按标签筛选
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            tag_conditions = []
            for tag in tag_list:
                tag_conditions.append(MusicLibrary.tags.like(f"%{tag}%"))
            if tag_conditions:
                query = query.filter(or_(*tag_conditions))

        return query.scalar() or 0

    def get_music_libraries_paginated(
        self,
        page: int = 1,
        size: int = 20,
        tags: Optional[str] = None,
        is_public: Optional[bool] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> Tuple[List[MusicLibrary], int]:
        """分页获取音乐库列表"""
        skip = (page - 1) * size
        items = self.get_music_libraries(
            skip=skip,
            limit=size,
            tags=tags,
            is_public=is_public,
            is_active=is_active,
            sort_by=sort_by,
        )
        total = self.count_music_libraries(
            tags=tags, is_public=is_public, is_active=is_active
        )
        return items, total

    def create_music_library(self, library_in: MusicLibraryCreate) -> MusicLibrary:
        """创建音乐库"""
        try:
            # 检查是否已存在相同网易云ID的歌单
            existing = self.get_music_library_by_netease_id(
                library_in.netease_playlist_id
            )
            if existing:
                raise BadRequestException(
                    f"网易云歌单ID {library_in.netease_playlist_id} 已存在"
                )

            db_library = MusicLibrary(**library_in.dict())
            self.db.add(db_library)
            self.db.commit()
            self.db.refresh(db_library)

            logger.info(f"创建音乐库成功: {db_library.title}")
            return db_library
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建音乐库失败: {e}")
            raise

    def update_music_library(
        self, library_id: int, library_in: MusicLibraryUpdate
    ) -> Optional[MusicLibrary]:
        """更新音乐库"""
        try:
            db_library = self.get_music_library(library_id)
            if not db_library:
                raise NotFoundException(f"音乐库 ID {library_id} 不存在")

            update_data = library_in.dict(exclude_unset=True)

            # 如果更新网易云ID，检查是否重复
            if "netease_playlist_id" in update_data:
                existing = self.get_music_library_by_netease_id(
                    update_data["netease_playlist_id"]
                )
                if existing and existing.id != library_id:
                    raise BadRequestException(
                        f"网易云歌单ID {update_data['netease_playlist_id']} 已存在"
                    )

            for field, value in update_data.items():
                setattr(db_library, field, value)

            self.db.commit()
            self.db.refresh(db_library)

            logger.info(f"更新音乐库成功: {db_library.title}")
            return db_library
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新音乐库失败: {e}")
            raise

    def delete_music_library(self, library_id: int) -> bool:
        """删除音乐库"""
        try:
            db_library = self.get_music_library(library_id)
            if not db_library:
                raise NotFoundException(f"音乐库 ID {library_id} 不存在")

            # 删除关联的歌曲
            self.db.query(MusicTrack).filter(
                MusicTrack.library_id == library_id
            ).delete()

            # 删除音乐库
            self.db.delete(db_library)
            self.db.commit()

            logger.info(f"删除音乐库成功: {db_library.title}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除音乐库失败: {e}")
            raise

    async def import_from_netease(
        self,
        netease_playlist_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[str] = None,
        is_public: bool = False,
        user_id: Optional[int] = None,
    ) -> MusicLibrary:
        """从网易云导入歌单"""
        try:
            # 获取歌单详情
            playlist_data = await netease_service.get_playlist_detail(
                netease_playlist_id
            )
            playlist_info = playlist_data.get("playlist", {})
            tracks = playlist_info.get("tracks", [])

            if not tracks:
                raise BadRequestException("歌单中没有歌曲")

            # 使用自定义标题或网易云原标题
            library_title = title or playlist_info.get("name", "")
            library_description = description or playlist_info.get("description", "")
            cover_url = playlist_info.get("coverImgUrl", "")

            # 检查是否已存在相同网易云歌单ID的音乐库
            existing_library = self.get_music_library_by_netease_id(netease_playlist_id)
            if existing_library:
                raise BadRequestException(f"网易云歌单ID {netease_playlist_id} 已存在")

            # 批量查出歌单中所有歌曲的 netease_id，一次性判断哪些已存在
            all_netease_ids = [str(track.get("id", "")) for track in tracks]
            existing_ids = set(
                row[0]
                for row in self.db.query(MusicTrack.netease_id)
                .filter(MusicTrack.netease_id.in_(all_netease_ids))
                .all()
            )

            # 创建音乐库（先不 commit，统一在最后提交）
            db_library = MusicLibrary(
                title=library_title,
                description=library_description,
                netease_playlist_id=netease_playlist_id,
                netease_url=f"https://music.163.com/playlist?id={netease_playlist_id}",
                cover_image_url=cover_url,
                tags=tags,
                is_public=is_public,
                track_count=0,
            )
            self.db.add(db_library)
            self.db.flush()  # 获取 db_library.id，但不提交事务

            # 创建歌曲，跳过已存在的
            imported_count = 0
            skipped_count = 0
            for idx, track in enumerate(tracks):
                track_data = self._parse_netease_track(track, db_library.id, idx)
                if track_data["netease_id"] in existing_ids:
                    skipped_count += 1
                    logger.debug(
                        f"跳过已存在的歌曲: {track_data['title']} "
                        f"(netease_id={track_data['netease_id']})"
                    )
                    continue
                db_track = MusicTrack(**track_data)
                self.db.add(db_track)
                imported_count += 1

            # 更新实际导入的歌曲数量
            db_library.track_count = imported_count

            # 统一提交：库 + 歌曲在同一个事务
            self.db.commit()

            logger.info(
                f"从网易云导入歌单成功: {library_title}, "
                f"共 {len(tracks)} 首, 导入 {imported_count} 首, 跳过 {skipped_count} 首(已存在)"
            )
            return db_library

        except Exception as e:
            self.db.rollback()
            logger.error(f"从网易云导入歌单失败: {e}")
            raise

    def _parse_netease_track(
        self, track: dict, library_id: int, sort_order: int
    ) -> dict:
        """解析网易云歌曲数据"""
        ar = track.get("ar", [{}])
        al = track.get("al", {})

        return {
            "library_id": library_id,
            "title": track.get("name", ""),
            "artist": ar[0].get("name", "") if ar else "",
            "album": al.get("name", ""),
            "netease_id": str(track.get("id", "")),
            "netease_url": f"https://music.163.com/song?id={track.get('id', '')}",
            "cover_image_url": al.get("picUrl", ""),
            "duration": track.get("dt", 0) // 1000,  # 毫秒转秒
            "sort_order": sort_order,
        }


class MusicTrackService:
    """音乐曲目服务类"""

    def __init__(self, db: Session):
        """初始化服务"""
        self.db = db
        self.minio_service = _minio_singleton

    def get_music_track(self, track_id: int) -> Optional[MusicTrack]:
        """获取单个音乐曲目"""
        return self.db.query(MusicTrack).filter(MusicTrack.id == track_id).first()

    def get_music_track_by_netease_id(self, netease_id: str) -> Optional[MusicTrack]:
        """根据网易云ID获取音乐曲目"""
        return (
            self.db.query(MusicTrack)
            .filter(MusicTrack.netease_id == netease_id)
            .first()
        )

    def get_music_tracks(
        self,
        skip: int = 0,
        limit: int = 100,
        library_id: Optional[int] = None,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        status: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> List[MusicTrack]:
        """获取音乐曲目列表"""
        try:
            query = self.db.query(MusicTrack)

            # 按歌单筛选
            if library_id is not None:
                query = query.filter(MusicTrack.library_id == library_id)

            # 按分类筛选
            if category is not None:
                query = query.filter(MusicTrack.category == category)

            # 按状态筛选
            if status is not None:
                query = query.filter(MusicTrack.status == status)

            # 按收藏筛选
            if is_favorite is not None:
                query = query.filter(MusicTrack.is_favorite == is_favorite)

            # 按启用状态筛选
            if is_active is not None:
                query = query.filter(MusicTrack.is_active == is_active)

            # 按标签筛选
            if tags:
                tag_list = [tag.strip() for tag in tags.split(",")]
                tag_conditions = []
                for tag in tag_list:
                    tag_conditions.append(MusicTrack.tags.like(f"%{tag}%"))
                if tag_conditions:
                    query = query.filter(or_(*tag_conditions))

            # 排序
            if sort_by == "sort_order":
                query = query.order_by(MusicTrack.sort_order, MusicTrack.created_at)
            elif sort_by == "created_at":
                query = query.order_by(desc(MusicTrack.created_at))
            elif sort_by == "title":
                query = query.order_by(MusicTrack.title)
            elif sort_by == "rating":
                query = query.order_by(desc(MusicTrack.rating), MusicTrack.title)
            elif sort_by == "play_count":
                query = query.order_by(desc(MusicTrack.play_count), MusicTrack.title)
            else:
                query = query.order_by(MusicTrack.sort_order, MusicTrack.created_at)

            # 分页
            return query.offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"获取音乐曲目列表失败: {e}")
            raise e

    def count_music_tracks(
        self,
        library_id: Optional[int] = None,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        status: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """统计音乐曲目数量"""
        query = self.db.query(func.count(MusicTrack.id))

        # 按歌单筛选
        if library_id is not None:
            query = query.filter(MusicTrack.library_id == library_id)

        # 按分类筛选
        if category is not None:
            query = query.filter(MusicTrack.category == category)

        # 按状态筛选
        if status is not None:
            query = query.filter(MusicTrack.status == status)

        # 按收藏筛选
        if is_favorite is not None:
            query = query.filter(MusicTrack.is_favorite == is_favorite)

        # 按启用状态筛选
        if is_active is not None:
            query = query.filter(MusicTrack.is_active == is_active)

        # 按标签筛选
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            tag_conditions = []
            for tag in tag_list:
                tag_conditions.append(MusicTrack.tags.like(f"%{tag}%"))
            if tag_conditions:
                query = query.filter(or_(*tag_conditions))

        return query.scalar() or 0

    def get_music_tracks_paginated(
        self,
        page: int = 1,
        size: int = 20,
        library_id: Optional[int] = None,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        status: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> Tuple[List[MusicTrack], int]:
        """分页获取音乐曲目列表"""
        skip = (page - 1) * size
        items = self.get_music_tracks(
            skip=skip,
            limit=size,
            library_id=library_id,
            category=category,
            tags=tags,
            status=status,
            is_favorite=is_favorite,
            is_active=is_active,
            sort_by=sort_by,
        )
        total = self.count_music_tracks(
            library_id=library_id,
            category=category,
            tags=tags,
            status=status,
            is_favorite=is_favorite,
            is_active=is_active,
        )
        return items, total

    async def create_music_track(self, track_in: MusicTrackCreate) -> MusicTrack:
        """创建音乐曲目（自动补全无效的 netease_id）"""
        try:
            track_data = track_in.dict()

            # 如果 netease_id 不是有效的纯数字，尝试自动搜索补全
            await self._auto_resolve_netease_id(track_data)

            # 检查是否已存在相同网易云ID的歌曲
            existing = self.get_music_track_by_netease_id(track_data["netease_id"])
            if existing:
                raise BadRequestException(f"网易云歌曲ID {track_data['netease_id']} 已存在")

            db_track = MusicTrack(**track_data)
            self.db.add(db_track)
            self.db.commit()
            self.db.refresh(db_track)

            # 更新歌单的歌曲数量
            if db_track.library_id:
                self._update_library_track_count(db_track.library_id)

            logger.info(f"创建音乐曲目成功: {db_track.title}")
            return db_track
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建音乐曲目失败: {e}")
            raise

    @staticmethod
    async def _auto_resolve_netease_id(track_data: dict) -> None:
        """
        自动解析并补全 netease_id。
        如果传入的 netease_id 不是有效纯数字，则通过网易云搜索 API 匹配。
        """
        from app.services.netease_id_resolver import is_valid_netease_id, resolve_single

        current_id = track_data.get("netease_id", "")
        if is_valid_netease_id(current_id):
            return

        title = track_data.get("title", "")
        artist = track_data.get("artist", "")

        if not title or not artist:
            logger.warning("无法自动补全 netease_id: 缺少歌曲名或歌手名")
            return

        logger.info(f"netease_id '{current_id}' 无效，尝试自动搜索: {title} - {artist}")
        resolved_id = await resolve_single(title, artist)

        if resolved_id:
            track_data["netease_id"] = resolved_id
            track_data["netease_url"] = f"https://music.163.com/song?id={resolved_id}"
            logger.info(f"自动补全成功: {title} -> netease_id={resolved_id}")
        else:
            logger.warning(f"自动补全失败: {title} - {artist}，保留原值 '{current_id}'")

    def update_music_track(
        self, track_id: int, track_in: MusicTrackUpdate
    ) -> Optional[MusicTrack]:
        """更新音乐曲目"""
        try:
            db_track = self.get_music_track(track_id)
            if not db_track:
                raise NotFoundException(f"音乐曲目 ID {track_id} 不存在")

            update_data = track_in.dict(exclude_unset=True)

            # 如果更新网易云ID，检查是否重复
            if "netease_id" in update_data:
                existing = self.get_music_track_by_netease_id(update_data["netease_id"])
                if existing and existing.id != track_id:
                    raise BadRequestException(
                        f"网易云歌曲ID {update_data['netease_id']} 已存在"
                    )

            for field, value in update_data.items():
                setattr(db_track, field, value)

            self.db.commit()
            self.db.refresh(db_track)

            logger.info(f"更新音乐曲目成功: {db_track.title}")
            return db_track
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新音乐曲目失败: {e}")
            raise

    def delete_music_track(self, track_id: int) -> bool:
        """删除音乐曲目"""
        try:
            db_track = self.get_music_track(track_id)
            if not db_track:
                raise NotFoundException(f"音乐曲目 ID {track_id} 不存在")

            library_id = db_track.library_id

            self.db.delete(db_track)
            self.db.commit()

            # 更新歌单的歌曲数量
            if library_id:
                self._update_library_track_count(library_id)

            logger.info(f"删除音乐曲目成功: {db_track.title}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除音乐曲目失败: {e}")
            raise

    def _update_library_track_count(self, library_id: int):
        """更新歌单的歌曲数量"""
        count = (
            self.db.query(func.count(MusicTrack.id))
            .filter(MusicTrack.library_id == library_id)
            .scalar()
            or 0
        )

        library = (
            self.db.query(MusicLibrary).filter(MusicLibrary.id == library_id).first()
        )

        if library:
            library.track_count = count
            self.db.commit()

    async def get_lyrics(self, track_id: int) -> Optional[str]:
        """获取歌词"""
        try:
            db_track = self.get_music_track(track_id)
            if not db_track:
                raise NotFoundException(f"音乐曲目 ID {track_id} 不存在")

            # 如果已缓存歌词，直接返回
            if db_track.lyrics:
                return db_track.lyrics

            # 从网易云获取歌词
            lyrics_data = await netease_service.get_lyrics(db_track.netease_id)
            lrc = lyrics_data.get("lrc", {})
            lyrics = lrc.get("lyric", "")

            # 缓存歌词
            if lyrics:
                db_track.lyrics = lyrics
                self.db.commit()

            return lyrics
        except Exception as e:
            logger.error(f"获取歌词失败: {e}")
            return None

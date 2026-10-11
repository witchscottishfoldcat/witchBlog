import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import NotFoundException
from app.core.storage_paths import ALBUMS_PREFIX
from app.core.unified_logging import get_logger
from app.models.album import Album, Photo
from app.schemas.album import (
    AlbumCreate,
    AlbumUpdate,
    PhotoCreate,
    PhotoUpdate,
    PhotoUploadInfo,
)
from app.services.minio_service import minio_service

logger = get_logger(__name__)


class AlbumService:
    """相册服务类"""

    def __init__(self):
        pass

    # ==================== 相册相关操作 ====================

    def get_album(
        self, db: Session, album_id: int, user_id: Optional[int] = None
    ) -> Optional[Album]:
        """获取单个相册"""
        query = db.query(Album).filter(Album.id == album_id)
        # 预加载 photos 和 cover_photo，避免详情接口懒加载多次查询
        query = query.options(selectinload(Album.photos))

        album = query.first()
        if album:
            # 更新浏览次数
            album.view_count = (album.view_count or 0) + 1
            db.commit()
            db.refresh(album)

        return album

    def set_cover_photo(self, db: Session, album_id: int, photo_id: int) -> None:
        """设置相册封面照片（相册存在才更新，不存在时静默跳过）"""
        album = db.query(Album).filter(Album.id == album_id).first()
        if album:
            album.cover_photo_id = photo_id
            db.commit()

    def get_albums(
        self,
        db: Session,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
        tag: Optional[str] = None,
        sort_by: str = "created_at",
    ) -> List[Album]:
        """获取相册列表"""
        query = db.query(Album)

        # 根据可见性过滤
        if is_public is not None:
            query = query.filter(Album.is_public == is_public)

        # 根据标签过滤
        if tag:
            query = query.filter(func.json_extract(Album.tags, "$").like(f"%{tag}%"))

        # 排序
        if sort_by == "created_at":
            query = query.order_by(desc(Album.created_at))
        elif sort_by == "updated_at":
            query = query.order_by(desc(Album.updated_at))
        elif sort_by == "view_count":
            query = query.order_by(desc(Album.view_count))
        elif sort_by == "title":
            query = query.order_by(Album.title)

        # 预加载 photos 关系（_convert_album_to_response 会访问 album.photos 计算 photo_count），
        # 避免列表循环时 N+1 查询
        query = query.options(selectinload(Album.photos))

        return query.offset(skip).limit(limit).all()

    def count_albums(
        self,
        db: Session,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        tag: Optional[str] = None,
    ) -> int:
        """统计相册数量"""
        query = db.query(func.count(Album.id))

        # 根据用户ID和可见性过滤
        if user_id is not None:
            query = query.filter(Album.user_id == user_id)
            if is_public is not None:
                query = query.filter(Album.is_public == is_public)
        elif is_public is not None:
            query = query.filter(Album.is_public == is_public)
        else:
            query = query.filter(Album.is_public.is_(True))

        # 根据标签过滤
        if tag:
            query = query.filter(func.json_extract(Album.tags, "$").like(f"%{tag}%"))

        return query.scalar()

    def create_album(
        self, db: Session, album: AlbumCreate, user_id: Optional[int] = None
    ) -> Album:
        """创建相册"""
        db_album = Album(
            title=album.title,
            description=album.description,
            tags=album.tags,
            is_public=album.is_public,
            user_id=user_id,
        )
        db.add(db_album)
        db.commit()
        db.refresh(db_album)
        return db_album

    def update_album(
        self,
        db: Session,
        album_id: int,
        album: AlbumUpdate,
        user_id: Optional[int] = None,
    ) -> Album:
        """更新相册"""
        db_album = self._get_album_or_404(db, album_id)

        # 更新字段
        update_data = album.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_album, field, value)

        db_album.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_album)
        return db_album

    def delete_album(
        self, db: Session, album_id: int, user_id: Optional[int] = None
    ) -> bool:
        """删除相册"""
        db_album = self._get_album_or_404(db, album_id)
        db.delete(db_album)
        db.commit()
        return True

    # ==================== 照片相关操作 ====================

    def get_photo(
        self, db: Session, photo_id: int, user_id: Optional[int] = None
    ) -> Optional[Photo]:
        """获取单张照片"""
        query = db.query(Photo).filter(Photo.id == photo_id)
        return query.first()

    def get_photos(
        self,
        db: Session,
        album_id: Optional[int] = None,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "sort_order",
    ) -> List[Photo]:
        """获取照片列表"""
        query = db.query(Photo)

        # 根据相册ID过滤
        if album_id is not None:
            query = query.filter(Photo.album_id == album_id)

        # 根据可见性过滤
        if is_public is not None:
            query = query.join(Album, Photo.album_id == Album.id).filter(
                Album.is_public == is_public
            )

        # 排序
        if sort_by == "sort_order":
            query = query.order_by(Photo.sort_order)
        elif sort_by == "created_at":
            query = query.order_by(desc(Photo.created_at))
        elif sort_by == "updated_at":
            query = query.order_by(desc(Photo.updated_at))

        return query.offset(skip).limit(limit).all()

    def count_photos(
        self,
        db: Session,
        album_id: Optional[int] = None,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
    ) -> int:
        """统计照片数量"""
        query = db.query(func.count(Photo.id))

        # 根据相册ID过滤
        if album_id is not None:
            query = query.filter(Photo.album_id == album_id)

        # 根据可见性过滤
        if is_public is not None:
            query = query.join(Album, Photo.album_id == Album.id).filter(
                Album.is_public == is_public
            )

        return query.scalar()

    def create_photo(
        self,
        db: Session,
        photo: PhotoCreate,
        upload_info: PhotoUploadInfo,
        album_id: int,
        user_id: Optional[int] = None,
    ) -> Photo:
        """创建照片"""
        # 验证相册所有权
        album = self._get_album_or_404(db, album_id)

        # 生成唯一的MinIO对象名
        file_ext = (
            upload_info.original_filename.split(".")[-1]
            if "." in upload_info.original_filename
            else ""
        )
        minio_object_name = (
            f"{ALBUMS_PREFIX}{album_id}/photos/{uuid.uuid4().hex}.{file_ext}"
        )
        thumbnail_object_name = (
            f"{ALBUMS_PREFIX}{album_id}/thumbnails/{uuid.uuid4().hex}.{file_ext}"
        )

        db_photo = Photo(
            album_id=album_id,
            minio_bucket=minio_service.bucket_name,
            minio_object_name=minio_object_name,
            thumbnail_minio_object_name=thumbnail_object_name,
            original_filename=upload_info.original_filename,
            file_size=upload_info.file_size,
            mime_type=upload_info.mime_type,
            width=upload_info.width,
            height=upload_info.height,
            title=photo.title,
            description=photo.description,
            tags=photo.tags,
            is_cover=photo.is_cover,
            sort_order=photo.sort_order,
        )

        db.add(db_photo)
        db.commit()
        db.refresh(db_photo)

        # 如果设置为封面，则更新相册的封面照片ID
        if photo.is_cover:
            album.cover_photo_id = db_photo.id
            db.commit()
        return db_photo

    def update_photo(
        self,
        db: Session,
        photo_id: int,
        photo: PhotoUpdate,
        user_id: Optional[int] = None,
    ) -> Photo:
        """更新照片"""
        db_photo = (
            db.query(Photo)
            .join(Album, Photo.album_id == Album.id)
            .filter(Photo.id == photo_id)
            .first()
        )
        if not db_photo:
            raise NotFoundException("照片不存在")

        # 更新字段
        update_data = photo.dict(exclude_unset=True)
        old_is_cover = db_photo.is_cover
        for field, value in update_data.items():
            setattr(db_photo, field, value)

        db_photo.updated_at = datetime.utcnow()

        # 如果设置为封面，则更新相册的封面照片ID，并取消其他照片的封面状态
        if "is_cover" in update_data and photo.is_cover and not old_is_cover:
            # 取消其他照片的封面状态
            db.query(Photo).filter(
                and_(Photo.album_id == db_photo.album_id, Photo.id != photo_id)
            ).update({"is_cover": False})
            # 更新相册封面
            db_photo.album.cover_photo_id = db_photo.id

        db.commit()
        db.refresh(db_photo)
        return db_photo

    def delete_photo(
        self, db: Session, photo_id: int, user_id: Optional[int] = None
    ) -> bool:
        """删除照片"""
        db_photo = (
            db.query(Photo)
            .join(Album, Photo.album_id == Album.id)
            .filter(Photo.id == photo_id)
            .first()
        )
        if not db_photo:
            raise NotFoundException("照片不存在")

        album_id = db_photo.album_id
        is_cover = db_photo.is_cover

        db.delete(db_photo)

        # 如果删除的是封面照片，则清除相册的封面照片ID
        if is_cover:
            album = db.query(Album).filter(Album.id == album_id).first()
            if album:
                # 可以选择一个新的封面（第一张照片）或设为None
                first_photo = db.query(Photo).filter(Photo.album_id == album_id).first()
                album.cover_photo_id = first_photo.id if first_photo else None

        db.commit()
        return True

    def get_upload_url(
        self, db: Session, album_id: int, filename: str, user_id: Optional[int] = None
    ) -> Tuple[str, str, datetime]:
        """获取照片上传URL"""
        # 验证相册所有权
        self._get_album_or_404(db, album_id)

        # 生成唯一的MinIO对象名（扩展名白名单，防止危险后缀经预签名通道进入桶内）
        from app.core.exceptions import BadRequestException

        allowed_exts = {"jpg", "jpeg", "png", "gif", "webp", "bmp"}
        file_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if file_ext not in allowed_exts:
            raise BadRequestException("不支持的图片扩展名（仅允许 jpg/jpeg/png/gif/webp/bmp）")
        minio_object_name = (
            f"{ALBUMS_PREFIX}{album_id}/photos/{uuid.uuid4().hex}.{file_ext}"
        )

        # 获取预签名上传URL
        upload_url = minio_service.get_upload_url(minio_object_name, expires_in=3600)
        expire_at = datetime.utcnow() + timedelta(hours=1)

        return upload_url, minio_object_name, expire_at

    # ==================== 私有辅助方法 ====================

    def _get_album_or_404(self, db: Session, album_id: int) -> Album:
        """获取相册，如果不存在则抛出404异常"""
        album = db.query(Album).filter(Album.id == album_id).first()
        if not album:
            raise NotFoundException("相册不存在")

        return album


# 创建全局服务实例
album_service = AlbumService()

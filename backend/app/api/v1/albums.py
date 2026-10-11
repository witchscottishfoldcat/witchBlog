import io
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_current_user_optional, get_db
from app.core.storage_paths import ALBUMS_PREFIX, UPLOAD_PART_SIZE
from app.core.unified_logging import get_logger
from app.core.uploads import ensure_upload_size
from app.models.album import Album
from app.models.user import User
from app.schemas.album import (
    AlbumCreate,
    AlbumListResponse,
    AlbumResponse,
    AlbumUpdate,
    ImageUploadUrlResponse,
    PhotoCreate,
    PhotoInfo,
    PhotoListResponse,
    PhotoResponse,
    PhotoUpdate,
    PhotoUploadInfo,
)
from app.services.album_service import album_service
from app.services.minio_service import minio_service

logger = get_logger(__name__)

router = APIRouter()


# ==================== 相册相关API ====================


def _is_superuser(user: Optional[User]) -> bool:
    return user is not None and bool(user.is_superuser)


def _can_view_album(album: Album, user: Optional[User]) -> bool:
    """相册可见性：公开相册任何人可看，私有相册仅 owner / 超级管理员"""
    if album.is_public:
        return True
    if _is_superuser(user):
        return True
    return user is not None and album.user_id == user.id


def _can_manage_album(album: Album, user: User) -> bool:
    """相册写权限：仅 owner / 超级管理员"""
    return _is_superuser(user) or album.user_id == user.id


def _get_viewable_album_or_404(
    db: Session, album_id: int, user: Optional[User]
) -> Album:
    album = album_service.get_album(db, album_id, None)
    if not album or not _can_view_album(album, user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="相册不存在或无权访问")
    return album


def _get_manageable_album_or_404(db: Session, album_id: int, user: User) -> Album:
    album = album_service.get_album(db, album_id, None)
    if not album or not _can_manage_album(album, user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="相册不存在或无权访问")
    return album


@router.post("/", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
async def create_album(
    album: AlbumCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建相册"""
    db_album = album_service.create_album(db, album, current_user.id)
    return _convert_album_to_response(db_album, include_photos=False)


@router.get("/", response_model=AlbumListResponse)
async def get_albums(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=1000, description="每页记录数"),
    public_only: bool = Query(True, description="是否只获取公开相册"),
    tag: Optional[str] = Query(None, description="按标签筛选"),
    sort_by: str = Query(
        "created_at", description="排序字段：created_at, updated_at, view_count, title"
    ),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取相册列表（非超级管理员强制只返回公开相册）"""
    # 未登录/普通用户禁止借 public_only=false 枚举私有相册
    if not _is_superuser(current_user):
        public_only = True
    albums = album_service.get_albums(db, None, public_only, skip, limit, tag, sort_by)
    total = album_service.count_albums(db, None, public_only, tag)

    album_responses = []
    for album in albums:
        album_responses.append(_convert_album_to_response(album, include_photos=False))

    return AlbumListResponse(
        albums=album_responses, total=total, page=skip // limit + 1, per_page=limit
    )


@router.get("/{album_id}", response_model=AlbumResponse)
async def get_album(
    album_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取单个相册详情（私有相册仅 owner / 超级管理员）"""
    album = _get_viewable_album_or_404(db, album_id, current_user)
    return _convert_album_to_response(album, include_photos=True)


@router.put("/{album_id}", response_model=AlbumResponse)
async def update_album(
    album_id: int,
    album: AlbumUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新相册（仅 owner / 超级管理员）"""
    _get_manageable_album_or_404(db, album_id, current_user)
    try:
        db_album = album_service.update_album(db, album_id, album, current_user.id)
        return _convert_album_to_response(db_album, include_photos=False)
    except Exception as e:
        if "不存在" in str(e) or "无权访问" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise


@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_album(
    album_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除相册（仅 owner / 超级管理员）"""
    _get_manageable_album_or_404(db, album_id, current_user)
    try:
        album_service.delete_album(db, album_id, current_user.id)
    except Exception as e:
        if "不存在" in str(e) or "无权访问" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise


# ==================== 照片相关API ====================


@router.post("/{album_id}/photos/upload-url", response_model=ImageUploadUrlResponse)
async def get_photo_upload_url(
    album_id: int,
    filename: str = Query(..., description="文件名"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取照片上传URL（仅相册 owner / 超级管理员）"""
    _get_manageable_album_or_404(db, album_id, current_user)
    try:
        upload_url, file_key, expire_at = album_service.get_upload_url(
            db, album_id, filename, current_user.id
        )
        return ImageUploadUrlResponse(
            upload_url=upload_url,
            file_key=file_key,
            minio_bucket=minio_service.bucket_name,
            expire_at=expire_at,
        )
    except Exception as e:
        if "不存在" in str(e) or "无权访问" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise


@router.post(
    "/{album_id}/photos",
    response_model=PhotoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_photo(
    album_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_cover: bool = Form(False),
    sort_order: int = Form(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """上传照片到相册（仅相册 owner / 超级管理员）"""
    # 校验相册访问权限
    album = _get_manageable_album_or_404(db, album_id, current_user)
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="相册不存在")

    # 大小校验（防止超大文件整读进内存）
    ensure_upload_size(file)

    # 验证文件类型
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只支持图片文件")

    # 读取文件内容并使用 Pillow 校验真实图片格式（防止伪装文件）
    file_content = await file.read()
    is_valid, img_format, (width, height) = minio_service.validate_image_content(
        file_content
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件内容不是有效图片或格式不被支持（仅允许 JPEG/PNG/GIF/WEBP/BMP）",
        )

    # 准备照片信息
    photo = PhotoCreate(
        title=title,
        description=description,
        tags=tags.split(",") if tags else [],
        is_cover=is_cover,
        sort_order=sort_order,
    )

    upload_info = PhotoUploadInfo(
        original_filename=file.filename,
        file_size=len(file_content),
        mime_type=file.content_type,
        width=width,
        height=height,
    )

    # 上传到MinIO
    try:
        # 生成MinIO对象名
        import uuid

        # 扩展名白名单：对象名服务端可控，防止 .html/.svg 等危险后缀进入 OSS 代理回显链路
        allowed_exts = {"jpg", "jpeg", "png", "gif", "webp", "bmp"}
        filename = file.filename or ""
        file_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if file_ext not in allowed_exts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不支持的图片扩展名（仅允许 jpg/jpeg/png/gif/webp/bmp）",
            )
        minio_object_name = (
            f"{ALBUMS_PREFIX}{album_id}/photos/{uuid.uuid4().hex}.{file_ext}"
        )

        # 上传文件到MinIO
        minio_service.client.put_object(
            bucket_name=minio_service.bucket_name,
            object_name=minio_object_name,
            data=io.BytesIO(file_content),
            length=len(file_content),
            part_size=UPLOAD_PART_SIZE,
            content_type=file.content_type,
        )

        # 创建照片记录（直接在API中创建，避免在服务中重复生成MinIO对象名）
        from app.models.album import Photo

        db_photo = Photo(
            album_id=album_id,
            minio_bucket=minio_service.bucket_name,
            minio_object_name=minio_object_name,
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
            album_service.set_cover_photo(db, album_id, db_photo.id)

        return _convert_photo_to_response(db_photo)

    except Exception as e:
        logger.error(f"上传照片失败: {e}", exception=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="照片上传失败"
        )


@router.get("/{album_id}/photos", response_model=PhotoListResponse)
async def get_album_photos(
    album_id: int,
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=1000, description="每页记录数"),
    sort_by: str = Query(
        "sort_order", description="排序字段：sort_order, created_at, updated_at"
    ),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取相册中的照片列表（私有相册仅 owner / 超级管理员）"""
    # 验证相册是否存在且可访问
    _get_viewable_album_or_404(db, album_id, current_user)

    photos = album_service.get_photos(db, album_id, None, None, skip, limit, sort_by)
    total = album_service.count_photos(db, album_id, None, None)

    photo_responses = []
    for photo in photos:
        photo_responses.append(_convert_photo_to_response(photo))

    return PhotoListResponse(
        photos=photo_responses, total=total, page=skip // limit + 1, per_page=limit
    )


@router.get("/photos/{photo_id}", response_model=PhotoResponse)
async def get_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取单张照片详情（私有相册照片仅 owner / 超级管理员）"""
    photo = album_service.get_photo(db, photo_id, None)
    if not photo or not photo.album or not _can_view_album(photo.album, current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="照片不存在或无权访问")

    return _convert_photo_to_response(photo)


@router.put("/photos/{photo_id}", response_model=PhotoResponse)
async def update_photo(
    photo_id: int,
    photo: PhotoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新照片信息（仅相册 owner / 超级管理员）"""
    db_photo = album_service.get_photo(db, photo_id, None)
    if (
        not db_photo
        or not db_photo.album
        or not _can_manage_album(db_photo.album, current_user)
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="照片不存在或无权访问")
    try:
        db_photo = album_service.update_photo(db, photo_id, photo, current_user.id)
        return _convert_photo_to_response(db_photo)
    except Exception as e:
        if "不存在" in str(e) or "无权访问" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除照片（仅相册 owner / 超级管理员）"""
    db_photo = album_service.get_photo(db, photo_id, None)
    if (
        not db_photo
        or not db_photo.album
        or not _can_manage_album(db_photo.album, current_user)
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="照片不存在或无权访问")
    try:
        album_service.delete_photo(db, photo_id, current_user.id)
    except Exception as e:
        if "不存在" in str(e) or "无权访问" in str(e) or "无权删除" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise


# ==================== 辅助函数 ====================


def _convert_album_to_response(album, include_photos: bool = True) -> AlbumResponse:
    """将数据库相册对象转换为响应模型"""
    # 计算照片数量
    photo_count = len(album.photos) if hasattr(album, "photos") and album.photos else 0

    # 转换照片列表
    photos = []
    if include_photos and hasattr(album, "photos") and album.photos:
        for photo in album.photos:
            photos.append(_convert_photo_to_info(photo))

    # 获取封面照片
    cover_photo = None
    # 检查是否有封面照片ID，并从photos中查找
    if hasattr(album, "photos") and album.photos:
        cover_photo_id = getattr(album, "cover_photo_id", None)
        if cover_photo_id:
            # 从photos列表中查找封面照片
            for photo in album.photos:
                if photo.id == cover_photo_id:
                    cover_photo = _convert_photo_to_info(photo)
                    break
        # 如果没有明确的封面照片ID，查找标记为is_cover的照片
        if not cover_photo:
            for photo in album.photos:
                if getattr(photo, "is_cover", False):
                    cover_photo = _convert_photo_to_info(photo)
                    break

    return AlbumResponse(
        id=album.id,
        title=album.title,
        description=album.description,
        tags=album.tags,
        is_public=album.is_public,
        user_id=album.user_id,
        cover_photo_id=album.cover_photo_id,
        view_count=album.view_count,
        created_at=album.created_at,
        updated_at=album.updated_at,
        photos=photos,
        cover_photo=cover_photo,
        photo_count=photo_count,
    )


def _convert_photo_to_response(photo) -> PhotoResponse:
    """将数据库照片对象转换为响应模型"""
    # 获取图片URL
    try:
        from app.services.minio_service import minio_service

        image_url = minio_service.get_file_url(photo.minio_object_name)

        # 获取缩略图URL（如果有）
        thumbnail_url = None
        if photo.thumbnail_minio_object_name:
            thumbnail_url = minio_service.get_file_url(
                photo.thumbnail_minio_object_name
            )
    except Exception as e:
        logger.error(f"获取图片URL失败: {e}")
        image_url = ""
        thumbnail_url = None

    return PhotoResponse(
        id=photo.id,
        album_id=photo.album_id,
        minio_bucket=photo.minio_bucket,
        minio_object_name=photo.minio_object_name,
        original_filename=photo.original_filename,
        file_size=photo.file_size,
        mime_type=photo.mime_type,
        width=photo.width,
        height=photo.height,
        title=photo.title,
        description=photo.description,
        tags=photo.tags,
        thumbnail_minio_object_name=photo.thumbnail_minio_object_name,
        is_cover=photo.is_cover,
        sort_order=photo.sort_order,
        created_at=photo.created_at,
        updated_at=photo.updated_at,
        image_url=image_url,
        thumbnail_url=thumbnail_url,
    )


def _convert_photo_to_info(photo) -> PhotoInfo:
    """将数据库照片对象转换为PhotoInfo模型"""
    # 获取图片URL
    try:
        from app.services.minio_service import minio_service

        image_url = minio_service.get_file_url(photo.minio_object_name)

        # 获取缩略图URL（如果有）
        thumbnail_url = None
        if photo.thumbnail_minio_object_name:
            thumbnail_url = minio_service.get_file_url(
                photo.thumbnail_minio_object_name
            )
    except Exception as e:
        logger.error(f"获取图片URL失败: {e}")
        image_url = ""
        thumbnail_url = None

    return PhotoInfo(
        id=photo.id,
        minio_bucket=photo.minio_bucket,
        minio_object_name=photo.minio_object_name,
        original_filename=photo.original_filename,
        file_size=photo.file_size,
        mime_type=photo.mime_type,
        width=photo.width,
        height=photo.height,
        title=photo.title,
        description=photo.description,
        tags=photo.tags,
        thumbnail_minio_object_name=photo.thumbnail_minio_object_name,
        is_cover=photo.is_cover,
        sort_order=photo.sort_order,
        created_at=photo.created_at,
        image_url=image_url,
        thumbnail_url=thumbnail_url,
    )

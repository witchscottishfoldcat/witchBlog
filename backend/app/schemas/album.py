from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class AlbumBase(BaseModel):
    """相册基础模型"""

    title: str = Field(..., min_length=1, max_length=255, description="相册标题")
    description: Optional[str] = Field(None, description="相册描述")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    is_public: bool = Field(False, description="是否公开")

    @validator("tags")
    def validate_tags(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重


class AlbumCreate(AlbumBase):
    """创建相册请求模型"""


class AlbumUpdate(BaseModel):
    """更新相册请求模型"""

    title: Optional[str] = Field(None, min_length=1, max_length=255, description="相册标题")
    description: Optional[str] = Field(None, description="相册描述")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    is_public: Optional[bool] = Field(None, description="是否公开")
    cover_photo_id: Optional[int] = Field(None, description="封面照片ID")

    @validator("tags")
    def validate_tags(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重


class PhotoInfo(BaseModel):
    """照片信息模型"""

    id: int
    minio_bucket: str
    minio_object_name: str
    original_filename: str
    file_size: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    thumbnail_minio_object_name: Optional[str] = None
    is_cover: bool = False
    sort_order: int = 0
    image_url: str = Field(..., description="图片访问URL")
    thumbnail_url: Optional[str] = Field(None, description="缩略图访问URL")
    created_at: datetime

    class Config:
        from_attributes = True


class AlbumResponse(AlbumBase):
    """相册响应模型"""

    id: int
    user_id: Optional[int] = None
    cover_photo_id: Optional[int] = None
    view_count: int = 0
    created_at: datetime
    updated_at: datetime
    photos: List[PhotoInfo] = Field(default_factory=list, description="相册照片列表")
    cover_photo: Optional[PhotoInfo] = Field(None, description="封面照片")
    photo_count: int = Field(0, description="照片数量")

    class Config:
        from_attributes = True


class AlbumListResponse(BaseModel):
    """相册列表响应模型"""

    albums: List[AlbumResponse]
    total: int
    page: int
    per_page: int


class PhotoBase(BaseModel):
    """照片基础模型"""

    title: Optional[str] = Field(None, max_length=255, description="照片标题")
    description: Optional[str] = Field(None, description="照片描述")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    is_cover: bool = Field(False, description="是否设为封面")
    sort_order: int = Field(0, description="排序权重")

    @validator("tags")
    def validate_tags(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重


class PhotoCreate(PhotoBase):
    """照片创建模型"""


class PhotoUpdate(BaseModel):
    """更新照片请求模型"""

    title: Optional[str] = Field(None, max_length=255, description="照片标题")
    description: Optional[str] = Field(None, description="照片描述")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    is_cover: Optional[bool] = Field(None, description="是否设为封面")
    sort_order: Optional[int] = Field(None, description="排序权重")

    @validator("tags")
    def validate_tags(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重


class PhotoUploadInfo(BaseModel):
    """照片上传信息模型"""

    original_filename: str
    file_size: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None


class PhotoResponse(PhotoBase):
    """照片响应模型"""

    id: int
    album_id: int
    minio_bucket: str
    minio_object_name: str
    original_filename: str
    file_size: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    thumbnail_minio_object_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    image_url: str = Field(..., description="图片访问URL")
    thumbnail_url: Optional[str] = Field(None, description="缩略图访问URL")

    class Config:
        from_attributes = True


class PhotoListResponse(BaseModel):
    """照片列表响应模型"""

    photos: List[PhotoResponse]
    total: int
    page: int
    per_page: int


class ImageUploadUrlResponse(BaseModel):
    """图片上传URL响应模型"""

    upload_url: str = Field(..., description="图片上传URL")
    file_key: str = Field(..., description="文件在MinIO中的键名")
    minio_bucket: str = Field(..., description="MinIO桶名")
    expire_at: datetime = Field(..., description="链接过期时间")

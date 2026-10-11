from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class DiaryBase(BaseModel):
    """日记基础模型"""

    title: str = Field(..., min_length=1, max_length=255, description="日记标题")
    content: str = Field(..., min_length=1, description="日记内容，支持Markdown格式")
    weather: Optional[str] = Field(None, max_length=50, description="天气标签")
    mood: Optional[str] = Field(None, max_length=50, description="心情标签")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    is_public: bool = Field(False, description="是否公开")

    @validator("tags")
    def validate_tags(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重


class DiaryCreate(DiaryBase):
    """创建日记请求模型"""


class DiaryUpdate(BaseModel):
    """更新日记请求模型"""

    title: Optional[str] = Field(None, min_length=1, max_length=255, description="日记标题")
    content: Optional[str] = Field(None, min_length=1, description="日记内容")
    weather: Optional[str] = Field(None, max_length=50, description="天气标签")
    mood: Optional[str] = Field(None, max_length=50, description="心情标签")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    is_public: Optional[bool] = Field(None, description="是否公开")

    @validator("tags")
    def validate_tags(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重


class DiaryImageInfo(BaseModel):
    """日记图片信息模型"""

    id: int
    minio_bucket: str
    minio_object_name: str
    original_filename: str
    file_size: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    image_url: str = Field(..., description="图片访问URL")
    created_at: datetime


class DiaryResponse(DiaryBase):
    """日记响应模型"""

    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    images: List[DiaryImageInfo] = Field(default_factory=list, description="日记图片列表")


class DiaryListResponse(BaseModel):
    """日记列表响应模型"""

    diaries: List[DiaryResponse]
    total: int
    page: int
    per_page: int


class DiaryImageCreate(BaseModel):
    """日记图片创建模型"""

    original_filename: str
    file_size: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None


class DiaryImageResponse(BaseModel):
    """日记图片响应模型"""

    id: int
    diary_id: int
    minio_bucket: str
    minio_object_name: str
    original_filename: str
    file_size: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    image_url: str
    created_at: datetime


class ImageUploadUrlResponse(BaseModel):
    """图片上传URL响应模型"""

    upload_url: str = Field(..., description="预签名上传URL")
    object_name: str = Field(..., description="MinIO对象名称")
    expires_in: int = Field(..., description="URL过期时间（秒）")

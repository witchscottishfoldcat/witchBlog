from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class MDFileArchiveBase(BaseModel):
    """归档文件基础模型"""

    original_file_id: int
    title: str
    description: Optional[str] = None
    original_filename: str
    archive_object_name: str
    bucket_name: str
    file_size: Optional[int] = None
    file_url: Optional[str] = None
    etag: Optional[str] = None
    word_count: Optional[int] = 0
    is_public: Optional[bool] = False
    tags: Optional[str] = None
    archive_reason: Optional[str] = None

    # 元数据字段
    published: Optional[bool] = False
    category: Optional[str] = None
    subcategory: Optional[str] = None
    pinned: Optional[bool] = False
    encrypted: Optional[bool] = False
    author: Optional[str] = None
    parsed_metadata: Optional[Dict[str, Any]] = None


class MDFileArchiveCreate(MDFileArchiveBase):
    """创建归档文件请求模型"""

    archive_reason: str


class MDFileArchiveUpdate(BaseModel):
    """更新归档文件请求模型"""

    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    archive_reason: Optional[str] = None

    # 元数据字段
    published: Optional[bool] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    pinned: Optional[bool] = None
    encrypted: Optional[bool] = None
    author: Optional[str] = None
    parsed_metadata: Optional[Dict[str, Any]] = None


class MDFileArchive(MDFileArchiveBase):
    """归档文件响应模型"""

    id: int
    archive_date: datetime
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MDFileArchiveContent(BaseModel):
    """归档文件内容响应模型"""

    id: int
    title: str
    original_filename: str
    content: str
    archive_date: datetime

    class Config:
        from_attributes = True

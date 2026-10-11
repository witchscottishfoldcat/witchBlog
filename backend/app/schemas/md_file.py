from datetime import date, datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class MDFileBase(BaseModel):
    """MD文件基础模型"""

    title: str = Field(..., description="文件标题")
    description: Optional[str] = Field(None, description="文件描述")
    tags: Optional[str] = Field(None, description="标签，以逗号分隔")
    is_public: Optional[bool] = Field(False, description="是否公开")
    # Front-matter解析的元数据字段
    published: Optional[date] = Field(None, description="发布日期")
    category: Optional[str] = Field(None, description="文章一级分类")
    subcategory: Optional[str] = Field(None, description="文章二级分类")
    pinned: Optional[bool] = Field(False, description="是否置顶")
    encrypted: Optional[bool] = Field(False, description="是否加密")
    author: Optional[str] = Field(None, description="作者")


class MDFileCreate(MDFileBase):
    """创建MD文件模型"""

    content: str = Field(..., description="MD文件内容")
    filename: str = Field(..., description="文件名，需要包含.md扩展名")


class MDFileUpdate(BaseModel):
    """更新MD文件模型"""

    title: Optional[str] = Field(None, description="文件标题")
    description: Optional[str] = Field(None, description="文件描述")
    content: Optional[str] = Field(None, description="MD文件内容")
    tags: Optional[str] = Field(None, description="标签，以逗号分隔")
    is_public: Optional[bool] = Field(None, description="是否公开")
    # Front-matter解析的元数据字段
    published: Optional[date] = Field(None, description="发布日期")
    category: Optional[str] = Field(None, description="文章一级分类")
    subcategory: Optional[str] = Field(None, description="文章二级分类")
    pinned: Optional[bool] = Field(None, description="是否置顶")
    encrypted: Optional[bool] = Field(None, description="是否加密")
    author: Optional[str] = Field(None, description="作者")


class MDFile(MDFileBase):
    """MD文件完整模型"""

    id: int
    original_filename: str
    object_name: str
    bucket_name: str
    file_size: Optional[int]
    file_url: Optional[str]
    proxy_url: Optional[str]  # 添加代理URL字段
    etag: Optional[str]
    word_count: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    # 添加元数据字段
    parsed_metadata: Optional[Dict[str, Any]] = Field(None, description="解析的完整元数据")

    class Config:
        from_attributes = True


class MDFileWithContent(MDFile):
    """带内容的MD文件模型"""

    content: str


class MDFileList(BaseModel):
    """MD文件列表模型"""

    files: list[MDFile]
    total: int

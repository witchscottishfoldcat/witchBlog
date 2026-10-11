from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, validator


class ResourceLinkBase(BaseModel):
    """资源链接基础模型"""

    title: str
    url: str
    description: Optional[str] = None
    tags: Optional[str] = None
    category: str = "other"
    is_active: bool = True
    sort_order: int = 0

    @validator("tags")
    def validate_tags(cls, v):
        if v is None:
            return None
        # 处理标签格式，去除多余空格
        if isinstance(v, str):
            tags = [tag.strip() for tag in v.split(",") if tag.strip()]
            return ",".join(tags) if tags else None
        return v

    @validator("category")
    def validate_category(cls, v):
        # 预定义一些常见的分类
        allowed_categories = [
            "bilibili",
            "douyin",
            "weibo",
            "zhihu",
            "github",
            "personal",
            "other",
        ]
        if v not in allowed_categories:
            # 如果不是预定义分类，归类为other
            return "other"
        return v


class ResourceLinkCreate(ResourceLinkBase):
    """创建资源链接模型"""


class ResourceLinkUpdate(BaseModel):
    """更新资源链接模型"""

    title: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

    @validator("tags")
    def validate_tags(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            tags = [tag.strip() for tag in v.split(",") if tag.strip()]
            return ",".join(tags) if tags else None
        return v

    @validator("category")
    def validate_category(cls, v):
        if v is not None:
            allowed_categories = [
                "bilibili",
                "douyin",
                "weibo",
                "zhihu",
                "github",
                "personal",
                "other",
            ]
            if v not in allowed_categories:
                return "other"
        return v


class ResourceLink(ResourceLinkBase):
    """资源链接响应模型"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResourceLinkList(BaseModel):
    """资源链接列表响应模型"""

    items: List[ResourceLink]
    total: int
    page: int
    size: int
    pages: int


class ResourceLinkCategoryStats(BaseModel):
    """资源链接分类统计模型"""

    category: str
    count: int


class ResourceLinkTagStats(BaseModel):
    """资源链接标签统计模型"""

    tag: str
    count: int

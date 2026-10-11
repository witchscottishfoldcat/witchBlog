from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, validator

# 与 links.category 列长度（String(50)）保持一致
LINK_CATEGORY_MAX_LENGTH = 50
DEFAULT_LINK_CATEGORY = "friend"


def normalize_category(value: Optional[str], *, default: Optional[str] = None) -> str:
    """归一化链接分类：去除首尾空白；空值回退到 default；超长拒绝。

    自定义分类（如"论坛"）与内置分类（friend/video/other）同等合法，
    后台管理端允许自由填写分类。
    """
    if value is None:
        if default is None:
            raise ValueError("category 不能为空")
        return default
    normalized = value.strip()
    if not normalized:
        if default is None:
            raise ValueError("category 不能为空")
        return default
    if len(normalized) > LINK_CATEGORY_MAX_LENGTH:
        raise ValueError(f"category 长度不能超过 {LINK_CATEGORY_MAX_LENGTH} 个字符")
    return normalized


class LinkBase(BaseModel):
    """链接基础模型"""

    name: str
    url: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_type: Optional[str] = "external"
    tags: Optional[str] = None
    category: str = DEFAULT_LINK_CATEGORY
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
        return normalize_category(v, default=DEFAULT_LINK_CATEGORY)

    @validator("image_type")
    def validate_image_type(cls, v):
        if v and v not in ["external", "minio"]:
            raise ValueError("image_type must be one of: external, minio")
        return v


class LinkCreate(LinkBase):
    """创建链接模型"""


class LinkUpdate(BaseModel):
    """更新链接模型"""

    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_type: Optional[Literal["external", "minio"]] = None
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
        if v is None:
            return None
        return normalize_category(v)


class Link(LinkBase):
    """链接响应模型"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LinkList(BaseModel):
    """链接列表响应模型"""

    items: List[Link]
    total: int
    page: int
    size: int
    pages: int


class LinkCategoryStats(BaseModel):
    """链接分类统计模型"""

    category: str
    count: int


class LinkImageUploadResponse(BaseModel):
    """链接图片上传响应模型"""

    object_name: str
    image_url: str
    message: str = "图片上传成功"

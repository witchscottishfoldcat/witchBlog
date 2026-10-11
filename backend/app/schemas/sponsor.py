from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, validator

# 与 sponsors.source 列长度（String(20)）保持一致
SPONSOR_SOURCE_MAX_LENGTH = 20
SPONSOR_SOURCES = ("alipay", "wechat", "other")


def normalize_source(value: Optional[str]) -> str:
    """归一化赞助渠道：空白回退 other；非内置值原样保留（便于扩展）。"""
    if value is None:
        return "other"
    normalized = value.strip().lower()
    if not normalized:
        return "other"
    if len(normalized) > SPONSOR_SOURCE_MAX_LENGTH:
        raise ValueError(f"source 长度不能超过 {SPONSOR_SOURCE_MAX_LENGTH} 个字符")
    return normalized


class SponsorBase(BaseModel):
    """赞助鸣谢基础模型"""

    name: str = Field(..., min_length=1, max_length=50)
    message: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    source: str = "other"
    is_anonymous: bool = False
    is_active: bool = True
    sort_order: int = 0
    sponsored_at: Optional[datetime] = None

    @validator("source")
    def validate_source(cls, v):
        return normalize_source(v)

    @validator("name")
    def validate_name(cls, v):
        v = v.strip() if isinstance(v, str) else v
        if not v:
            raise ValueError("name 不能为空")
        return v


class SponsorCreate(SponsorBase):
    """创建赞助鸣谢模型"""


class SponsorUpdate(BaseModel):
    """更新赞助鸣谢模型（全部可选，只更新传入字段）"""

    name: Optional[str] = None
    message: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    source: Optional[str] = None
    is_anonymous: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    sponsored_at: Optional[datetime] = None

    @validator("source")
    def validate_source(cls, v):
        if v is None:
            return None
        return normalize_source(v)

    @validator("name")
    def validate_name(cls, v):
        if v is None:
            return None
        v = v.strip() if isinstance(v, str) else v
        if not v:
            raise ValueError("name 不能为空")
        return v


class Sponsor(SponsorBase):
    """赞助鸣谢响应模型"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SponsorList(BaseModel):
    """赞助鸣谢列表响应模型"""

    items: List[Sponsor]
    total: int

from typing import Optional

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class ResourceLink(BaseModel):
    """资源链接模型"""

    __tablename__ = "resource_links"

    # 基本信息
    title: Mapped[str] = mapped_column(String(100), nullable=False, comment="资源标题")
    url: Mapped[str] = mapped_column(String(500), nullable=False, comment="资源链接地址")
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="资源描述"
    )

    # 标签和分类
    tags: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="标签，多个标签用逗号分隔"
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, default="other", comment="资源分类"
    )

    # 状态和排序
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="是否启用"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="排序权重"
    )

    # created_at 和 updated_at 已在 BaseModel 中定义

    def __repr__(self):
        return (
            f"<ResourceLink(id={self.id}, title={self.title}, "
            f"category={self.category}, is_active={self.is_active})>"
        )

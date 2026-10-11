from typing import Optional

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Link(BaseModel):
    """链接模型"""

    __tablename__ = "links"

    # 基本信息
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="链接名称")
    url: Mapped[str] = mapped_column(String(500), nullable=False, comment="链接地址")
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="链接描述"
    )

    # 图片和标签
    image_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="链接图片URL（可以是外部URL或MinIO对象名称）"
    )
    image_type: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        default="external",
        comment="图片类型：external（外部链接）或minio（MinIO存储）",
    )
    tags: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="标签，多个标签用逗号分隔"
    )

    # 分类和状态
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="friend",
        comment="链接分类(friend:友链,video:视频,支持自定义分类)",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="是否启用"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="排序权重"
    )

    def __repr__(self):
        return (
            f"<Link(id={self.id}, name={self.name}, "
            f"category={self.category}, is_active={self.is_active})>"
        )

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class AboutPage(BaseModel):
    """关于页面模型 - 存储关于页面的内容"""

    __tablename__ = "about_pages"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    slug: Mapped[str] = mapped_column(
        String(200), nullable=False, unique=True, index=True
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    object_name: Mapped[str] = mapped_column(String(500), nullable=False)
    bucket_name: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    etag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    published: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    image: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    draft: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)

    # 外键关联
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )

    # 关联关系
    owner = relationship("User", backref="about_pages")

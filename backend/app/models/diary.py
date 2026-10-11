from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Diary(Base):
    """日记模型"""

    __tablename__ = "diaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    weather: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mood: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tags: Mapped[Any] = mapped_column(JSON, nullable=True)
    is_public: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # 关联关系
    user = relationship("User", back_populates="diaries")
    images = relationship(
        "DiaryImage", back_populates="diary", cascade="all, delete-orphan"
    )


class DiaryImage(Base):
    """日记图片模型"""

    __tablename__ = "diary_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    diary_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("diaries.id"), nullable=False
    )
    minio_bucket: Mapped[str] = mapped_column(String(100), nullable=False)
    minio_object_name: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    thumbnail_minio_object_name: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # 关联关系
    diary = relationship("Diary", back_populates="images")

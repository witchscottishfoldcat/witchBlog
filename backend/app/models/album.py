from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Album(Base):
    """相册模型"""

    __tablename__ = "albums"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )  # 封面图片URL（已弃用，使用cover_photo_id代替）
    cover_photo_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("photos.id"), nullable=True
    )  # 封面照片ID
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    tags: Mapped[Any] = mapped_column(JSON, nullable=True)
    is_public: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    view_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # 关联关系
    user = relationship("User", back_populates="albums")
    photos = relationship(
        "Photo",
        back_populates="album",
        foreign_keys="Photo.album_id",
        cascade="all, delete-orphan",
    )
    cover_photo = relationship("Photo", foreign_keys=[cover_photo_id], post_update=True)


class Photo(Base):
    """照片模型"""

    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    album_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("albums.id"), nullable=False
    )
    minio_bucket: Mapped[str] = mapped_column(String(100), nullable=False)
    minio_object_name: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Any] = mapped_column(JSON, nullable=True)
    thumbnail_minio_object_name: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )
    is_cover: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    sort_order: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # 关联关系
    album = relationship("Album", back_populates="photos", foreign_keys=[album_id])

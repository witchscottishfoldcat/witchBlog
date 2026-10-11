from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MDFileArchive(BaseModel):
    """MD文件归档模型"""

    __tablename__ = "md_files_archive"

    # 原始文件信息
    original_file_id: Mapped[int] = mapped_column(Integer, nullable=False)  # 原始文件的ID
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)  # 文件描述
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)  # 原始文件名

    # MinIO相关信息
    archive_object_name: Mapped[str] = mapped_column(
        String(500), nullable=False
    )  # 归档文件的MinIO对象名
    bucket_name: Mapped[str] = mapped_column(String(100), nullable=False)  # MinIO存储桶名
    file_size: Mapped[Optional[int]] = mapped_column(Integer)  # 文件大小(字节)
    file_url: Mapped[Optional[str]] = mapped_column(String(1000))  # 归档文件访问URL
    etag: Mapped[Optional[str]] = mapped_column(String(100))  # 文件ETag

    # 文件元信息
    word_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)  # 字数统计
    is_public: Mapped[Optional[bool]] = mapped_column(
        Boolean, default=False
    )  # 归档时是否是公开文件
    tags: Mapped[Optional[str]] = mapped_column(Text)  # 标签，以逗号分隔

    # 元数据字段
    published: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)  # 是否发布
    category: Mapped[Optional[str]] = mapped_column(String(100))  # 分类
    subcategory: Mapped[Optional[str]] = mapped_column(String(100))  # 二级分类
    pinned: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)  # 是否置顶
    encrypted: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)  # 是否加密
    author: Mapped[Optional[str]] = mapped_column(String(100))  # 作者
    parsed_metadata: Mapped[Optional[Any]] = mapped_column(
        JSON, nullable=True
    )  # 解析出的完整元数据JSON

    # 归档信息
    archive_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow
    )  # 归档日期
    archive_reason: Mapped[Optional[str]] = mapped_column(Text)  # 归档原因

    # 外键关联
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    # 关联关系
    owner = relationship("User", back_populates="md_files_archive")

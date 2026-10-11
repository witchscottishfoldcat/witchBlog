from datetime import date
from typing import Any, Optional

from sqlalchemy import JSON, Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MDFile(BaseModel):
    """MD文件模型"""

    __tablename__ = "md_files"

    # 基本信息
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)  # 文件描述
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)  # 原始文件名

    # MinIO相关信息
    object_name: Mapped[str] = mapped_column(String(500), nullable=False)  # MinIO对象名
    bucket_name: Mapped[str] = mapped_column(String(100), nullable=False)  # MinIO存储桶名
    file_size: Mapped[Optional[int]] = mapped_column(Integer)  # 文件大小(字节)
    file_url: Mapped[Optional[str]] = mapped_column(String(1000))  # 文件访问URL
    proxy_url: Mapped[Optional[str]] = mapped_column(String(1000))  # 代理缓存访问URL
    etag: Mapped[Optional[str]] = mapped_column(String(100))  # 文件ETag

    # 文件元信息
    word_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)  # 字数统计
    is_public: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)  # 是否公开
    tags: Mapped[Optional[str]] = mapped_column(Text)  # 标签，以逗号分隔

    # Front-matter解析的元数据
    published: Mapped[Optional[date]] = mapped_column(Date)  # 发布日期
    category: Mapped[Optional[str]] = mapped_column(String(100))  # 文章分类
    subcategory: Mapped[Optional[str]] = mapped_column(String(100))  # 文章二级分类
    pinned: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)  # 是否置顶
    encrypted: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)  # 是否加密
    author: Mapped[Optional[str]] = mapped_column(String(100))  # 作者
    parsed_metadata: Mapped[Optional[Any]] = mapped_column(
        JSON, nullable=True
    )  # 完整的解析元数据（JSON格式）

    # 外键关联
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    # 关联关系
    owner = relationship("User", back_populates="md_files")

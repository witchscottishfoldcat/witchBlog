from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class ProjectInfo(Base):
    """项目信息模型"""

    __tablename__ = "project_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="项目名称")
    description: Mapped[Optional[str]] = mapped_column(Text, comment="项目简介/描述")
    url: Mapped[str] = mapped_column(
        String(500), nullable=False, unique=True, comment="项目链接"
    )
    platform: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="平台：github/gitee"
    )
    tag: Mapped[Optional[str]] = mapped_column(
        String(50), default="策划中", comment="项目标签：策划中/已完成/进行中/已弃坑"
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), comment="项目头像URL")
    stars_count: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="星标数"
    )
    forks_count: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="复刻数"
    )
    language_stats: Mapped[Optional[Any]] = mapped_column(
        JSON, nullable=True, comment="语言统计JSON数据"
    )
    owner: Mapped[Optional[str]] = mapped_column(String(255), comment="项目所有者")
    repository_name: Mapped[Optional[str]] = mapped_column(String(255), comment="仓库名称")
    is_private: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="是否私有仓库：0-公开，1-私有"
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), comment="更新时间"
    )

    # 关联的语言统计详情
    languages = relationship(
        "ProjectLanguage", back_populates="project", cascade="all, delete-orphan"
    )


class ProjectLanguage(Base):
    """项目语言统计详情模型"""

    __tablename__ = "project_language"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project_info.id"), nullable=False, comment="项目ID"
    )
    language: Mapped[str] = mapped_column(String(100), nullable=False, comment="编程语言名称")
    bytes_count: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="该语言的字节数"
    )
    percentage: Mapped[Optional[float]] = mapped_column(
        Float, default=0.0, comment="该语言的百分比"
    )
    color: Mapped[Optional[str]] = mapped_column(String(20), comment="语言对应的颜色代码")

    # 关联到项目信息
    project = relationship("ProjectInfo", back_populates="languages")

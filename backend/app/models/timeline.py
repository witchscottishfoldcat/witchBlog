from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Timeline(Base):
    """时间线模型"""

    __tablename__ = "timelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="经历名称")
    subtitle: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, comment="副标题"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="介绍"
    )
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, comment="开始时间"
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="结束时间，可以为空表示当前"
    )
    location: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, comment="地点"
    )
    tags: Mapped[Any] = mapped_column(JSON, nullable=True, comment="标签，如教育经历、工作经历等")
    skills: Mapped[Any] = mapped_column(JSON, nullable=True, comment="小标签，所学技能或成就等")
    is_public: Mapped[Optional[bool]] = mapped_column(
        Boolean, default=False, comment="是否公开"
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, comment="用户ID"
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    # 关联关系
    user = relationship("User", back_populates="timelines")

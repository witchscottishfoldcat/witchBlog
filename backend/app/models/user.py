from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class User(BaseModel):
    """用户模型"""

    __tablename__ = "users"

    username: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # 关联关系
    texts = relationship("Text", back_populates="owner")
    md_files = relationship("MDFile", back_populates="owner")
    md_files_archive = relationship("MDFileArchive", back_populates="owner")
    diaries = relationship("Diary", back_populates="user")
    timelines = relationship("Timeline", back_populates="user")
    albums = relationship("Album", back_populates="user")
    refresh_sessions = relationship(
        "RefreshSession", back_populates="user", cascade="all, delete-orphan"
    )

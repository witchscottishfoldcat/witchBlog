from typing import Optional

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class AnimeWatchlist(BaseModel):
    """追番追剧列表模型"""

    __tablename__ = "anime_watchlist"

    # 基本信息
    title: Mapped[str] = mapped_column(String(200), nullable=False, comment="动漫/剧集标题")
    url: Mapped[str] = mapped_column(String(500), nullable=False, comment="观看链接地址")
    cover_image_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="封面图片链接"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="简介/描述"
    )

    # 分类和标签
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="anime",
        comment="分类: anime(动漫), drama(剧集), other(其他)",
    )
    tags: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="标签，多个标签用逗号分隔"
    )

    # 观看状态
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="want_watch",
        comment="状态: want_watch(想看), watching(在看), completed(已看完), dropped(已弃)",
    )
    progress: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, comment="观看进度百分比(0-100)"
    )
    current_episode: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="当前看到第几集"
    )
    total_episodes: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="总集数"
    )

    # 评分和收藏
    rating: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="个人评分(1-10分)"
    )
    is_favorite: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, comment="是否收藏"
    )

    # 排序和状态
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="是否启用"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="排序权重"
    )

    def __repr__(self):
        return (
            f"<AnimeWatchlist(id={self.id}, title={self.title}, "
            f"status={self.status}, progress={self.progress}%>"
        )

from typing import Optional

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class GameShowcase(BaseModel):
    """游戏展示模型"""

    __tablename__ = "game_showcase"

    # 基本信息
    title: Mapped[str] = mapped_column(String(200), nullable=False, comment="游戏名称")
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="游戏简介"
    )
    cover_image_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="封面图片链接"
    )

    # 外部平台 ID
    steam_appid: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True, unique=True, comment="Steam AppID"
    )
    steam_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="Steam 商店链接"
    )
    platform: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="steam",
        comment="平台: steam, epic, ps, switch, pc, mobile, other",
    )

    # 分类和标签
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="other",
        comment="分类: rpg, fps, strategy, simulation, indie, adventure, other",
    )
    tags: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="标签，多个标签用逗号分隔"
    )
    developer: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="开发商"
    )
    publisher: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="发行商"
    )

    # 游玩状态
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="want_play",
        comment=(
            "状态: want_play(想玩), playing(在玩), "
            "completed(已通关), shelved(搁置), dropped(弃坑)"
        ),
    )
    play_time: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="游玩时长（分钟）"
    )
    rating: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="个人评分(0-10分)"
    )
    review: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="个人短评")

    # 收藏和展示
    is_favorite: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, comment="是否收藏"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="是否启用"
    )
    is_r18: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, comment="是否 R18 成人内容（公开 API 默认过滤）"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="排序权重"
    )
    release_date: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True, comment="发行日期"
    )

    def __repr__(self):
        return (
            f"<GameShowcase(id={self.id}, title={self.title}, "
            f"platform={self.platform}, status={self.status})>"
        )

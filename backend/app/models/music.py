from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MusicLibrary(BaseModel):
    """音乐库（歌单）"""

    __tablename__ = "music_libraries"

    title: Mapped[str] = mapped_column(
        String(200), nullable=False, index=True, comment="歌单标题"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="歌单描述"
    )
    netease_playlist_id: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True, comment="网易云歌单ID"
    )
    netease_url: Mapped[str] = mapped_column(
        String(500), nullable=False, comment="网易云链接"
    )
    cover_image_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="封面图片链接"
    )
    minio_cover_object_name: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="MinIO封面图片对象名"
    )

    tags: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="标签，多个标签用逗号分隔"
    )
    is_public: Mapped[Optional[bool]] = mapped_column(
        Boolean, default=False, comment="是否公开"
    )
    track_count: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="歌曲数量"
    )
    view_count: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="浏览次数"
    )

    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, comment="创建用户ID"
    )
    is_active: Mapped[Optional[bool]] = mapped_column(
        Boolean, default=True, comment="是否启用"
    )
    sort_order: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="排序权重"
    )

    tracks = relationship(
        "MusicTrack", back_populates="library", cascade="all, delete-orphan"
    )


class MusicTrack(BaseModel):
    """音乐曲目"""

    __tablename__ = "music_tracks"

    library_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("music_libraries.id"),
        nullable=True,
        index=True,
        comment="所属歌单ID",
    )

    title: Mapped[str] = mapped_column(
        String(200), nullable=False, index=True, comment="歌曲标题"
    )
    artist: Mapped[str] = mapped_column(String(200), nullable=False, comment="艺术家")
    album: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="专辑名"
    )

    netease_id: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True, comment="网易云歌曲ID"
    )
    netease_url: Mapped[str] = mapped_column(
        String(500), nullable=False, comment="网易云链接"
    )
    cover_image_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="封面图片链接"
    )
    minio_cover_object_name: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="MinIO封面图片对象名"
    )

    duration: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="时长（秒）"
    )
    year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="发行年份")
    genre: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, comment="流派"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="简介/描述"
    )
    lyrics: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="歌词")

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pop",
        comment=(
            "分类: pop, rock, jazz, classical, electronic, "
            "hip_hop, country, blues, folk, r_and_b, other"
        ),
    )
    tags: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="标签，多个标签用逗号分隔"
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="unplayed",
        comment="状态: unplayed(未听), listening(在听), completed(已听完), disliked(不喜欢)",
    )
    play_count: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="播放次数"
    )
    last_played_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, comment="最后播放时间"
    )

    rating: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="个人评分(1-10分)"
    )
    is_favorite: Mapped[Optional[bool]] = mapped_column(
        Boolean, default=False, comment="是否收藏"
    )

    is_active: Mapped[Optional[bool]] = mapped_column(
        Boolean, default=True, comment="是否启用"
    )
    sort_order: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="排序权重"
    )

    library = relationship("MusicLibrary", back_populates="tracks")

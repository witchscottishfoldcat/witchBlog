from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AnimeWatchlistBase(BaseModel):
    """追番追剧基础模型"""

    title: str = Field(..., description="动漫/剧集标题", max_length=200)
    url: str = Field(..., description="观看链接地址", max_length=500)
    cover_image_url: Optional[str] = Field(None, description="封面图片链接", max_length=500)
    description: Optional[str] = Field(None, description="简介/描述")
    category: str = Field(
        "anime", description="分类: anime(动漫), drama(剧集), other(其他)", max_length=50
    )
    tags: Optional[str] = Field(None, description="标签，多个标签用逗号分隔", max_length=200)
    status: str = Field(
        "want_watch",
        description="状态: want_watch(想看), watching(在看), completed(已看完), dropped(已弃)",
        max_length=50,
    )
    progress: float = Field(0.0, description="观看进度百分比(0-100)", ge=0, le=100)
    current_episode: Optional[int] = Field(None, description="当前看到第几集", ge=0)
    total_episodes: Optional[int] = Field(None, description="总集数", ge=0)
    rating: Optional[float] = Field(None, description="个人评分(0-10分，0表示未评分)", ge=0, le=10)
    is_favorite: bool = Field(False, description="是否收藏")
    is_active: bool = Field(True, description="是否启用")
    sort_order: int = Field(0, description="排序权重")


class AnimeWatchlistCreate(AnimeWatchlistBase):
    """创建追番追剧"""


class AnimeWatchlistUpdate(BaseModel):
    """更新追番追剧"""

    title: Optional[str] = Field(None, description="动漫/剧集标题", max_length=200)
    url: Optional[str] = Field(None, description="观看链接地址", max_length=500)
    cover_image_url: Optional[str] = Field(None, description="封面图片链接", max_length=500)
    description: Optional[str] = Field(None, description="简介/描述")
    category: Optional[str] = Field(
        None, description="分类: anime(动漫), drama(剧集), other(其他)", max_length=50
    )
    tags: Optional[str] = Field(None, description="标签，多个标签用逗号分隔", max_length=200)
    status: Optional[str] = Field(
        None,
        description="状态: want_watch(想看), watching(在看), completed(已看完), dropped(已弃)",
        max_length=50,
    )
    progress: Optional[float] = Field(None, description="观看进度百分比(0-100)", ge=0, le=100)
    current_episode: Optional[int] = Field(None, description="当前看到第几集", ge=0)
    total_episodes: Optional[int] = Field(None, description="总集数", ge=0)
    rating: Optional[float] = Field(None, description="个人评分(0-10分，0表示未评分)", ge=0, le=10)
    is_favorite: Optional[bool] = Field(None, description="是否收藏")
    is_active: Optional[bool] = Field(None, description="是否启用")
    sort_order: Optional[int] = Field(None, description="排序权重")


class AnimeWatchlist(AnimeWatchlistBase):
    """追番追剧完整模型"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnimeWatchlistList(BaseModel):
    """追番追剧列表响应模型"""

    items: List[AnimeWatchlist]
    total: int
    page: int
    size: int
    pages: int


class AnimeWatchlistStatusStats(BaseModel):
    """追番追剧状态统计"""

    status: str
    count: int


class AnimeWatchlistCategoryStats(BaseModel):
    """追番追剧分类统计"""

    category: str
    count: int


class AnimeWatchlistTagStats(BaseModel):
    """追番追剧标签统计"""

    tag: str
    count: int

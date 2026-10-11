from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class GameShowcaseBase(BaseModel):
    """游戏展示基础模型"""

    title: str = Field(..., description="游戏名称", max_length=200)
    description: Optional[str] = Field(None, description="游戏简介")
    cover_image_url: Optional[str] = Field(None, description="封面图片链接", max_length=500)
    steam_appid: Optional[str] = Field(None, description="Steam AppID", max_length=20)
    steam_url: Optional[str] = Field(None, description="Steam 商店链接", max_length=500)
    platform: str = Field(
        "steam",
        description="平台: steam, epic, ps, switch, pc, mobile, other",
        max_length=50,
    )
    category: str = Field(
        "other",
        description="分类: rpg, fps, strategy, simulation, indie, adventure, other",
        max_length=50,
    )
    tags: Optional[str] = Field(None, description="标签，逗号分隔", max_length=500)
    developer: Optional[str] = Field(None, description="开发商", max_length=200)
    publisher: Optional[str] = Field(None, description="发行商", max_length=200)
    status: str = Field(
        "want_play",
        description=(
            "状态: want_play(想玩), playing(在玩), "
            "completed(已通关), shelved(搁置), dropped(弃坑)"
        ),
        max_length=50,
    )
    play_time: int = Field(0, description="游玩时长（分钟）", ge=0)
    rating: Optional[float] = Field(None, description="个人评分(0-10分)", ge=0, le=10)
    review: Optional[str] = Field(None, description="个人短评")
    is_favorite: bool = Field(False, description="是否收藏")
    is_active: bool = Field(True, description="是否启用")
    is_r18: bool = Field(False, description="是否 R18 成人内容（公开 API 默认过滤）")
    sort_order: int = Field(0, description="排序权重")
    release_date: Optional[str] = Field(None, description="发行日期", max_length=20)


class GameShowcaseCreate(GameShowcaseBase):
    """创建游戏"""


class GameShowcaseUpdate(BaseModel):
    """更新游戏"""

    title: Optional[str] = Field(None, description="游戏名称", max_length=200)
    description: Optional[str] = Field(None, description="游戏简介")
    cover_image_url: Optional[str] = Field(None, description="封面图片链接", max_length=500)
    steam_appid: Optional[str] = Field(None, description="Steam AppID", max_length=20)
    steam_url: Optional[str] = Field(None, description="Steam 商店链接", max_length=500)
    platform: Optional[str] = Field(None, description="平台", max_length=50)
    category: Optional[str] = Field(None, description="分类", max_length=50)
    tags: Optional[str] = Field(None, description="标签", max_length=500)
    developer: Optional[str] = Field(None, description="开发商", max_length=200)
    publisher: Optional[str] = Field(None, description="发行商", max_length=200)
    status: Optional[str] = Field(None, description="状态", max_length=50)
    play_time: Optional[int] = Field(None, description="游玩时长（分钟）", ge=0)
    rating: Optional[float] = Field(None, description="个人评分", ge=0, le=10)
    review: Optional[str] = Field(None, description="个人短评")
    is_favorite: Optional[bool] = Field(None, description="是否收藏")
    is_active: Optional[bool] = Field(None, description="是否启用")
    is_r18: Optional[bool] = Field(None, description="是否 R18 成人内容")
    sort_order: Optional[int] = Field(None, description="排序权重")
    release_date: Optional[str] = Field(None, description="发行日期", max_length=20)


class GameShowcase(GameShowcaseBase):
    """游戏展示完整模型"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GameShowcaseList(BaseModel):
    """游戏列表响应"""

    items: List[GameShowcase]
    total: int
    page: int
    size: int
    pages: int


# ==================== Steam 导入相关 ====================


class SteamImportRequest(BaseModel):
    """Steam 导入请求"""

    steam_id: str = Field(..., description="Steam 64位用户ID")
    import_all: bool = Field(True, description="是否导入全部游戏（False 则只导入有游玩时长的）")
    default_status: str = Field("want_play", description="导入时的默认状态")


class SteamImportResponse(BaseModel):
    """Steam 导入响应"""

    total_found: int = Field(description="Steam 库中总游戏数")
    imported: int = Field(description="新导入的游戏数")
    updated: int = Field(description="更新的游戏数")
    skipped: int = Field(description="跳过的游戏数")
    failed: int = Field(description="失败的游戏数")
    message: str


# ==================== 统计相关 ====================


class GameStatusStats(BaseModel):
    """游戏状态统计"""

    status: str
    count: int


class GamePlatformStats(BaseModel):
    """游戏平台统计"""

    platform: str
    count: int


class GameCategoryStats(BaseModel):
    """游戏分类统计"""

    category: str
    count: int


class GameOverallStats(BaseModel):
    """游戏总体统计"""

    total_games: int
    total_play_time: int  # 分钟
    total_play_time_hours: float
    favorite_count: int
    average_rating: Optional[float]
    status_stats: List[GameStatusStats]
    platform_stats: List[GamePlatformStats]
    category_stats: List[GameCategoryStats]

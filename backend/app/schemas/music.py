from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MusicLibraryBase(BaseModel):
    """音乐库（歌单）基础模型"""

    title: str = Field(..., description="歌单标题", max_length=200)
    description: Optional[str] = Field(None, description="歌单描述")
    netease_playlist_id: str = Field(..., description="网易云歌单ID", max_length=50)
    netease_url: str = Field(..., description="网易云链接", max_length=500)
    cover_image_url: Optional[str] = Field(None, description="封面图片链接", max_length=500)
    tags: Optional[str] = Field(None, description="标签，多个标签用逗号分隔", max_length=200)
    is_public: bool = Field(False, description="是否公开")
    track_count: int = Field(0, description="歌曲数量")
    is_active: bool = Field(True, description="是否启用")
    sort_order: int = Field(0, description="排序权重")


class MusicLibraryCreate(MusicLibraryBase):
    """创建音乐库"""


class MusicLibraryUpdate(BaseModel):
    """更新音乐库"""

    title: Optional[str] = Field(None, description="歌单标题", max_length=200)
    description: Optional[str] = Field(None, description="歌单描述")
    netease_playlist_id: Optional[str] = Field(
        None, description="网易云歌单ID", max_length=50
    )
    netease_url: Optional[str] = Field(None, description="网易云链接", max_length=500)
    cover_image_url: Optional[str] = Field(None, description="封面图片链接", max_length=500)
    tags: Optional[str] = Field(None, description="标签，多个标签用逗号分隔", max_length=200)
    is_public: Optional[bool] = Field(None, description="是否公开")
    track_count: Optional[int] = Field(None, description="歌曲数量")
    is_active: Optional[bool] = Field(None, description="是否启用")
    sort_order: Optional[int] = Field(None, description="排序权重")


class MusicTrackBase(BaseModel):
    """音乐曲目基础模型"""

    library_id: Optional[int] = Field(None, description="所属歌单ID")
    title: str = Field(..., description="歌曲标题", max_length=200)
    artist: str = Field(..., description="艺术家", max_length=200)
    album: Optional[str] = Field(None, description="专辑名", max_length=200)
    netease_id: str = Field(..., description="网易云歌曲ID", max_length=50)
    netease_url: str = Field(..., description="网易云链接", max_length=500)
    cover_image_url: Optional[str] = Field(None, description="封面图片链接", max_length=500)
    duration: Optional[int] = Field(None, description="时长（秒）")
    year: Optional[int] = Field(None, description="发行年份")
    genre: Optional[str] = Field(None, description="流派", max_length=50)
    description: Optional[str] = Field(None, description="简介/描述")
    lyrics: Optional[str] = Field(None, description="歌词")
    category: str = Field(
        "pop",
        description=(
            "分类: pop, rock, jazz, classical, electronic, "
            "hip_hop, country, blues, folk, r_and_b, other"
        ),
        max_length=50,
    )
    tags: Optional[str] = Field(None, description="标签，多个标签用逗号分隔", max_length=200)
    status: str = Field(
        "unplayed",
        description="状态: unplayed(未听), listening(在听), completed(已听完), disliked(不喜欢)",
        max_length=50,
    )
    play_count: int = Field(0, description="播放次数")
    rating: Optional[float] = Field(None, description="个人评分(1-10分)", ge=1, le=10)
    is_favorite: bool = Field(False, description="是否收藏")
    is_active: bool = Field(True, description="是否启用")
    sort_order: int = Field(0, description="排序权重")


class MusicTrackCreate(MusicTrackBase):
    """创建音乐曲目"""


class MusicTrackUpdate(BaseModel):
    """更新音乐曲目"""

    library_id: Optional[int] = Field(None, description="所属歌单ID")
    title: Optional[str] = Field(None, description="歌曲标题", max_length=200)
    artist: Optional[str] = Field(None, description="艺术家", max_length=200)
    album: Optional[str] = Field(None, description="专辑名", max_length=200)
    netease_id: Optional[str] = Field(None, description="网易云歌曲ID", max_length=50)
    netease_url: Optional[str] = Field(None, description="网易云链接", max_length=500)
    cover_image_url: Optional[str] = Field(None, description="封面图片链接", max_length=500)
    duration: Optional[int] = Field(None, description="时长（秒）")
    year: Optional[int] = Field(None, description="发行年份")
    genre: Optional[str] = Field(None, description="流派", max_length=50)
    description: Optional[str] = Field(None, description="简介/描述")
    lyrics: Optional[str] = Field(None, description="歌词")
    category: Optional[str] = Field(None, description="分类", max_length=50)
    tags: Optional[str] = Field(None, description="标签，多个标签用逗号分隔", max_length=200)
    status: Optional[str] = Field(None, description="状态", max_length=50)
    play_count: Optional[int] = Field(None, description="播放次数")
    rating: Optional[float] = Field(None, description="个人评分(1-10分)", ge=1, le=10)
    is_favorite: Optional[bool] = Field(None, description="是否收藏")
    is_active: Optional[bool] = Field(None, description="是否启用")
    sort_order: Optional[int] = Field(None, description="排序权重")


class MusicTrack(MusicTrackBase):
    """音乐曲目完整模型"""

    id: int
    minio_cover_object_name: Optional[str] = Field(None, description="MinIO封面图片对象名")
    last_played_at: Optional[datetime] = Field(None, description="最后播放时间")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MusicLibrary(MusicLibraryBase):
    """音乐库完整模型"""

    id: int
    minio_cover_object_name: Optional[str] = Field(None, description="MinIO封面图片对象名")
    view_count: int = Field(0, description="浏览次数")
    user_id: Optional[int] = Field(None, description="创建用户ID")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MusicLibraryDetail(MusicLibrary):
    """音乐库详情（包含歌曲列表）"""

    tracks: List[MusicTrack] = Field([], description="歌曲列表")


class MusicLibraryList(BaseModel):
    """音乐库列表响应模型"""

    items: List[MusicLibrary]
    total: int
    page: int
    size: int
    pages: int


class MusicTrackList(BaseModel):
    """音乐曲目列表响应模型"""

    items: List[MusicTrack]
    total: int
    page: int
    size: int
    pages: int


class ImportFromNeteaseRequest(BaseModel):
    """从网易云导入歌单请求"""

    netease_playlist_id: str = Field(..., description="网易云歌单ID")
    title: Optional[str] = Field(None, description="自定义歌单标题，如果不填则使用网易云原标题")
    description: Optional[str] = Field(None, description="自定义歌单描述")
    tags: Optional[str] = Field(None, description="标签，多个标签用逗号分隔")
    is_public: bool = Field(False, description="是否公开")


class ImportFromNeteaseResponse(BaseModel):
    """从网易云导入歌单响应"""

    library_id: int
    title: str
    track_count: int
    message: str


class SyncFromNeteaseResponse(BaseModel):
    """同步网易云歌单响应"""

    updated_count: int
    new_count: int
    message: str


class MusicLibraryStatusStats(BaseModel):
    """音乐库状态统计"""

    status: str
    count: int


class MusicLibraryCategoryStats(BaseModel):
    """音乐库分类统计"""

    category: str
    count: int


class MusicLibraryTagStats(BaseModel):
    """音乐库标签统计"""

    tag: str
    count: int


class MusicTrackStatusStats(BaseModel):
    """音乐曲目状态统计"""

    status: str
    count: int


class MusicTrackCategoryStats(BaseModel):
    """音乐曲目分类统计"""

    category: str
    count: int


class MusicTrackTagStats(BaseModel):
    """音乐曲目标签统计"""

    tag: str
    count: int


class PlayerCode(BaseModel):
    """播放器代码"""

    iframe_code: str = Field(..., description="iframe播放器代码")


class LyricsResponse(BaseModel):
    """歌词响应"""

    lyrics: Optional[str] = Field(None, description="歌词内容")
    message: str


# ==================== 前台展示专用模型 ====================


class MusicPublicTrack(BaseModel):
    """前台歌曲展示模型（精简字段）"""

    id: int
    title: str = Field(..., description="歌曲标题")
    artist: str = Field(..., description="艺术家")
    album: Optional[str] = Field(None, description="专辑名")
    cover_image_url: Optional[str] = Field(None, description="封面图片链接")
    duration: Optional[int] = Field(None, description="时长（秒）")
    year: Optional[int] = Field(None, description="发行年份")
    genre: Optional[str] = Field(None, description="流派")
    category: str = Field("pop", description="分类")
    tags: Optional[str] = Field(None, description="标签")
    status: str = Field("unplayed", description="状态")
    play_count: int = Field(0, description="播放次数")
    rating: Optional[float] = Field(None, description="评分")
    is_favorite: bool = Field(False, description="是否收藏")
    netease_id: str = Field(..., description="网易云歌曲ID")

    class Config:
        from_attributes = True


class MusicPublicPlaylist(BaseModel):
    """前台歌单展示模型（精简字段）"""

    id: int
    title: str = Field(..., description="歌单标题")
    description: Optional[str] = Field(None, description="歌单描述")
    cover_image_url: Optional[str] = Field(None, description="封面图片链接")
    tags: Optional[str] = Field(None, description="标签")
    track_count: int = Field(0, description="歌曲数量")
    view_count: int = Field(0, description="浏览次数")
    created_at: datetime

    class Config:
        from_attributes = True


class MusicPublicPlaylistDetail(MusicPublicPlaylist):
    """前台歌单详情（含歌曲列表）"""

    tracks: List[MusicPublicTrack] = Field([], description="歌曲列表")
    total_tracks: int = Field(0, description="歌曲总数")
    total_duration: int = Field(0, description="总时长（秒）")


class MusicPublicPlaylistList(BaseModel):
    """前台歌单列表响应"""

    items: List[MusicPublicPlaylist]
    total: int
    page: int
    size: int
    pages: int


class MusicPublicTrackList(BaseModel):
    """前台歌曲列表响应"""

    items: List[MusicPublicTrack]
    total: int
    page: int
    size: int
    pages: int


class MusicPublicStats(BaseModel):
    """音乐馆统计数据"""

    total_playlists: int = Field(0, description="歌单总数")
    total_tracks: int = Field(0, description="歌曲总数")
    total_play_count: int = Field(0, description="总播放次数")
    favorite_count: int = Field(0, description="收藏歌曲数")
    category_stats: List[MusicTrackCategoryStats] = Field([], description="分类统计")
    status_stats: List[MusicTrackStatusStats] = Field([], description="状态统计")


class MusicPublicOverview(BaseModel):
    """音乐馆首页概览"""

    stats: MusicPublicStats = Field(..., description="统计数据")
    playlists: List[MusicPublicPlaylist] = Field([], description="歌单列表")
    recent_tracks: List[MusicPublicTrack] = Field([], description="最近添加的歌曲")

from typing import Any, Dict, Optional

import httpx

from app.core.config import settings
from app.core.unified_logging import get_logger

logger = get_logger(__name__)


class NeteaseCloudMusicService:
    """网易云音乐 API 服务"""

    def __init__(self):
        self.base_url = settings.NETEASE_API_BASE
        self.timeout = settings.NETEASE_API_TIMEOUT

    async def _request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        发送请求到网易云 API

        Args:
            endpoint: API 端点
            params: 请求参数

        Returns:
            API 响应数据
        """
        url = f"{self.base_url}{endpoint}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                if data.get("code") != 200:
                    logger.error(f"网易云 API 请求失败: {data}")
                    raise Exception(
                        f"网易云 API 错误: {data.get('message', 'Unknown error')}"
                    )

                return data
            except httpx.HTTPError as e:
                logger.error(f"网易云 API 请求错误: {e}")
                raise Exception(f"请求网易云 API 失败: {str(e)}")
            except Exception as e:
                logger.error(f"网易云 API 未知错误: {e}")
                raise

    async def get_playlist_detail(self, playlist_id: str) -> Dict[str, Any]:
        """
        获取歌单详情

        Args:
            playlist_id: 歌单 ID

        Returns:
            歌单详情和歌曲列表
        """
        return await self._request("/playlist/detail", {"id": playlist_id})

    async def get_song_detail(self, song_ids: str) -> Dict[str, Any]:
        """
        获取歌曲详情

        Args:
            song_ids: 歌曲 ID，多个 ID 用逗号分隔

        Returns:
            歌曲详情
        """
        return await self._request("/song/detail", {"ids": song_ids})

    async def get_lyrics(self, song_id: str) -> Dict[str, Any]:
        """
        获取歌词

        Args:
            song_id: 歌曲 ID

        Returns:
            歌词数据
        """
        return await self._request("/lyric", {"id": song_id})

    async def search_songs(
        self, keywords: str, limit: int = 30, offset: int = 0
    ) -> Dict[str, Any]:
        """
        搜索歌曲

        Args:
            keywords: 搜索关键词
            limit: 返回数量限制
            offset: 偏移量

        Returns:
            搜索结果
        """
        return await self._request(
            "/cloudsearch",
            {
                "keywords": keywords,
                "limit": limit,
                "offset": offset,
                "type": 1,  # 1: 单曲
            },
        )

    async def search_playlists(
        self, keywords: str, limit: int = 30, offset: int = 0
    ) -> Dict[str, Any]:
        """
        搜索歌单

        Args:
            keywords: 搜索关键词
            limit: 返回数量限制
            offset: 偏移量

        Returns:
            搜索结果
        """
        return await self._request(
            "/cloudsearch",
            {
                "keywords": keywords,
                "limit": limit,
                "offset": offset,
                "type": 1000,  # 1000: 歌单
            },
        )

    async def get_song_comments(
        self, song_id: str, limit: int = 20, offset: int = 0
    ) -> Dict[str, Any]:
        """
        获取歌曲评论

        Args:
            song_id: 歌曲 ID
            limit: 返回数量限制
            offset: 偏移量

        Returns:
            评论数据
        """
        return await self._request(
            "/comment/music", {"id": song_id, "limit": limit, "offset": offset}
        )

    async def get_playlist_comments(
        self, playlist_id: str, limit: int = 20, offset: int = 0
    ) -> Dict[str, Any]:
        """
        获取歌单评论

        Args:
            playlist_id: 歌单 ID
            limit: 返回数量限制
            offset: 偏移量

        Returns:
            评论数据
        """
        return await self._request(
            "/comment/playlist", {"id": playlist_id, "limit": limit, "offset": offset}
        )

    async def get_similar_songs(self, song_id: str, limit: int = 10) -> Dict[str, Any]:
        """
        获取相似歌曲

        Args:
            song_id: 歌曲 ID
            limit: 返回数量限制

        Returns:
            相似歌曲列表
        """
        return await self._request("/simi/song", {"id": song_id, "limit": limit})

    async def get_recommend_playlists(self, limit: int = 10) -> Dict[str, Any]:
        """
        获取推荐歌单

        Args:
            limit: 返回数量限制

        Returns:
            推荐歌单列表
        """
        return await self._request("/recommend/resource", {"limit": limit})

    async def get_hot_playlists(
        self, limit: int = 10, cat: str = "全部"
    ) -> Dict[str, Any]:
        """
        获取热门歌单

        Args:
            limit: 返回数量限制
            cat: 歌单分类

        Returns:
            热门歌单列表
        """
        return await self._request("/top/playlist", {"limit": limit, "cat": cat})

    async def get_artist_songs(self, artist_id: str, limit: int = 50) -> Dict[str, Any]:
        """
        获取歌手热门歌曲

        Args:
            artist_id: 歌手 ID
            limit: 返回数量限制

        Returns:
            歌手歌曲列表
        """
        return await self._request(
            "/artist/top/song", {"id": artist_id, "limit": limit}
        )

    async def get_album_detail(self, album_id: str) -> Dict[str, Any]:
        """
        获取专辑详情

        Args:
            album_id: 专辑 ID

        Returns:
            专辑详情
        """
        return await self._request("/album", {"id": album_id})


netease_service = NeteaseCloudMusicService()

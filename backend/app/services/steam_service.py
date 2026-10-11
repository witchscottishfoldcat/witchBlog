"""
Steam Web API 交互服务

提供与 Steam Web API 交互的功能：
- 获取用户拥有的游戏列表
- 获取游戏详情（封面、简介、开发商等）
- 获取玩家资料
- 通过自定义 URL 解析 Steam ID
"""

import asyncio
from typing import Any, Dict, List, Optional

import httpx

from app.core.unified_logging import get_logger

logger = get_logger(__name__)

# Steam API 端点
STEAM_API_BASE = "https://api.steampowered.com"
STEAM_STORE_API = "https://store.steampowered.com/api"

# Store API 请求间隔（秒），避免被限速
STORE_API_DELAY = 0.3


class SteamService:
    """Steam Web API 服务"""

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def _api_request(
        self, url: str, params: Optional[Dict] = None, timeout: int = 15
    ) -> Dict[str, Any]:
        """发送 Steam API 请求"""
        if params is None:
            params = {}
        params["key"] = self.api_key
        params["format"] = "json"

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()

    async def _store_request(
        self, appid: str, timeout: int = 15
    ) -> Optional[Dict[str, Any]]:
        """发送 Steam Store API 请求（不需要 Key）"""
        url = f"{STEAM_STORE_API}/appdetails"
        params = {"appids": appid, "l": "schinese"}

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        app_data = data.get(str(appid), {})
        if not app_data.get("success"):
            return None
        return app_data.get("data")

    # ==================== 用户相关 ====================

    async def get_player_summary(self, steam_id: str) -> Optional[Dict]:
        """获取 Steam 用户基本资料"""
        try:
            url = f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/"
            data = await self._api_request(url, {"steamids": steam_id})
            players = data.get("response", {}).get("players", [])
            return players[0] if players else None
        except Exception as e:
            logger.error(f"获取 Steam 用户资料失败: {e}")
            return None

    async def resolve_vanity_url(self, vanity_name: str) -> Optional[str]:
        """通过自定义 URL 名称解析为 64 位 Steam ID"""
        try:
            url = f"{STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/"
            data = await self._api_request(url, {"vanityurl": vanity_name})
            response = data.get("response", {})
            if response.get("success") == 1:
                return response.get("steamid")
            return None
        except Exception as e:
            logger.error(f"解析 Steam VanityURL 失败: {e}")
            return None

    # ==================== 游戏库 ====================

    async def get_owned_games(
        self, steam_id: str, include_free: bool = True
    ) -> List[Dict]:
        """
        获取用户拥有的全部游戏

        Returns:
            游戏列表，每个游戏包含：appid, name, playtime_forever 等字段
        """
        try:
            url = f"{STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/"
            params = {
                "steamid": steam_id,
                "include_appinfo": 1,
                "include_played_free_games": 1 if include_free else 0,
            }
            data = await self._api_request(url, params)
            return data.get("response", {}).get("games", [])
        except Exception as e:
            logger.error(f"获取 Steam 游戏库失败: {e}")
            return []

    # ==================== 游戏详情 ====================

    async def get_game_details(self, appid: str) -> Optional[Dict]:
        """
        获取游戏详情（封面、简介、开发商、标签等）

        使用 Steam Store API，不需要 API Key。
        """
        try:
            data = await self._store_request(appid)
            if not data:
                return None

            genres = [g.get("description", "") for g in data.get("genres", [])]

            return {
                "name": data.get("name", ""),
                "description": data.get("short_description", ""),
                "header_image": data.get("header_image", ""),
                "developers": data.get("developers", []),
                "publishers": data.get("publishers", []),
                "genres": genres,
                "release_date": data.get("release_date", {}).get("date", ""),
                "type": data.get("type", ""),
                "content_descriptors": data.get("content_descriptors", {}),
            }
        except Exception as e:
            logger.warning(f"获取游戏详情失败 (appid={appid}): {e}")
            return None

    async def get_games_details_batch(
        self, appids: List[str], max_concurrent: int = 3
    ) -> Dict[str, Dict]:
        """
        批量获取游戏详情

        由于 Store API 有限速，使用信号量控制并发数。
        """
        results = {}
        semaphore = asyncio.Semaphore(max_concurrent)

        async def fetch_one(appid: str):
            async with semaphore:
                details = await self.get_game_details(appid)
                if details:
                    results[appid] = details
                await asyncio.sleep(STORE_API_DELAY)

        tasks = [fetch_one(aid) for aid in appids]
        await asyncio.gather(*tasks, return_exceptions=True)
        return results


def create_steam_service() -> SteamService:
    """创建 Steam 服务实例（从配置中读取 API Key）"""
    from app.core.config import settings

    return SteamService(api_key=settings.STEAM_API_KEY)

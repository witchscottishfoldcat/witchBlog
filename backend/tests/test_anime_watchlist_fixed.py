"""追番追剧 API 单元测试（对齐当前端点实现）。

原版测试针对已移除的 `get_anime_detail` 端点与异步服务方法；
当前实现：列表/详情/批量更新端点调用的是 AnimeWatchlistService 的**同步**方法，
详情能力由 `get_anime_watchlist_item` 提供。本版保留原测试意图并按当前契约重写。
"""

from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.anime_watchlist import (
    batch_update_anime_metadata,
    get_anime_watchlist,
    get_anime_watchlist_item,
)
from app.models import AnimeWatchlist
from app.services.anime_watchlist import AnimeWatchlistService


def _item(id=1, title="测试动漫", status="watching"):
    return AnimeWatchlist(id=id, title=title, status=status)


class TestAnimeWatchlistList:
    """列表端点（GET /，服务方法 get_anime_watchlist_items）"""

    @pytest.mark.asyncio
    async def test_list_success(self):
        mock_db = Mock()
        with patch("app.api.v1.anime_watchlist.AnimeWatchlistService") as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.get_anime_watchlist_items = Mock(
                return_value=[_item(1, "测试动漫1"), _item(2, "测试动漫2")]
            )

            result = await get_anime_watchlist(
                category=None,
                tags=None,
                status=None,
                is_favorite=None,
                is_active=True,
                skip=0,
                limit=100,
                sort_by="sort_order",
                db=mock_db,
            )

            assert len(result) == 2
            assert result[0].title == "测试动漫1"
            assert result[1].title == "测试动漫2"
            mock_instance.get_anime_watchlist_items.assert_called_once_with(
                category=None,
                tags=None,
                status=None,
                is_favorite=None,
                is_active=True,
                skip=0,
                limit=100,
                sort_by="sort_order",
            )

    @pytest.mark.asyncio
    async def test_list_with_filters(self):
        mock_db = Mock()
        with patch("app.api.v1.anime_watchlist.AnimeWatchlistService") as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.get_anime_watchlist_items = Mock(
                return_value=[_item(1, status="watching")]
            )

            result = await get_anime_watchlist(
                category="anime",
                status="watching",
                skip=0,
                limit=5,
                db=mock_db,
            )

            assert len(result) == 1
            assert result[0].status == "watching"
            call_kwargs = mock_instance.get_anime_watchlist_items.call_args.kwargs
            assert call_kwargs["category"] == "anime"
            assert call_kwargs["status"] == "watching"
            assert call_kwargs["limit"] == 5

    @pytest.mark.asyncio
    async def test_list_database_error_maps_to_500(self):
        mock_db = Mock()
        with patch("app.api.v1.anime_watchlist.AnimeWatchlistService") as mock_service:
            mock_service.return_value.get_anime_watchlist_items = Mock(
                side_effect=SQLAlchemyError("数据库错误")
            )

            with pytest.raises(HTTPException) as exc_info:
                await get_anime_watchlist(limit=100, db=mock_db)

            assert exc_info.value.status_code == 500
            assert "获取追番追剧列表失败" in exc_info.value.detail


class TestBatchUpdateAnimeMetadata:
    """批量更新元数据（方法名契约：batch_update_anime_metadata）"""

    @pytest.mark.asyncio
    async def test_batch_update_success(self):
        mock_db = Mock()
        with patch("app.api.v1.anime_watchlist.AnimeWatchlistService") as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.batch_update_anime_metadata = Mock(
                return_value={"updated_count": 5, "errors": []}
            )

            result = await batch_update_anime_metadata(limit=10, db=mock_db)

            assert result["updated_count"] == 5
            assert result["errors"] == []
            mock_instance.batch_update_anime_metadata.assert_called_once_with(limit=10)

    @pytest.mark.asyncio
    async def test_batch_update_with_errors(self):
        mock_db = Mock()
        with patch("app.api.v1.anime_watchlist.AnimeWatchlistService") as mock_service:
            mock_service.return_value.batch_update_anime_metadata = Mock(
                return_value={
                    "updated_count": 3,
                    "errors": ["动漫1更新失败", "动漫2网络错误"],
                }
            )

            result = await batch_update_anime_metadata(limit=50, db=mock_db)

            assert result["updated_count"] == 3
            assert len(result["errors"]) == 2
            assert "动漫1更新失败" in result["errors"]

    @pytest.mark.asyncio
    async def test_batch_update_method_name_contract(self):
        """端点与服务的方法名必须一致（历史缺陷：调用不存在的 batch_update_metadata）"""
        mock_db = Mock()
        with patch("app.api.v1.anime_watchlist.AnimeWatchlistService") as mock_service:
            # 端点调用真实方法名（历史缺陷为调用不存在的 batch_update_metadata，
            # 那会在 patch 掉整个服务类时表现为 AttributeError 而非 Mock 返回）
            mock_service.return_value.batch_update_anime_metadata = Mock(
                return_value={"updated_count": 1, "errors": []}
            )
            result = await batch_update_anime_metadata(limit=50, db=mock_db)
            assert result["updated_count"] == 1


class TestAnimeDetailAPI:
    """详情端点（get_anime_watchlist_item，取代原 get_anime_detail）"""

    @pytest.mark.asyncio
    async def test_detail_success(self):
        mock_db = Mock()
        with patch("app.api.v1.anime_watchlist.AnimeWatchlistService") as mock_service:
            mock_instance = mock_service.return_value
            expected = AnimeWatchlist(
                id=1,
                title="测试动漫",
                status="watching",
                cover_image_url="https://example.com/cover.jpg",
            )
            mock_instance.get_anime_watchlist = Mock(return_value=expected)

            result = await get_anime_watchlist_item(item_id=1, db=mock_db)

            assert result.id == 1
            assert result.title == "测试动漫"
            mock_instance.get_anime_watchlist.assert_called_once_with(1)

    @pytest.mark.asyncio
    async def test_detail_not_found(self):
        mock_db = Mock()
        with patch("app.api.v1.anime_watchlist.AnimeWatchlistService") as mock_service:
            mock_service.return_value.get_anime_watchlist = Mock(return_value=None)

            with pytest.raises(HTTPException) as exc_info:
                await get_anime_watchlist_item(item_id=999, db=mock_db)

            assert exc_info.value.status_code == 404
            assert "追番追剧项目不存在" in exc_info.value.detail


class TestServiceMethodContract:
    """服务类方法名契约（防止端点/服务再度漂移）"""

    def test_service_has_current_method_names(self):
        service = AnimeWatchlistService(Mock())
        for name in (
            "get_anime_watchlist",
            "get_anime_watchlist_items",
            "get_anime_watchlist_paginated",
            "update_anime_watchlist",
            "batch_update_anime_metadata",
        ):
            assert hasattr(service, name), f"AnimeWatchlistService 缺少方法 {name}"

    def test_http_layer_list_route(self, client):
        """HTTP 层冒烟：列表路由可达且返回 JSON 数组（直调函数不经过路由层）"""
        resp = client.get("/api/v1/anime-watchlist/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

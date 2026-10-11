#!/usr/bin/env python3
"""
测试添加追番时的自动图片提取功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db  # noqa: E402
from app.schemas.anime_watchlist import AnimeWatchlistCreate  # noqa: E402
from app.services.anime_watchlist import create_anime_watchlist_service  # noqa: E402


def test_create_anime_with_url():
    """测试添加追番时的自动图片提取功能"""
    print("测试添加追番时的自动图片提取功能")
    print("=" * 60)

    # 获取数据库会话
    db = next(get_db())

    # 创建服务实例
    service = create_anime_watchlist_service(db)

    # 测试数据 - 使用B站番剧URL
    anime_data = AnimeWatchlistCreate(
        title="赛马娘 芦毛灰姑娘",
        url="https://www.bilibili.com/bangumi/media/md25581526",
        category="anime",
        status="watching",
        current_episode=0,
        total_episodes=12,
        progress=0.0,
        rating=0.0,
        is_favorite=False,
        is_active=True,
        sort_order=0,
        tags="运动,竞技,赛马",
        notes="测试添加追番时的自动图片提取功能",
    )

    try:
        print(f"添加追番项目: {anime_data.title}")
        print(f"URL: {anime_data.url}")
        print("\n开始创建追番项目...")

        # 调用create_anime_watchlist方法
        result = service.create_anime_watchlist(anime_data)

        print("\n创建成功!")
        print(f"ID: {result.id}")
        print(f"标题: {result.title}")
        print(f"封面图片对象名称: {result.cover_image_object_name}")
        print(f"封面图片URL: {result.cover_image_url}")

        return result

    except Exception as e:
        print(f"\n创建失败: {e}")
        import traceback

        traceback.print_exc()
        return None


if __name__ == "__main__":
    test_create_anime_with_url()

#!/usr/bin/env python3
"""
测试添加追番时自动提取元数据的功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db  # noqa: E402
from app.schemas.anime_watchlist import AnimeWatchlistCreate  # noqa: E402
from app.services.anime_watchlist import create_anime_watchlist_service  # noqa: E402


def test_create_anime_with_metadata():
    """测试添加追番时自动提取元数据的功能"""
    print("测试添加追番时自动提取元数据的功能")
    print("=" * 60)

    # 获取数据库会话
    db = next(get_db())

    # 创建服务实例
    service = create_anime_watchlist_service(db)

    # 测试数据 - 只提供URL，其他信息应该自动提取
    anime_data = AnimeWatchlistCreate(
        title="测试自动提取",  # 这个可能会被覆盖
        url="https://www.bilibili.com/bangumi/media/md21087073",
        category="anime",
        status="want_watch",
        tags=""  # 留空，看是否会被自动填充
        # 不提供notes、total_episodes等，看是否会被自动填充
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
        print(f"URL: {result.url}")
        print(f"封面图片URL: {result.cover_image_url}")
        print(f"分类: {result.category}")
        print(f"状态: {result.status}")
        print(f"总集数: {result.total_episodes}")
        print(f"标签: {result.tags}")
        print(f"描述: {result.description}")

        return result

    except Exception as e:
        print(f"\n创建失败: {e}")
        import traceback

        traceback.print_exc()
        return None


if __name__ == "__main__":
    test_create_anime_with_metadata()

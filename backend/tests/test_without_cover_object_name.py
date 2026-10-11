#!/usr/bin/env python3
"""
测试删除cover_image_object_name后的功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db  # noqa: E402
from app.schemas.anime_watchlist import AnimeWatchlistCreate  # noqa: E402
from app.services.anime_watchlist import create_anime_watchlist_service  # noqa: E402


def test_without_cover_object_name():
    """测试删除cover_image_object_name后的功能"""
    print("测试删除cover_image_object_name后的功能")
    print("=" * 60)

    # 获取数据库会话
    db = next(get_db())

    # 创建服务实例
    service = create_anime_watchlist_service(db)

    # 测试数据 - 只提供URL，其他信息应该自动提取
    anime_data = AnimeWatchlistCreate(
        title="",  # 留空，应该被自动填充
        url="https://www.bilibili.com/bangumi/media/md27682304",
        category="anime",
        status="want_watch",
        total_episodes=0,  # 留0，如果提取到信息应该被更新
        tags="",  # 留空
        description="",  # 留空，应该被自动填充
    )

    try:
        print(f"添加追番项目: {anime_data.url}")
        print(f"原标题: '{anime_data.title}'")
        print(f"原封面URL: '{anime_data.cover_image_url}'")
        print(f"原描述: '{anime_data.description}'")
        print(f"原总集数: {anime_data.total_episodes}")
        print("\n开始创建追番项目...")

        # 调用create_anime_watchlist方法
        result = service.create_anime_watchlist(anime_data)

        print("\n创建成功!")
        print(f"ID: {result.id}")
        print(f"最终标题: {result.title}")
        print(f"最终封面图片URL: {result.cover_image_url}")
        print(f"最终描述: {result.description}")
        print(f"最终总集数: {result.total_episodes}")
        print(f"分类: {result.category}")
        print(f"状态: {result.status}")
        print(f"标签: {result.tags}")

        # 测试获取封面URL
        cover_url = service.get_anime_cover_url(result.id)
        print(f"\n获取封面URL: {cover_url}")

        return result

    except Exception as e:
        print(f"\n创建失败: {e}")
        import traceback

        traceback.print_exc()
        return None


if __name__ == "__main__":
    test_without_cover_object_name()

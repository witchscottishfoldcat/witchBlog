#!/usr/bin/env python3
"""
测试修复后的元数据提取功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db  # noqa: E402
from app.schemas.anime_watchlist import AnimeWatchlistCreate  # noqa: E402
from app.services.anime_watchlist import create_anime_watchlist_service  # noqa: E402


def test_fixed_metadata_extraction():
    """测试修复后的元数据提取功能"""
    print("测试修复后的元数据提取功能")
    print("=" * 60)

    # 获取数据库会话
    db = next(get_db())

    # 创建服务实例
    service = create_anime_watchlist_service(db)

    # 测试数据 - 模拟前端发送的默认值
    anime_data = AnimeWatchlistCreate(
        title="string",  # 模拟默认值，应该被覆盖
        url="https://www.bilibili.com/bangumi/media/md27682304",
        cover_image_url="string",  # 模拟默认值，应该被覆盖
        description="string",  # 模拟默认值，应该被覆盖
        category="anime",
        status="want_watch",
        total_episodes=0,  # 模拟默认值，应该被覆盖
        tags="string",  # 这个可能不会被覆盖，因为是用户提供的
        rating=10,
        is_favorite=False,
        is_active=True,
        sort_order=0,
    )

    try:
        print(f"添加追番项目: {anime_data.url}")
        print(f"原标题: {anime_data.title}")
        print(f"原封面URL: {anime_data.cover_image_url}")
        print(f"原描述: {anime_data.description}")
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

        # 验证是否正确覆盖了默认值
        print("\n验证结果:")
        if result.title != "string":
            print("✓ 标题已正确覆盖")
        else:
            print("✗ 标题未被覆盖")

        if result.cover_image_url != "string":
            print("✓ 封面图片URL已正确覆盖")
        else:
            print("✗ 封面图片URL未被覆盖")

        if result.description != "string":
            print("✓ 描述已正确覆盖")
        else:
            print("✗ 描述未被覆盖")

        if result.total_episodes != 0:
            print("✓ 总集数已正确覆盖")
        else:
            print("✗ 总集数未被覆盖")

        return result

    except Exception as e:
        print(f"\n创建失败: {e}")
        import traceback

        traceback.print_exc()
        return None


if __name__ == "__main__":
    test_fixed_metadata_extraction()

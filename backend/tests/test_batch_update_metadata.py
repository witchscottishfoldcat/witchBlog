#!/usr/bin/env python3
"""
测试批量更新元数据功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db  # noqa: E402
from app.services.anime_watchlist import create_anime_watchlist_service  # noqa: E402


def test_batch_update_metadata():
    """测试批量更新元数据功能"""
    print("测试批量更新元数据功能")
    print("=" * 60)

    # 获取数据库会话
    db = next(get_db())

    # 创建服务实例
    service = create_anime_watchlist_service(db)

    try:
        print("开始批量更新元数据...")

        # 调用batch_update_anime_metadata方法，限制为3个项目
        result = service.batch_update_anime_metadata(limit=3)

        print("\n批量更新完成!")
        print(f"总项目数: {result['total']}")
        print(f"成功更新: {result['success']}")
        print(f"更新失败: {result['failed']}")

        if result.get("results"):
            print("\n详细结果:")
            for item_result in result["results"]:
                print(f"\nID: {item_result['id']}, 标题: {item_result['title']}")
                print(f"状态: {item_result['status']}")
                print(f"消息: {item_result['message']}")

        return result

    except Exception as e:
        print(f"\n批量更新失败: {e}")
        import traceback

        traceback.print_exc()
        return None


if __name__ == "__main__":
    test_batch_update_metadata()

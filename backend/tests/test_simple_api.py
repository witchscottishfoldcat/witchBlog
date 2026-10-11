#!/usr/bin/env python3
"""
测试简单URL的追番创建和更新
"""
import time

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"


def create_simple_anime():
    """创建带有简单URL的追番项目"""
    print("创建带有简单URL的追番项目...")

    # 使用简单的图片URL
    anime_data = {
        "title": "测试动漫 - 简单URL",
        "url": "https://picsum.photos/seed/simple-url/800/600.jpg",
        "description": "这是一个测试简单URL的追番项目",
        "category": "anime",
        "status": "want_watch",
        "is_favorite": False,
        "is_active": True,
    }

    try:
        response = requests.post(
            f"{BASE_URL}/",
            json=anime_data,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            anime_data_response = response.json()
            print(
                f"✅ 成功创建追番项目: {anime_data_response['title']} (ID: {anime_data_response['id']})"  # noqa: E501
            )
            print(f"   原始URL: {anime_data_response['url']}")
            print(f"   封面URL: {anime_data_response['cover_image_url']}")
            print(f"   MinIO对象名: {anime_data_response['cover_image_object_name']}")
            return anime_data_response["id"]
        else:
            print(f"❌ 创建追番项目失败: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"❌ 创建过程中发生异常: {e}")
        return None


def test_batch_update_simple():
    """测试简单的批量更新"""
    print("\n测试简单的批量更新...")

    try:
        response = requests.post(
            f"{BASE_URL}/batch-update-covers",
            params={"limit": 3},
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ 批量更新完成！")
            print(f"   总计: {result.get('total', 0)} 个项目")
            print(f"   成功: {result.get('success', 0)} 个项目")
            print(f"   失败: {result.get('failed', 0)} 个项目")

            # 显示详细结果
            results = result.get("results", [])
            for item_result in results:
                status_icon = (
                    "✅"
                    if item_result["status"] == "success"
                    else ("❌" if item_result["status"] == "failed" else "⏭️")
                )
                print(
                    f"   {status_icon} {item_result['title']}: {item_result['message']}"
                )
                if item_result["status"] == "success":
                    print(f"      对象名称: {item_result.get('object_name', 'N/A')}")
                    print(f"      访问URL: {item_result.get('url', 'N/A')}")

            return result
        else:
            print(f"❌ 批量更新失败: {response.status_code}")
            print(f"   错误信息: {response.text}")
            return None

    except Exception as e:
        print(f"❌ 批量更新过程中发生异常: {e}")
        return None


def check_latest_anime():
    """检查最新的追番项目"""
    print("\n检查最新的追番项目...")

    try:
        response = requests.get(f"{BASE_URL}/?limit=5&sort_by=created_at")
        if response.status_code == 200:
            anime_list = response.json()

            print("最新的5个追番项目:")
            for i, anime in enumerate(anime_list, 1):
                print(f"  {i}. {anime['title']} (ID: {anime['id']})")
                print(f"     URL: {anime['url']}")
                print(f"     封面URL: {anime['cover_image_url']}")
                print(f"     MinIO对象名: {anime['cover_image_object_name']}")
                print()
        else:
            print(f"获取列表失败: {response.status_code}")

    except Exception as e:
        print(f"检查过程中发生异常: {e}")


def main():
    print("测试简单URL的追番创建和更新...\n")

    # 1. 创建带有简单URL的追番项目
    anime_id = create_simple_anime()

    # 2. 等待一小段时间
    time.sleep(1)

    # 3. 检查最新的追番项目
    check_latest_anime()

    # 4. 执行批量更新
    batch_result = test_batch_update_simple()

    # 5. 再次检查最新的追番项目
    print("\n更新后的追番项目:")
    check_latest_anime()

    # 6. 总结
    print("\n测试总结:")
    if anime_id:
        print("✅ 成功创建了追番项目")
    else:
        print("❌ 创建追番项目失败")

    if batch_result and batch_result.get("success", 0) > 0:
        print("✅ 批量更新成功")
    else:
        print("❌ 批量更新失败")

    print("\n测试完成！")


if __name__ == "__main__":
    main()

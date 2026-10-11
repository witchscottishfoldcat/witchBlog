#!/usr/bin/env python3
"""
直接测试批量更新API
"""

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"


def test_batch_api():
    """测试批量更新API"""
    print("测试批量更新API...")

    try:
        response = requests.post(
            f"{BASE_URL}/batch-update-covers",
            params={"limit": 3},
            headers={"Content-Type": "application/json"},
        )

        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ 批量更新成功！")
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


def get_anime_list():
    """获取追番列表"""
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"获取列表失败: {response.status_code}")
            return []
    except Exception as e:
        print(f"获取列表过程中发生异常: {e}")
        return []


def main():
    print("测试批量更新API...\n")

    # 1. 显示当前状态
    anime_list = get_anime_list()
    test_anime = [anime for anime in anime_list if anime["title"].startswith("测试动漫")]

    print("当前测试数据:")
    for anime in test_anime[:3]:  # 只显示前3个
        print(f"  - ID: {anime['id']}, 标题: {anime['title']}")
        print(f"    封面URL: {anime.get('cover_image_url', 'N/A')}")
        print(f"    MinIO对象名: {anime.get('cover_image_object_name', 'N/A')}")

    # 2. 执行批量更新
    result = test_batch_api()

    # 3. 显示更新后的状态
    if result and result.get("success", 0) > 0:
        print("\n✅ 批量更新成功！")
        print("您可以检查MinIO存储桶中的anime-covers文件夹，查看上传的封面图片。")
    else:
        print("\n❌ 批量更新失败")


if __name__ == "__main__":
    main()

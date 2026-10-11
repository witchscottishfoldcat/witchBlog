#!/usr/bin/env python3
"""
测试直接创建带有图片URL的追番项目
"""
import time

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"


def create_anime_with_image_url():
    """创建带有图片URL的追番项目"""
    print("创建带有图片URL的追番项目...")

    anime_data = {
        "title": "测试动漫 - 直接图片URL",
        "url": "https://example.com/anime-page",
        "cover_image_url": "https://picsum.photos/seed/direct-upload/800/600.jpg",
        "description": "这是一个测试直接上传图片URL的追番项目",
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
            print(f"   原始封面URL: {anime_data['cover_image_url']}")
            print(f"   更新后封面URL: {anime_data_response['cover_image_url']}")
            print(f"   MinIO对象名: {anime_data_response['cover_image_object_name']}")
            return anime_data_response["id"]
        else:
            print(f"❌ 创建追番项目失败: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"❌ 创建过程中发生异常: {e}")
        return None


def test_single_update():
    anime_id = 1
    """测试单个追番项目的封面更新"""
    if not anime_id:
        print("没有有效的动漫ID，跳过单个更新测试")
        return

    print(f"\n测试单个追番项目的封面更新 (ID: {anime_id})...")

    # 获取当前状态
    try:
        response = requests.get(f"{BASE_URL}/{anime_id}")
        if response.status_code != 200:
            print(f"获取追番项目失败: {response.status_code}")
            return

        anime_data = response.json()
        print("当前状态:")
        print(f"  标题: {anime_data['title']}")
        print(f"  封面URL: {anime_data['cover_image_url']}")
        print(f"  MinIO对象名: {anime_data['cover_image_object_name']}")

        # 如果没有MinIO对象名，尝试更新
        if not anime_data.get("cover_image_object_name") and anime_data.get(
            "cover_image_url"
        ):
            print("\n尝试更新封面图片...")

            # 创建更新数据
            update_data = {"cover_image_url": anime_data["cover_image_url"]}

            # 发送更新请求
            update_response = requests.put(
                f"{BASE_URL}/{anime_id}",
                json=update_data,
                headers={"Content-Type": "application/json"},
            )

            if update_response.status_code == 200:
                updated_anime = update_response.json()
                print("✅ 更新成功:")
                print(f"   更新后封面URL: {updated_anime['cover_image_url']}")
                print(f"   MinIO对象名: {updated_anime['cover_image_object_name']}")

                # 获取封面URL
                cover_response = requests.get(f"{BASE_URL}/{anime_id}/cover-url")
                if cover_response.status_code == 200:
                    cover_data = cover_response.json()
                    print(f"   封面图片URL: {cover_data['cover_url']}")
            else:
                print(f"❌ 更新失败: {update_response.status_code} - {update_response.text}")
        else:
            print("不需要更新，已有MinIO对象名或没有封面URL")

    except Exception as e:
        print(f"❌ 更新过程中发生异常: {e}")


def main():
    print("测试直接创建带有图片URL的追番项目...\n")

    # 1. 创建带有图片URL的追番项目
    anime_id = create_anime_with_image_url()

    # 2. 等待一小段时间
    time.sleep(1)

    # 3. 测试单个更新
    test_single_update()

    # 4. 总结
    print("\n测试完成！")
    if anime_id:
        print(f"✅ 创建了追番项目 (ID: {anime_id})")
    else:
        print("❌ 没有成功创建追番项目")


if __name__ == "__main__":
    main()

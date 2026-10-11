#!/usr/bin/env python3
"""
测试动漫封面自动上传到MinIO功能
"""

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"

# 测试数据 - 使用一个有效的动漫封面图片URL
test_anime_data = {
    "title": "测试动漫封面上传",
    "url": "https://i.imgur.com/test.jpg",  # 示例URL，测试时需要替换为实际图片URL
    "cover_image_url": "https://i.imgur.com/example.jpg",  # 示例封面URL
    "description": "这是一个测试动漫封面自动上传功能的条目",
    "category": "anime",
    "tags": "测试,封面上传",
    "status": "want_watch",
    "is_favorite": False,
    "is_active": True,
}


def test_create_anime_with_cover():
    """测试创建带有封面的追番条目"""
    print("测试创建带有封面的追番条目...")

    try:
        response = requests.post(
            f"{BASE_URL}/",
            json=test_anime_data,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            anime_data = response.json()
            print(f"✅ 成功创建追番条目: ID={anime_data['id']}")
            print(f"   标题: {anime_data['title']}")
            print(f"   原始封面URL: {anime_data['cover_image_url']}")
            print(f"   MinIO对象名称: {anime_data['cover_image_object_name']}")

            # 测试获取封面URL
            cover_response = requests.get(f"{BASE_URL}/{anime_data['id']}/cover-url")
            if cover_response.status_code == 200:
                cover_data = cover_response.json()
                print(f"   封面图片URL: {cover_data['cover_url']}")
            else:
                print(f"❌ 获取封面URL失败: {cover_response.status_code}")

            return anime_data["id"]
        else:
            print(f"❌ 创建追番条目失败: {response.status_code}")
            print(f"   错误信息: {response.text}")
            return None

    except Exception as e:
        print(f"❌ 测试过程中发生异常: {e}")
        return None


def test_get_anime_list():
    """测试获取追番列表"""
    print("\n测试获取追番列表...")

    try:
        response = requests.get(
            f"{BASE_URL}/", headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            anime_list = response.json()
            print(f"✅ 成功获取追番列表，共 {len(anime_list)} 条记录")

            # 检查是否有上传的封面
            for anime in anime_list:
                if anime["cover_image_object_name"]:
                    print(f"   - {anime['title']} 已上传封面到MinIO")
        else:
            print(f"❌ 获取追番列表失败: {response.status_code}")
            print(f"   错误信息: {response.text}")

    except Exception as e:
        print(f"❌ 测试过程中发生异常: {e}")


def main():
    print("开始测试动漫封面自动上传功能...\n")

    # 测试创建带有封面的追番条目
    anime_id = test_create_anime_with_cover()

    # 测试获取追番列表
    test_get_anime_list()

    if anime_id:
        print(f"\n测试完成！创建的追番条目ID: {anime_id}")
        print("您可以检查MinIO存储桶中的anime-covers文件夹，查看上传的封面图片。")
    else:
        print("\n测试失败！请检查错误信息并修复问题。")


if __name__ == "__main__":
    main()

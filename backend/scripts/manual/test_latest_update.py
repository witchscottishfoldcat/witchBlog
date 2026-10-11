#!/usr/bin/env python3
"""
测试更新最新创建的追番项目
"""
import json
import sys
import time

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"


def get_latest_anime_ids(limit=3):
    """获取最新的追番项目ID"""
    try:
        response = requests.get(f"{BASE_URL}/?limit={limit}&sort_by=created_at")
        if response.status_code == 200:
            anime_list = response.json()
            return [anime["id"] for anime in anime_list]
        else:
            print(f"获取最新追番项目失败: {response.status_code}")
            return []
    except Exception as e:
        print(f"获取最新追番项目异常: {e}")
        return []


def update_single_anime(anime_id):
    """更新单个追番项目的封面"""
    print(f"更新追番项目 {anime_id} 的封面...")

    try:
        # 获取当前追番项目
        response = requests.get(f"{BASE_URL}/{anime_id}")
        if response.status_code != 200:
            print(f"获取追番项目失败: {response.status_code}")
            return False

        anime_data = response.json()
        print(f"  标题: {anime_data['title']}")
        print(f"  URL: {anime_data['url']}")
        print(f"  封面URL: {anime_data['cover_image_url']}")
        print(f"  MinIO对象名: {anime_data['cover_image_object_name']}")

        # 如果没有MinIO对象名，尝试更新
        if not anime_data.get("cover_image_object_name"):
            # 使用update方法
            update_data = {
                "cover_image_url": anime_data.get(
                    "cover_image_url", anime_data.get("url", "")
                )
            }

            update_response = requests.put(
                f"{BASE_URL}/{anime_id}",
                json=update_data,
                headers={"Content-Type": "application/json"},
            )

            if update_response.status_code == 200:
                updated_anime = update_response.json()
                print(f"  ✅ 更新成功:")
                print(f"    更新后封面URL: {updated_anime['cover_image_url']}")
                print(f"    MinIO对象名: {updated_anime['cover_image_object_name']}")
                return True
            else:
                print(
                    f"  ❌ 更新失败: {update_response.status_code} - {update_response.text}"
                )
                return False
        else:
            print("  ⏭️ 已有MinIO对象名，跳过更新")
            return True

    except Exception as e:
        print(f"更新追番项目异常: {e}")
        return False


def main():
    print("测试更新最新创建的追番项目...\n")

    # 1. 获取最新的追番项目ID
    latest_ids = get_latest_anime_ids(limit=5)
    print(f"最新的追番项目ID: {latest_ids}")

    if not latest_ids:
        print("没有找到最新的追番项目")
        return

    # 2. 逐个更新这些项目
    success_count = 0
    for anime_id in latest_ids[:3]:  # 只更新前3个
        if update_single_anime(anime_id):
            success_count += 1
        print()

    # 3. 总结
    print("=" * 50)
    print("测试总结:")
    print(f"  尝试更新: {len(latest_ids[:3])} 个项目")
    print(f"  成功更新: {success_count} 个项目")

    if success_count > 0:
        print("✅ 至少有一个项目更新成功！")
    else:
        print("❌ 所有项目更新都失败了")


if __name__ == "__main__":
    main()

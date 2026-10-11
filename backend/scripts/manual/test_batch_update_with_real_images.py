#!/usr/bin/env python3
"""
使用真实图片URL测试批量更新动漫封面图片到MinIO功能
"""
import json
import sys
import time

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"


# 使用有效的图片URL创建测试数据
def create_test_anime_with_real_images():
    """创建使用有效图片URL的测试追番条目"""
    print("创建带有真实图片URL的测试追番条目...")

    test_anime_list = [
        {
            "title": "测试动漫1 - 葬送的芙莉莲",
            "url": "https://bangumi.bilibili.com/anime/429865",
            "cover_image_url": "https://picsum.photos/seed/frieren/800/600.jpg",  # 有效的图片URL
            "description": "勇者击败魔王后的世界，长寿精灵芙莉莲的故事",
            "category": "anime",
            "tags": "奇幻,冒险",
            "status": "want_watch",
            "is_favorite": True,
        },
        {
            "title": "测试动漫2 - 鬼灭之刃",
            "url": "https://bangumi.bilibili.com/anime/39343",
            "cover_image_url": "https://picsum.photos/seed/kimetsu/800/600.jpg",  # 有效的图片URL
            "description": "大正时代，炭治郎为了拯救变成鬼的妹妹",
            "category": "anime",
            "tags": "热血,冒险",
            "status": "watching",
            "is_favorite": True,
        },
        {
            "title": "测试动漫3 - 咒术回战",
            "url": "https://bangumi.bilibili.com/anime/38478",
            "cover_image_url": "https://picsum.photos/seed/jujutsu/800/600.jpg",  # 有效的图片URL
            "description": "虎杖悠仁的咒术师之旅",
            "category": "anime",
            "tags": "热血,超自然",
            "status": "want_watch",
            "is_favorite": False,
        },
    ]

    created_ids = []

    for anime_data in test_anime_list:
        try:
            response = requests.post(
                f"{BASE_URL}/",
                json=anime_data,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 200:
                anime_data_response = response.json()
                created_ids.append(anime_data_response["id"])
                print(
                    f"✅ 成功创建追番条目: {anime_data_response['title']} (ID: {anime_data_response['id']})"
                )
            else:
                print(f"❌ 创建追番条目失败: {response.status_code} - {response.text}")

        except Exception as e:
            print(f"❌ 创建过程中发生异常: {e}")

    return created_ids


def batch_update_anime_covers(limit=5):
    """批量更新动漫封面图片"""
    print(f"\n开始批量更新动漫封面图片（限制数量: {limit}）...")

    try:
        response = requests.post(
            f"{BASE_URL}/batch-update-covers",
            params={"limit": limit},
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ 批量更新完成！")
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


def check_updated_covers():
    """检查更新后的封面图片"""
    print("\n检查更新后的封面图片...")

    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            anime_list = response.json()

            has_minio_covers = 0
            no_minio_covers = 0

            # 只检查最近创建的几个测试项目
            test_anime = [
                anime for anime in anime_list if anime["title"].startswith("测试动漫")
            ]

            for anime in test_anime:
                if anime["cover_image_object_name"]:
                    has_minio_covers += 1
                    print(
                        f"✅ {anime['title']}: 已上传到MinIO (对象名称: {anime['cover_image_object_name']})"
                    )
                else:
                    no_minio_covers += 1
                    print(f"❌ {anime['title']}: 未上传到MinIO")

            print(f"\n统计: 已上传 {has_minio_covers} 个，未上传 {no_minio_covers} 个")
        else:
            print(f"获取列表失败: {response.status_code}")

    except Exception as e:
        print(f"检查过程中发生异常: {e}")


def main():
    print("开始使用真实图片URL测试批量更新动漫封面图片功能...\n")

    # 1. 创建测试数据
    created_ids = create_test_anime_with_real_images()

    if not created_ids:
        print("没有成功创建任何测试数据，无法继续测试")
        sys.exit(1)

    # 2. 等待一小段时间确保数据已保存
    time.sleep(1)

    # 3. 执行批量更新
    batch_result = batch_update_anime_covers(limit=10)

    # 4. 检查更新后的状态
    check_updated_covers()

    # 5. 总结
    print("\n测试完成！")
    if batch_result and batch_result.get("success", 0) > 0:
        print(f"✅ 成功更新了 {batch_result.get('success')} 个动漫封面到MinIO")
        print("您可以检查MinIO存储桶中的anime-covers文件夹，查看上传的封面图片。")
    else:
        print("❌ 没有成功更新任何动漫封面到MinIO")


if __name__ == "__main__":
    main()

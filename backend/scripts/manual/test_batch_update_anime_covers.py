#!/usr/bin/env python3
"""
测试批量更新动漫封面图片到MinIO功能
"""
import json
import sys
import time

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"

# 测试数据 - 创建几个没有MinIO封面图片的追番条目
test_anime_list = [
    {
        "title": "进击的巨人",
        "url": "https://example.com/attack-on-titan",
        "cover_image_url": "https://i.imgur.com/5nLvIj6.jpg",  # 示例封面URL
        "description": "人类与巨人的生存之战",
        "category": "anime",
        "tags": "热血,战斗",
        "status": "want_watch",
        "is_favorite": True,
    },
    {
        "title": "鬼灭之刃",
        "url": "https://example.com/demon-slayer",
        "cover_image_url": "https://i.imgur.com/8XK4b6s.jpg",  # 示例封面URL
        "description": "大正时代，炭治郎为了拯救变成鬼的妹妹",
        "category": "anime",
        "tags": "热血,冒险",
        "status": "watching",
        "is_favorite": True,
    },
    {
        "title": "咒术回战",
        "url": "https://example.com/jujutsu-kaisen",  # 只有URL，没有封面URL
        "description": "虎杖悠仁的咒术师之旅",
        "category": "anime",
        "tags": "热血,超自然",
        "status": "want_watch",
        "is_favorite": False,
    },
]


def create_test_anime_items():
    """创建测试用的追番条目"""
    print("创建测试追番条目...")
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


def get_anime_list():
    """获取追番列表"""
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"获取追番列表失败: {response.status_code}")
            return []
    except Exception as e:
        print(f"获取列表过程中发生异常: {e}")
        return []


def batch_update_anime_covers(limit=10):
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

    anime_list = get_anime_list()
    if not anime_list:
        print("没有获取到追番列表")
        return

    has_minio_covers = 0
    no_minio_covers = 0

    for anime in anime_list:
        if anime["cover_image_object_name"]:
            has_minio_covers += 1
            print(
                f"✅ {anime['title']}: 已上传到MinIO (对象名称: {anime['cover_image_object_name']})"
            )
        else:
            no_minio_covers += 1
            print(f"❌ {anime['title']}: 未上传到MinIO")

    print(f"\n统计: 已上传 {has_minio_covers} 个，未上传 {no_minio_covers} 个")


def get_cover_url(anime_id):
    """获取单个动漫封面的URL"""
    try:
        response = requests.get(f"{BASE_URL}/{anime_id}/cover-url")
        if response.status_code == 200:
            return response.json().get("cover_url")
        else:
            print(f"获取封面URL失败: {response.status_code}")
            return None
    except Exception as e:
        print(f"获取封面URL过程中发生异常: {e}")
        return None


def main():
    print("开始测试批量更新动漫封面图片功能...\n")

    # 1. 创建测试数据
    created_ids = create_test_anime_items()

    if not created_ids:
        print("没有成功创建任何测试数据，无法继续测试")
        sys.exit(1)

    # 2. 等待一小段时间确保数据已保存
    time.sleep(1)

    # 3. 检查当前状态
    print("\n当前追番列表状态:")
    anime_list = get_anime_list()
    for anime in anime_list:
        minio_status = "已上传" if anime["cover_image_object_name"] else "未上传"
        print(f"  - {anime['title']} (ID: {anime['id']}): MinIO状态 - {minio_status}")

    # 4. 执行批量更新
    batch_result = batch_update_anime_covers(limit=10)

    # 5. 检查更新后的状态
    check_updated_covers()

    # 6. 测试获取封面URL接口
    print("\n测试获取封面URL接口:")
    for anime_id in created_ids[:2]:  # 只测试前两个
        cover_url = get_cover_url(anime_id)
        if cover_url:
            print(f"  ✅ ID {anime_id} 的封面URL: {cover_url}")
        else:
            print(f"  ❌ ID {anime_id} 的封面URL获取失败")

    # 7. 总结
    print("\n测试完成！")
    if batch_result and batch_result.get("success", 0) > 0:
        print(f"✅ 成功更新了 {batch_result.get('success')} 个动漫封面到MinIO")
    else:
        print("❌ 没有成功更新任何动漫封面到MinIO")

    print("\n您可以检查MinIO存储桶中的anime-covers文件夹，查看上传的封面图片。")


if __name__ == "__main__":
    main()

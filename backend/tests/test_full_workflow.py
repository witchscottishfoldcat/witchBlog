#!/usr/bin/env python3
"""
测试完整的工作流程：创建追番并自动提取封面图片
"""
import time

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"


def create_anime_with_url(url, title, description=""):
    """创建带有URL的追番项目"""
    print(f"创建追番项目: {title}")
    print(f"URL: {url}")

    anime_data = {
        "title": title,
        "url": url,
        "description": description,
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


def test_batch_update():
    """测试批量更新功能"""
    print("\n测试批量更新功能...")

    try:
        response = requests.post(
            f"{BASE_URL}/batch-update-covers",
            params={"limit": 5},
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


def check_anime_list():
    """检查追番列表"""
    print("\n检查追番列表...")

    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            anime_list = response.json()

            print(f"追番列表共 {len(anime_list)} 个项目:")
            for anime in anime_list[:5]:  # 只显示前5个
                print(f"  - {anime['title']} (ID: {anime['id']})")
                print(f"    URL: {anime['url']}")
                print(f"    封面URL: {anime['cover_image_url']}")
                print(f"    MinIO对象名: {anime['cover_image_object_name']}")
                print()
        else:
            print(f"获取列表失败: {response.status_code}")

    except Exception as e:
        print(f"检查过程中发生异常: {e}")


def main():
    print("开始测试完整的工作流程...\n")

    # 1. 创建带有URL的追番项目
    print("=" * 60)
    print("步骤1: 创建带有URL的追番项目")
    print("=" * 60)

    # 使用本地HTML文件测试
    local_file_url = "file:///path/to/example.html"
    anime_id = create_anime_with_url(
        url=local_file_url,
        title="测试动漫 - 葬送的芙莉莲（本地文件）",
        description="勇者击败魔王后的世界，长寿精灵芙莉莲的故事",
    )

    # 使用简单的图片URL测试
    if anime_id:
        simple_img_url = "https://picsum.photos/seed/simple-anime/800/600.jpg"
        create_anime_with_url(
            url=simple_img_url, title="测试动漫 - 直接图片URL", description="直接使用图片URL的测试"
        )

    # 2. 等待一小段时间
    time.sleep(1)

    # 3. 检查追番列表
    print("\n" + "=" * 60)
    print("步骤2: 检查追番列表")
    print("=" * 60)
    check_anime_list()

    # 4. 执行批量更新
    print("\n" + "=" * 60)
    print("步骤3: 执行批量更新")
    print("=" * 60)
    batch_result = test_batch_update()

    # 5. 再次检查追番列表
    print("\n" + "=" * 60)
    print("步骤4: 更新后的追番列表")
    print("=" * 60)
    check_anime_list()

    # 6. 总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)

    if batch_result and batch_result.get("success", 0) > 0:
        print("✅ 批量更新成功！")
        print(f"   成功更新了 {batch_result.get('success')} 个动漫封面到MinIO")
    else:
        print("❌ 批量更新失败或没有成功更新任何项目")

    print("\n工作流程测试完成！")
    print("您可以检查MinIO存储桶中的anime-covers文件夹，查看上传的封面图片。")


if __name__ == "__main__":
    main()

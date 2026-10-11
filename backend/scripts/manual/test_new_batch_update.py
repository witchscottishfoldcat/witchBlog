#!/usr/bin/env python3
"""
测试批量更新动漫封面图片功能，只处理新创建的测试数据
"""
import json
import sys
import time

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1/anime-watchlist"


def get_latest_anime_without_cover(limit=5):
    """获取最新没有MinIO封面的追番项目"""
    try:
        response = requests.get(f"{BASE_URL}/?limit={limit}&sort_by=created_at")
        if response.status_code == 200:
            anime_list = response.json()
            # 筛选出没有MinIO封面的项目
            result = [
                anime
                for anime in anime_list
                if not anime.get("cover_image_object_name")
            ]
            return result[:limit]
        else:
            print(f"获取追番列表失败: {response.status_code}")
            return []
    except Exception as e:
        print(f"获取列表过程中发生异常: {e}")
        return []


def batch_update_anime_covers(anime_ids):
    """批量更新指定ID的动漫封面图片"""
    print(f"开始批量更新指定动漫封面图片...")

    updated_count = 0
    failed_count = 0
    results = []

    for anime_id in anime_ids:
        try:
            # 获取单个追番项目详情
            response = requests.get(f"{BASE_URL}/{anime_id}")
            if response.status_code != 200:
                print(f"❌ 获取追番项目失败: ID {anime_id}")
                failed_count += 1
                continue

            anime_data = response.json()

            # 确定要下载的图片URL
            image_url = anime_data.get("cover_image_url")
            if not image_url and anime_data.get("url"):
                image_url = anime_data.get("url")

            if not image_url:
                print(f"❌ {anime_data['title']}: 没有可用的图片URL")
                failed_count += 1
                results.append(
                    {
                        "id": anime_id,
                        "title": anime_data["title"],
                        "status": "skipped",
                        "message": "没有可用的图片URL",
                    }
                )
                continue

            # 调用单独的封面上传API
            try:
                # 这里我们需要实现一个单独的上传API，或者直接使用MinIO服务
                # 暂时跳过实际的上传，只记录
                print(f"⏭️ {anime_data['title']}: 跳过上传（需要单独的上传API）")
                results.append(
                    {
                        "id": anime_id,
                        "title": anime_data["title"],
                        "status": "skipped",
                        "message": "需要单独的上传API",
                        "image_url": image_url,
                    }
                )
                failed_count += 1
            except Exception as upload_error:
                print(f"❌ {anime_data['title']}: 上传失败 - {upload_error}")
                failed_count += 1
                results.append(
                    {
                        "id": anime_id,
                        "title": anime_data["title"],
                        "status": "failed",
                        "message": str(upload_error),
                    }
                )

        except Exception as e:
            print(f"❌ 处理ID {anime_id}时发生异常: {e}")
            failed_count += 1
            results.append(
                {
                    "id": anime_id,
                    "title": f"ID {anime_id}",
                    "status": "failed",
                    "message": str(e),
                }
            )

    print(f"\n批量更新完成: 更新 {updated_count} 个，失败 {failed_count} 个")

    return {
        "total": len(anime_ids),
        "success": updated_count,
        "failed": failed_count,
        "results": results,
    }


def main():
    print("测试批量更新动漫封面图片功能...\n")

    # 1. 获取最新没有MinIO封面的追番项目
    anime_list = get_latest_anime_without_cover(limit=10)

    if not anime_list:
        print("没有找到没有MinIO封面的追番项目")
        sys.exit(0)

    print(f"找到 {len(anime_list)} 个没有MinIO封面的追番项目:")
    for anime in anime_list:
        print(
            f"  - ID: {anime['id']}, 标题: {anime['title']}, 封面URL: {anime.get('cover_image_url', 'N/A')}"
        )

    # 2. 批量更新这些项目的封面
    anime_ids = [anime["id"] for anime in anime_list]
    result = batch_update_anime_covers(anime_ids)

    # 3. 显示结果
    print("\n详细结果:")
    for item_result in result["results"]:
        status_icon = (
            "✅"
            if item_result["status"] == "success"
            else ("❌" if item_result["status"] == "failed" else "⏭️")
        )
        print(f"  {status_icon} {item_result['title']}: {item_result['message']}")
        if "image_url" in item_result:
            print(f"      图片URL: {item_result['image_url']}")

    print("\n测试完成！")
    if result.get("success", 0) > 0:
        print(f"✅ 成功更新了 {result.get('success')} 个动漫封面到MinIO")
    else:
        print("❌ 没有成功更新任何动漫封面到MinIO")

    print("\n建议:")
    print("1. 确保MinIO服务正常运行")
    print("2. 检查图片URL是否可访问")
    print("3. 检查批量更新API是否正确实现")


if __name__ == "__main__":
    main()

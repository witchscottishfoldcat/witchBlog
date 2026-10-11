#!/usr/bin/env python3
"""
测试从网页URL提取封面图片并上传到MinIO的功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging  # noqa: E402

from app.services.minio_service import MinIOService  # noqa: E402

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_extract_cover_from_url():
    """测试从网页URL提取封面图片"""
    print("测试从网页URL提取封面图片...\n")

    minio_service = MinIOService()

    # 测试URL列表
    test_urls = [
        {
            "name": "B站番剧 - 葬送的芙莉莲",
            "url": "https://www.bilibili.com/bangumi/play/ss429865",
            "description": "B站番剧页面",
        },
        {
            "name": "B站番剧 - 鬼灭之刃",
            "url": "https://www.bilibili.com/bangumi/play/ss39343",
            "description": "B站番剧页面",
        },
        {
            "name": "简单的HTML页面",
            "url": "https://example.com",
            "description": "简单的HTML页面，可能没有封面图片",
        },
        {
            "name": "百度百科 - 动漫",
            "url": "https://baike.baidu.com/item/%E5%8A%A8%E6%BC%AB/329",
            "description": "百度百科动漫页面",
        },
    ]

    success_count = 0
    failed_count = 0

    for test_case in test_urls:
        print(f"测试: {test_case['name']}")
        print(f"URL: {test_case['url']}")
        print(f"描述: {test_case['description']}")

        try:
            # 尝试提取并上传封面图片
            object_name, public_url = minio_service.extract_and_upload_cover_from_url(  # type: ignore[attr-defined]  # noqa: E501
                test_case["url"]
            )

            print("✅ 成功提取并上传封面图片")
            print(f"   对象名称: {object_name}")
            print(f"   公开URL: {public_url}")

            # 获取封面URL
            cover_url = minio_service.get_anime_cover_url(object_name)
            print(f"   封面URL: {cover_url}")

            success_count += 1

            # 清理测试图片
            if minio_service.delete_anime_cover(object_name):
                print("   ✅ 测试图片删除成功")
            else:
                print("   ⚠️ 测试图片删除失败")

        except Exception as e:
            print(f"❌ 提取失败: {str(e)}")
            failed_count += 1

        print("-" * 60)

    print("\n测试完成！")
    print(f"成功: {success_count} 个，失败: {failed_count} 个")

    return success_count > 0


if __name__ == "__main__":
    print("开始测试从网页URL提取封面图片功能...\n")
    success = test_extract_cover_from_url()

    if success:
        print("\n✅ 至少有一个测试成功！")
    else:
        print("\n❌ 所有测试都失败了！")

    print("\nMinIO配置信息:")
    from app.core.config import settings

    print(f"  端点: {settings.MINIO_ENDPOINT}")
    print(f"  存储桶: {settings.MINIO_BUCKET_NAME}")
    print(f"  安全连接: {settings.MINIO_SECURE}")

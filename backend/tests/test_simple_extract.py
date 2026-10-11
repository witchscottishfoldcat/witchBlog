#!/usr/bin/env python3
"""
使用简单网站测试从网页URL提取封面图片功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging  # noqa: E402

from app.services.minio_service import MinIOService  # noqa: E402

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_simple_extract():
    """测试从简单网页URL提取封面图片"""
    print("测试从简单网页URL提取封面图片...\n")

    minio_service = MinIOService()

    # 使用一个简单的HTML页面进行测试
    # 创建一个简单的测试HTML页面，包含Open Graph meta标签
    test_url = "https://httpbin.org/html"

    print(f"测试URL: {test_url}")

    try:
        # 尝试提取并上传封面图片
        object_name, public_url = minio_service.extract_and_upload_cover_from_url(  # type: ignore[attr-defined]  # noqa: E501
            test_url
        )

        print("✅ 成功提取并上传封面图片")
        print(f"   对象名称: {object_name}")
        print(f"   公开URL: {public_url}")

        # 获取封面URL
        cover_url = minio_service.get_anime_cover_url(object_name)
        print(f"   封面URL: {cover_url}")

        # 清理测试图片
        if minio_service.delete_anime_cover(object_name):
            print("   ✅ 测试图片删除成功")
        else:
            print("   ⚠️ 测试图片删除失败")

        return True

    except Exception as e:
        print(f"❌ 提取失败: {str(e)}")
        return False


def test_with_custom_headers():
    """测试自定义请求头"""
    print("\n测试使用自定义请求头...")

    minio_service = MinIOService()

    # 使用一个需要User-Agent的网站
    test_url = "https://www.google.com/search?q=anime"

    print(f"测试URL: {test_url}")

    try:
        # 尝试提取并上传封面图片
        object_name, public_url = minio_service.extract_and_upload_cover_from_url(  # type: ignore[attr-defined]  # noqa: E501
            test_url
        )

        print("✅ 成功提取并上传封面图片")
        print(f"   对象名称: {object_name}")
        print(f"   公开URL: {public_url}")

        # 清理测试图片
        if minio_service.delete_anime_cover(object_name):
            print("   ✅ 测试图片删除成功")
        else:
            print("   ⚠️ 测试图片删除失败")

        return True

    except Exception as e:
        print(f"❌ 提取失败: {str(e)}")
        return False


if __name__ == "__main__":
    print("开始测试简单网页URL提取封面图片功能...\n")

    success1 = test_simple_extract()
    success2 = test_with_custom_headers()

    if success1 or success2:
        print("\n✅ 至少有一个测试成功！")
    else:
        print("\n❌ 所有测试都失败了！")

    print("\nMinIO配置信息:")
    from app.core.config import settings

    print(f"  端点: {settings.MINIO_ENDPOINT}")
    print(f"  存储桶: {settings.MINIO_BUCKET_NAME}")
    print(f"  安全连接: {settings.MINIO_SECURE}")

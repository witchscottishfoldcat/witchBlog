#!/usr/bin/env python3
"""
测试MinIO连接和上传功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.services.minio_service import MinIOService  # noqa: E402

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_minio_connection():
    """测试MinIO连接"""
    print("测试MinIO连接...")

    try:
        minio_service = MinIOService()
        print("✅ MinIO连接成功")

        # 检查桶是否存在
        if minio_service.client.bucket_exists(minio_service.bucket_name):
            print(f"✅ 存储桶 {minio_service.bucket_name} 存在")
        else:
            print(f"❌ 存储桶 {minio_service.bucket_name} 不存在")
            return False

        # 测试上传内容
        test_content = "这是一个测试内容"
        result = minio_service.upload_content(
            content=test_content, filename="test.txt", folder="test", is_public=True
        )

        print(f"✅ 内容上传成功: {result}")

        # 测试获取内容
        content = minio_service.get_file_content(result["object_name"])
        if content == test_content:
            print("✅ 内容读取成功")
        else:
            print("❌ 内容读取失败")
            return False

        # 删除测试文件
        if minio_service.delete_file(result["object_name"]):
            print("✅ 文件删除成功")
        else:
            print("❌ 文件删除失败")

        return True

    except Exception as e:
        print(f"❌ MinIO连接测试失败: {e}")
        return False


def test_anime_cover_upload():
    """测试动漫封面上传"""
    print("\n测试动漫封面上传...")

    try:
        minio_service = MinIOService()

        # 测试从URL下载并上传图片
        test_image_url = "https://picsum.photos/seed/test123/800/600.jpg"  # 有效的图片URL
        print(f"尝试从URL下载图片: {test_image_url}")

        object_name, public_url = minio_service.upload_anime_cover(test_image_url)

        print("✅ 图片上传成功")
        print(f"   对象名称: {object_name}")
        print(f"   公开URL: {public_url}")

        # 获取封面URL
        cover_url = minio_service.get_anime_cover_url(object_name)
        print(f"   封面URL: {cover_url}")

        # 清理测试图片
        if minio_service.delete_anime_cover(object_name):
            print("✅ 测试图片删除成功")
        else:
            print("❌ 测试图片删除失败")

        return True

    except Exception as e:
        print(f"❌ 动漫封面上传测试失败: {e}")
        return False


def main():
    print("开始测试MinIO功能...\n")

    # 测试MinIO连接
    connection_ok = test_minio_connection()

    if not connection_ok:
        print("\nMinIO连接失败，请检查配置")
        sys.exit(1)

    # 测试动漫封面上传
    upload_ok = test_anime_cover_upload()

    if upload_ok:
        print("\n✅ 所有测试通过！MinIO功能正常工作")
    else:
        print("\n❌ 部分测试失败，请检查错误信息")

    print("\nMinIO配置信息:")
    print(f"  端点: {settings.MINIO_ENDPOINT}")
    print(f"  存储桶: {settings.MINIO_BUCKET_NAME}")
    print(f"  安全连接: {settings.MINIO_SECURE}")


if __name__ == "__main__":
    main()

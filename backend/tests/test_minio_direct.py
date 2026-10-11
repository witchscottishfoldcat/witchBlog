#!/usr/bin/env python3
"""
直接测试MinIO服务上传图片
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging  # noqa: E402

from app.services.minio_service import MinIOService  # noqa: E402

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_direct_upload():
    """直接测试MinIO服务上传图片"""
    print("直接测试MinIO服务上传图片...\n")

    minio_service = MinIOService()

    # 测试图片URL
    test_image_url = "https://picsum.photos/seed/direct-test/800/600.jpg"

    try:
        # 直接上传图片
        object_name, public_url = minio_service.upload_anime_cover(test_image_url)

        print("✅ 成功上传图片到MinIO")
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
        print(f"❌ 上传图片失败: {e}")
        return False


def test_extract_from_simple_page():
    """测试从简单页面提取图片"""
    print("\n测试从简单页面提取图片...")

    minio_service = MinIOService()

    # 使用一个包含Open Graph meta标签的简单HTML
    test_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta property="og:title" content="测试动漫">
        <meta property="og:description" content="这是一个测试动漫页面">
        <meta property="og:image" content="https://picsum.photos/seed/og-test/800/600.jpg">  # noqa: E501
    </head>
    <body>
        <h1>测试动漫</h1>
        <img src="https://picsum.photos/seed/img-test/800/600.jpg" alt="测试图片">
    </body>
    </html>
    """

    # 创建一个临时HTML文件
    import tempfile

    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False) as f:
        f.write(test_html)
        temp_file = f.name

    try:
        # 从临时文件提取图片
        temp_path_fwd = temp_file.replace("\\", "/")
        file_url = f"file:///{temp_path_fwd}"
        print(f"临时文件URL: {file_url}")

        # 尝试提取图片
        object_name, public_url = minio_service.extract_and_upload_cover_from_url(  # type: ignore[attr-defined]  # noqa: E501
            file_url
        )

        print("✅ 成功从页面提取并上传图片")
        print(f"   对象名称: {object_name}")
        print(f"   公开URL: {public_url}")

        # 清理测试图片
        if minio_service.delete_anime_cover(object_name):
            print("   ✅ 测试图片删除成功")
        else:
            print("   ⚠️ 测试图片删除失败")

        return True

    except Exception as e:
        print(f"❌ 从页面提取图片失败: {e}")
        return False
    finally:
        # 删除临时文件
        try:
            os.unlink(temp_file)
        except Exception:
            pass


def main():
    print("开始测试MinIO服务...\n")

    # 测试直接上传
    success1 = test_direct_upload()

    # 测试从页面提取
    success2 = test_extract_from_simple_page()

    if success1 or success2:
        print("\n✅ 至少有一个测试成功！")
    else:
        print("\n❌ 所有测试都失败了！")

    print("\nMinIO配置信息:")
    from app.core.config import settings

    print(f"  端点: {settings.MINIO_ENDPOINT}")
    print(f"  存储桶: {settings.MINIO_BUCKET_NAME}")
    print(f"  安全连接: {settings.MINIO_SECURE}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
测试MinIO服务从URL提取图片的功能
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.minio_service import MinIOService  # noqa: E402


def test_minio_extract():
    """测试MinIO服务从URL提取图片的功能"""
    print("测试MinIO服务的图片提取功能")
    print("=" * 60)

    # 创建MinIO服务实例
    minio_service = MinIOService()

    # 测试URL
    test_url = "https://www.bilibili.com/bangumi/media/md25581526"

    try:
        print(f"测试URL: {test_url}")
        print("\n开始提取并上传封面图片...")

        # 调用extract_and_upload_cover_from_url方法
        object_name, public_url = minio_service.extract_and_upload_cover_from_url(  # type: ignore[attr-defined]  # noqa: E501
            test_url
        )

        print("\n提取成功!")
        print(f"对象名称: {object_name}")
        print(f"公开URL: {public_url}")

        return object_name, public_url

    except Exception as e:
        print(f"\n提取失败: {e}")
        import traceback

        traceback.print_exc()
        return None, None


if __name__ == "__main__":
    test_minio_extract()

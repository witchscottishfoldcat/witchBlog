#!/usr/bin/env python3
"""
测试MinIO服务
"""

from app.services.minio_service import MinIOService


def test_minio_service():
    """测试MinIO服务"""
    try:
        # 创建MinIO服务实例
        minio_service = MinIOService()
        print("✅ MinIO服务实例创建成功")

        # 测试桶是否存在
        bucket_exists = minio_service.client.bucket_exists(minio_service.bucket_name)
        print(f"✅ 桶 '{minio_service.bucket_name}' 存在: {bucket_exists}")

        # 测试图片类型检查
        print(f"test.jpg -> {minio_service.is_image_file('test.jpg')}")
        print(f"test.png -> {minio_service.is_image_file('test.png')}")
        print(f"test.gif -> {minio_service.is_image_file('test.gif')}")
        print(f"test.txt -> {minio_service.is_image_file('test.txt')}")
        print(f"空文件名 -> {minio_service.is_image_file('')}")

        assert minio_service.is_image_file("test.jpg") is True
        assert minio_service.is_image_file("test.png") is True
        assert minio_service.is_image_file("test.gif") is True
        assert minio_service.is_image_file("test.txt") is False
        assert minio_service.is_image_file("") is False
        print("✅ 图片类型检查正常")

        # 测试获取文件扩展名
        assert minio_service._get_file_extension("test.jpg") == ".jpg"
        assert minio_service._get_file_extension("test.png") == ".png"
        assert minio_service._get_file_extension("test") == ""
        assert minio_service._get_file_extension("") == ""
        print("✅ 文件扩展名获取正常")

        print("\n=== MinIO服务测试通过 ===")

    except Exception as e:
        import traceback

        print(f"❌ 测试失败: {str(e)}")
        print(f"错误详情:\n{traceback.format_exc()}")
        return False

    return True


if __name__ == "__main__":
    test_minio_service()

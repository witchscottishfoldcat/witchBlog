#!/usr/bin/env python3
"""
检查 MinIO 中是否存在缩略图文件
"""

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


def check_thumbnails():
    """检查缩略图文件是否存在"""
    try:
        # 创建MinIO客户端
        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        bucket_name = settings.MINIO_BUCKET_NAME

        # 列出thumbnails目录下的所有对象
        objects = client.list_objects(
            bucket_name, prefix="diary-images/public/2025/12/11/thumbnails/"
        )

        print("检查缩略图文件...")
        found_thumbnails = False
        for obj in objects:
            print(f"找到缩略图: {obj.object_name}")
            found_thumbnails = True

        if not found_thumbnails:
            print("没有找到任何缩略图文件")

            # 检查是否有图片文件
            print("\n检查原始图片文件...")
            image_objects = client.list_objects(
                bucket_name, prefix="diary-images/public/2025/12/11/"
            )
            for obj in image_objects:
                if not obj.object_name.endswith("/thumbnails/"):
                    print(f"找到图片: {obj.object_name}")

        return found_thumbnails

    except S3Error as e:
        print(f"MinIO错误: {e}")
        return False
    except Exception as e:
        print(f"发生错误: {e}")
        return False


if __name__ == "__main__":
    check_thumbnails()

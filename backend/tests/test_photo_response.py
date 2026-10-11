"""
测试照片响应转换
"""

from app.core.database import SessionLocal
from app.models.album import Photo


def test_photo_response():
    """测试照片响应转换"""
    print("开始测试照片响应转换...")

    # 创建数据库会话
    db = SessionLocal()
    try:
        # 获取照片
        photo = db.query(Photo).filter(Photo.id == 1).first()
        if not photo:
            print("❌ 照片不存在")
            return

        print(f"✅ 找到照片: {photo.title} (ID: {photo.id})")
        print(f"   MinIO对象名: {photo.minio_object_name}")
        print(f"   文件大小: {photo.file_size} bytes")
        print(f"   MIME类型: {photo.mime_type}")

        # 测试获取URL
        try:
            from app.services.minio_service import minio_service

            image_url = minio_service.get_file_url(photo.minio_object_name)
            print(f"   图片URL: {image_url}")
            print("✅ URL获取成功")
        except Exception as e:
            print(f"❌ URL获取失败: {e}")
            import traceback

            traceback.print_exc()

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_photo_response()

"""
内部测试照片上传
"""
import uuid
from io import BytesIO

from PIL import Image

from app.core.database import SessionLocal
from app.models.album import Album, Photo
from app.schemas.album import PhotoCreate, PhotoUploadInfo
from app.services.minio_service import minio_service


def test_upload_internal():
    """内部测试照片上传"""
    print("开始内部测试照片上传...")

    # 创建数据库会话
    db = SessionLocal()
    try:
        # 获取第一个相册
        album = db.query(Album).filter(Album.id == 3).first()
        if not album:
            print("❌ 相册不存在")
            return

        print(f"✅ 使用相册: {album.title} (ID: {album.id})")

        # 创建一个测试图片
        img = Image.new("RGB", (100, 100), color="red")
        img_bytes = BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        img_content = img_bytes.getvalue()

        # 生成MinIO对象名
        file_ext = "jpg"
        minio_object_name = f"albums/{album.id}/photos/{uuid.uuid4().hex}.{file_ext}"

        # 上传文件到MinIO
        print("上传到MinIO...")
        result = minio_service.client.put_object(
            bucket_name=minio_service.bucket_name,
            object_name=minio_object_name,
            data=BytesIO(img_content),
            length=len(img_content),
            part_size=10 * 1024 * 1024,  # 10MB
            content_type="image/jpeg",
        )

        print(f"上传结果: {result}")

        # 创建照片记录
        photo_create = PhotoCreate(
            title="测试照片",
            description="这是一张测试照片",
            tags=["测试", "照片"],
            is_cover=True,
            sort_order=1,
        )

        upload_info = PhotoUploadInfo(
            original_filename="test_image.jpg",
            file_size=len(img_content),
            mime_type="image/jpeg",
            width=100,
            height=100,
        )

        db_photo = Photo(
            album_id=album.id,
            minio_bucket=minio_service.bucket_name,
            minio_object_name=minio_object_name,
            original_filename=upload_info.original_filename,
            file_size=upload_info.file_size,
            mime_type=upload_info.mime_type,
            width=upload_info.width,
            height=upload_info.height,
            title=photo_create.title,
            description=photo_create.description,
            tags=photo_create.tags,
            is_cover=photo_create.is_cover,
            sort_order=photo_create.sort_order,
        )

        db.add(db_photo)
        db.commit()
        db.refresh(db_photo)

        print(f"✅ 照片记录创建成功，ID: {db_photo.id}")

        # 如果设置为封面，则更新相册的封面照片ID
        if photo_create.is_cover:
            album.cover_photo_id = db_photo.id
            db.commit()
            print(f"✅ 相册封面照片更新为: {db_photo.id}")

        # 获取照片URL
        url = minio_service.get_file_url(minio_object_name)
        print(f"照片URL: {url}")

        print("✅ 内部测试成功！")

    except Exception as e:
        print(f"❌ 内部测试失败: {e}")
        import traceback

        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_upload_internal()

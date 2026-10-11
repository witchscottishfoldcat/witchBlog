#!/usr/bin/env python3
"""测试完整的图片上传流程"""
import io
import json

from minio import Minio
from PIL import Image

from app.core.config import settings
from app.core.database import get_db
from app.schemas.diary import DiaryImageCreate
from app.services.diary_service import diary_service

# 获取数据库会话
db = next(get_db())

try:
    # 1. 生成上传URL
    diary_id = 19
    upload_urls = diary_service.generate_upload_urls(diary_id, None, 1)
    upload_url = upload_urls[0].upload_url
    object_name = upload_urls[0].object_name

    print(f"1. 生成上传URL成功")
    print(f"   对象名称: {object_name}")

    # 2. 上传图片到MinIO
    img = Image.new("RGB", (100, 100), color="blue")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="JPEG")
    img_bytes.seek(0)

    client = Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )

    client.put_object(
        bucket_name=settings.MINIO_BUCKET_NAME,
        object_name=object_name,
        data=img_bytes,
        length=img_bytes.getbuffer().nbytes,
        content_type="image/jpeg",
    )
    print(f"2. 图片上传到MinIO成功")

    # 3. 保存图片信息到数据库
    image_create = DiaryImageCreate(
        original_filename="test.jpg",
        file_size=1024,
        mime_type="image/jpeg",
        width=100,
        height=100,
    )

    db_image = diary_service.save_diary_image(db, diary_id, image_create, object_name)
    print(f"3. 图片信息保存到数据库成功，图片ID: {db_image.id}")

    # 4. 获取图片URL并测试访问
    image_url = diary_service.get_image_url(object_name)
    print(f"4. 图片URL: {image_url}")

    # 5. 验证图片是否可以公开访问
    import requests

    response = requests.get(image_url)
    if response.status_code == 200:
        print(f"5. 图片访问成功! 状态码: {response.status_code}")
    else:
        print(f"5. 图片访问失败! 状态码: {response.status_code}")
        print(f"   错误信息: {response.text[:200]}...")

finally:
    db.close()

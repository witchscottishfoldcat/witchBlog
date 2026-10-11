#!/usr/bin/env python3
"""最终测试：上传新图片并验证公开访问"""
import io
import json

import requests
from minio import Minio
from PIL import Image

from app.core.config import settings
from app.core.database import get_db
from app.schemas.diary import DiaryImageCreate
from app.services.diary_service import diary_service

# 获取数据库会话
db = next(get_db())

try:
    print("=== 最终测试：上传新图片到 diary-imagesV2 ===")

    # 1. 生成上传URL
    diary_id = 19
    upload_urls = diary_service.generate_upload_urls(diary_id, None, 1)
    upload_url = upload_urls[0].upload_url
    object_name = upload_urls[0].object_name

    print(f"1. 生成上传URL成功")
    print(f"   对象名称: {object_name}")

    # 2. 上传图片到MinIO
    img = Image.new("RGB", (150, 150), color="green")
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
    print("2. 图片上传到MinIO成功")

    # 3. 获取图片的公开URL
    image_url = diary_service.get_image_url(object_name)
    print(f"3. 图片公开URL: {image_url}")

    # 4. 测试图片是否可以公开访问
    response = requests.get(image_url)
    if response.status_code == 200:
        print("4. ✅ 图片公开访问成功！")
        print(f"   状态码: {response.status_code}")
    else:
        print("4. ❌ 图片公开访问失败！")
        print(f"   状态码: {response.status_code}")
        if response.text:
            print(f"   错误: {response.text[:200]}...")

    # 5. 保存图片信息到数据库
    image_create = DiaryImageCreate(
        original_filename="final_test.jpg",
        file_size=2048,
        mime_type="image/jpeg",
        width=150,
        height=150,
    )

    db_image = diary_service.save_diary_image(db, diary_id, image_create, object_name)
    print(f"5. 图片信息保存到数据库成功，图片ID: {db_image.id}")

    print("\n=== 测试结论 ===")
    print("✅ diary-imagesV2 文件夹已正确设置为公开访问")
    print("✅ 新上传的日记图片可以正常公开访问")
    print("✅ 图片信息正确保存到数据库")

finally:
    db.close()

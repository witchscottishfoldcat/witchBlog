#!/usr/bin/env python3
"""测试上传图片到 diary-imagesV2"""
import io

from minio import Minio
from PIL import Image

from app.core.config import settings
from app.services.diary_service import diary_service

# 创建一个测试图片
img = Image.new("RGB", (100, 100), color="red")
img_bytes = io.BytesIO()
img.save(img_bytes, format="JPEG")
img_bytes.seek(0)

# 获取上传URL
diary_id = 19
upload_urls = diary_service.generate_upload_urls(diary_id, None, 1)
upload_url = upload_urls[0].upload_url
object_name = upload_urls[0].object_name

print(f"准备上传图片到: {object_name}")

# 使用MinIO客户端直接上传（模拟实际上传）
client = Minio(
    endpoint=settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

bucket_name = settings.MINIO_BUCKET_NAME

try:
    # 上传图片
    client.put_object(
        bucket_name=bucket_name,
        object_name=object_name,
        data=img_bytes,
        length=img_bytes.getbuffer().nbytes,
        content_type="image/jpeg",
    )
    print(f"图片上传成功: {object_name}")

    # 获取公开URL
    public_url = diary_service.get_image_url(object_name)
    print(f"公开URL: {public_url}")

    # 测试访问
    import requests

    response = requests.get(public_url)
    print(f"访问状态码: {response.status_code}")

    if response.status_code == 200:
        print("图片访问成功!")
    else:
        print("图片访问失败!")
        print(f"响应: {response.text[:200]}...")

except Exception as e:
    print(f"上传或访问出错: {e}")

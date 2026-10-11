#!/usr/bin/env python3
"""验证并打印最终的MinIO策略"""
import json

import requests
from minio import Minio

from app.core.config import settings

# 创建 MinIO 客户端
client = Minio(
    endpoint=settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

bucket_name = settings.MINIO_BUCKET_NAME

# 获取并打印当前策略
try:
    policy_json = client.get_bucket_policy(bucket_name)
    policy = json.loads(policy_json)

    print("=== 当前MinIO策略 ===")
    for i, stmt in enumerate(policy.get("Statement", []), 1):
        print(f"\n语句 {i}:")
        print(f"  效果: {stmt.get('Effect')}")
        print(f"  主体: {stmt.get('Principal')}")
        print(f"  操作: {stmt.get('Action')}")
        print(f"  资源:")
        for res in stmt.get("Resource", []):
            print(f"    - {res}")
            # 检查是否包含 diary-imagesV2
            if "diary-imagesV2" in res:
                print("      ^ 这是 diary-imagesV2 相关策略")

    # 测试几个不同的图片URL
    print("\n=== 测试图片访问 ===")

    # 获取最新的日记图片
    from app.core.database import get_db
    from app.models.diary import DiaryImage

    db = next(get_db())
    try:
        latest_image = db.query(DiaryImage).order_by(DiaryImage.id.desc()).first()
        if latest_image and "diary-imagesV2" in latest_image.minio_object_name:
            image_url = f"http://{settings.MINIO_ENDPOINT}/{bucket_name}/{latest_image.minio_object_name}"
            print(f"\n测试图片URL: {image_url}")

            response = requests.get(image_url)
            print(f"访问结果: 状态码 {response.status_code}")

            if response.status_code == 200:
                print("✅ 图片访问成功！diary-imagesV2 文件夹已正确设置为公开访问")
            else:
                print("❌ 图片访问失败！")
                if response.text:
                    print(f"错误信息: {response.text[:200]}...")
        else:
            print("没有找到 diary-imagesV2 的测试图片")
    finally:
        db.close()

except Exception as e:
    print(f"获取策略失败: {e}")

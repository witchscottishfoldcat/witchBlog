#!/usr/bin/env python3
"""检查并修复MinIO策略"""
import json

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

# 获取当前策略
try:
    policy_json = client.get_bucket_policy(bucket_name)
    policy = json.loads(policy_json)

    print("当前策略:")
    for i, stmt in enumerate(policy.get("Statement", [])):
        print(f"  语句 {i+1}:")
        print(f'    Effect: {stmt.get("Effect")}')
        print(f'    Principal: {stmt.get("Principal")}')
        print(f'    Action: {stmt.get("Action")}')
        print(f"    Resources:")
        for res in stmt.get("Resource", []):
            print(f"      - {res}")
        print()

    # 检查是否有 diary-imagesV2 的策略
    has_diary_images_v2 = False
    for stmt in policy.get("Statement", []):
        if stmt.get("Effect") == "Allow" and stmt.get("Principal") == "*":
            for res in stmt.get("Resource", []):
                if "diary-imagesV2" in res:
                    has_diary_images_v2 = True
                    print(f"找到 diary-imagesV2 策略: {res}")

    if not has_diary_images_v2:
        print("没有找到 diary-imagesV2 的公开访问策略!")

        # 添加新的策略
        diary_v2_policy = {
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [
                f"arn:aws:s3:::{bucket_name}/diary-imagesV2/*",
                f"arn:aws:s3:::{bucket_name}/diary-imagesV2/*/*",
            ],
        }

        policy.get("Statement", []).append(diary_v2_policy)
        client.set_bucket_policy(bucket_name, json.dumps(policy))
        print("已添加 diary-imagesV2 公开访问策略")

except Exception as e:
    print(f"获取策略失败: {e}")

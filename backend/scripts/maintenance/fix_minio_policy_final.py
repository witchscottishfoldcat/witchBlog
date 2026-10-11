#!/usr/bin/env python3
"""最终修复MinIO策略，确保diary-imagesV2有公开访问权限"""
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

try:
    # 获取当前策略
    try:
        policy_json = client.get_bucket_policy(bucket_name)
        policy = json.loads(policy_json)
        print("获取当前策略成功")
    except Exception as e:
        print(f"获取策略失败: {e}")
        # 如果没有策略，创建一个新的
        policy = {"Version": "2012-10-17", "Statement": []}

    # 检查并添加 diary-imagesV2 策略
    has_diary_images_v2 = False
    for stmt in policy.get("Statement", []):
        if stmt.get("Effect") == "Allow" and stmt.get("Principal") == "*":
            for res in stmt.get("Resource", []):
                if "diary-imagesV2" in res:
                    has_diary_images_v2 = True
                    print(f"已存在 diary-imagesV2 策略: {res}")

    # 如果没有 diary-imagesV2 策略，添加它
    if not has_diary_images_v2:
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
        print("添加了 diary-imagesV2 策略")

    # 应用策略
    client.set_bucket_policy(bucket_name, json.dumps(policy))
    print("策略应用成功")

    # 验证策略
    updated_policy_json = client.get_bucket_policy(bucket_name)
    updated_policy = json.loads(updated_policy_json)

    print("\n更新后的策略:")
    for i, stmt in enumerate(updated_policy.get("Statement", []), 1):
        print(f"\n语句 {i}:")
        print(f"  效果: {stmt.get('Effect')}")
        print(f"  主体: {stmt.get('Principal')}")
        print(f"  操作: {stmt.get('Action')}")
        print(f"  资源:")
        for res in stmt.get("Resource", []):
            print(f"    - {res}")
            if "diary-imagesV2" in res:
                print("      ^ 这是 diary-imagesV2 相关策略")

    # 检查确保策略中有 diary-imagesV2
    found = False
    for stmt in updated_policy.get("Statement", []):
        if stmt.get("Effect") == "Allow" and stmt.get("Principal") == "*":
            for res in stmt.get("Resource", []):
                if "diary-imagesV2" in res:
                    found = True

    if found:
        print("\n✅ diary-imagesV2 公开访问策略已正确设置!")
    else:
        print("\n❌ diary-imagesV2 公开访问策略设置失败!")

except Exception as e:
    print(f"设置策略时发生错误: {e}")
    import traceback

    traceback.print_exc()

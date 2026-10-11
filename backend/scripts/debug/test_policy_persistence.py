#!/usr/bin/env python3
"""测试MinIO策略是否持久，不会被覆盖"""
import json

import requests
from minio import Minio

from app.core.config import settings
from app.services.diary_service import diary_service
from app.services.minio_service import MinIOService


def get_current_policy():
    """获取当前策略"""
    client = Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )

    try:
        policy_json = client.get_bucket_policy(settings.MINIO_BUCKET_NAME)
        return json.loads(policy_json)
    except:
        return None


def check_diary_images_v2_policy(policy):
    """检查是否有 diary-imagesV2 的策略"""
    if not policy:
        return False

    for statement in policy.get("Statement", []):
        # 处理Principal可能是"*"或{"AWS": ["*"]}的情况
        principal = statement.get("Principal")
        is_public_principal = principal == "*" or (
            isinstance(principal, dict) and principal.get("AWS") == ["*"]
        )

        if (
            statement.get("Effect") == "Allow"
            and is_public_principal
            and "s3:GetObject" in statement.get("Action", [])
        ):
            for resource in statement.get("Resource", []):
                if "diary-imagesV2" in resource:
                    return True
    return False


def test_image_access():
    """测试图片访问（先上传一张图片）"""
    import io

    from minio import Minio
    from PIL import Image

    diary_id = 19
    upload_urls = diary_service.generate_upload_urls(diary_id, None, 1)
    if upload_urls:
        object_name = upload_urls[0].object_name

        # 创建并上传一张测试图片
        img = Image.new("RGB", (100, 100), color="purple")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)

        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        try:
            # 上传图片
            client.put_object(
                bucket_name=settings.MINIO_BUCKET_NAME,
                object_name=object_name,
                data=img_bytes,
                length=img_bytes.getbuffer().nbytes,
                content_type="image/jpeg",
            )

            # 获取图片URL并测试访问
            image_url = diary_service.get_image_url(object_name)
            response = requests.get(image_url)
            return response.status_code == 200
        except Exception as e:
            print(f"图片访问测试出错: {e}")
            return False
    return False


# 1. 获取初始策略
print("=== 1. 检查初始策略 ===")
initial_policy = get_current_policy()
has_initial_v2_policy = check_diary_images_v2_policy(initial_policy)
print(f"初始策略是否包含 diary-imagesV2: {has_initial_v2_policy}")

# 2. 如果没有 diary-imagesV2 策略，添加它
if not has_initial_v2_policy:
    print("\n=== 2. 添加 diary-imagesV2 策略 ===")

    # 直接添加策略
    client = Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )

    bucket_name = settings.MINIO_BUCKET_NAME
    diary_v2_policy = {
        "Effect": "Allow",
        "Principal": "*",
        "Action": ["s3:GetObject"],
        "Resource": [
            f"arn:aws:s3:::{bucket_name}/diary-imagesV2/*",
            f"arn:aws:s3:::{bucket_name}/diary-imagesV2/*/*",
        ],
    }

    policy = (
        initial_policy if initial_policy else {"Version": "2012-10-17", "Statement": []}
    )
    policy.get("Statement", []).append(diary_v2_policy)

    client.set_bucket_policy(bucket_name, json.dumps(policy))
    print("已添加 diary-imagesV2 策略")

# 3. 再次检查策略
print("\n=== 3. 再次检查策略 ===")
policy_after_add = get_current_policy()
has_v2_policy_after_add = check_diary_images_v2_policy(policy_after_add)
print(f"添加后策略是否包含 diary-imagesV2: {has_v2_policy_after_add}")

# 4. 初始化 MinIOService（这可能会覆盖策略）
print("\n=== 4. 初始化 MinIOService ===")
print("初始化 MinIOService（这可能会覆盖策略）...")
minio_service = MinIOService()

# 5. 检查策略是否仍然包含 diary-imagesV2
print("\n=== 5. 检查策略是否被覆盖 ===")
policy_after_init = get_current_policy()
has_v2_policy_after_init = check_diary_images_v2_policy(policy_after_init)
print(f"MinIOService 初始化后策略是否包含 diary-imagesV2: {has_v2_policy_after_init}")

# 6. 测试图片访问
print("\n=== 6. 测试图片访问 ===")
can_access_image = test_image_access()
print(f"图片是否可以访问: {can_access_image}")

# 7. 结论
print("\n=== 结论 ===")
if has_v2_policy_after_init and can_access_image:
    print("✅ MinIOService 修复成功！diary-imagesV2 策略持久化，图片可以正常访问")
else:
    print("❌ MinIOService 修复失败！diary-imagesV2 策略被覆盖或图片无法访问")

    # 打印当前策略
    print("\n当前策略:")
    if policy_after_init:
        for i, stmt in enumerate(policy_after_init.get("Statement", []), 1):
            print(f"\n语句 {i}:")
            print(f"  效果: {stmt.get('Effect')}")
            print(f"  主体: {stmt.get('Principal')}")
            print(f"  操作: {stmt.get('Action')}")
            print(f"  资源:")
            for res in stmt.get("Resource", []):
                print(f"    - {res}")
                if "diary-imagesV2" in res:
                    print("      ^ 这是 diary-imagesV2 相关策略")

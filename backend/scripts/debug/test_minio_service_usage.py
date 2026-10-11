#!/usr/bin/env python3
"""测试在实际使用中 MinIOService 是否会覆盖 diary-imagesV2 权限"""
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


print("=== 测试 MinIOService 实际使用场景 ===")

# 1. 获取初始策略
print("\n1. 检查初始策略")
initial_policy = get_current_policy()
has_initial_v2_policy = check_diary_images_v2_policy(initial_policy)
print(f"初始策略是否包含 diary-imagesV2: {has_initial_v2_policy}")

# 2. 使用 MinIOService 上传一个文件（这会触发策略设置）
print("\n2. 使用 MinIOService 上传文件")
minio_service = MinIOService()

# 创建一个测试文件
test_content = "# Test File\nThis is a test file."
try:
    result = minio_service.upload_content(
        content=test_content, filename="test.md", folder="md_files", is_public=True
    )
    print(f"文件上传成功: {result['object_name']}")
except Exception as e:
    print(f"文件上传失败: {e}")

# 3. 再次检查策略
print("\n3. 检查策略是否被覆盖")
policy_after_upload = get_current_policy()
has_v2_policy_after_upload = check_diary_images_v2_policy(policy_after_upload)
print(f"上传后策略是否包含 diary-imagesV2: {has_v2_policy_after_upload}")

# 4. 测试日记图片访问
print("\n4. 测试日记图片访问")
import io

from PIL import Image

diary_id = 19
upload_urls = diary_service.generate_upload_urls(diary_id, None, 1)
if upload_urls:
    object_name = upload_urls[0].object_name

    # 创建并上传一张测试图片
    img = Image.new("RGB", (100, 100), color="orange")
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
        can_access = response.status_code == 200
        print(f"图片访问结果: {'成功' if can_access else '失败'} (状态码: {response.status_code})")
    except Exception as e:
        print(f"图片访问测试出错: {e}")
        can_access = False

# 5. 结论
print("\n=== 结论 ===")
if has_v2_policy_after_upload and can_access:
    print("✅ MinIOService 使用场景测试通过！diary-imagesV2 策略没有被覆盖")
else:
    print("❌ MinIOService 使用场景测试失败！diary-imagesV2 策略被覆盖或图片无法访问")

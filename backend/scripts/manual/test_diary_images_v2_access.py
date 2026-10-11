#!/usr/bin/env python3
"""
测试diary-imagesV2图片是否可以公开访问
"""
import httpx
from minio import Minio

from app.core.config import settings

# 创建MinIO客户端
client = Minio(
    endpoint=settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

bucket_name = settings.MINIO_BUCKET_NAME

# 检查特定图片是否存在
image_path = "diary-imagesV2/public/2025/12/26/1765520874_5ede5069.jpg"
print(f"检查图片: {image_path}")

try:
    # 检查对象是否存在
    if client.stat_object(bucket_name, image_path):
        print("✅ 图片存在于MinIO中")

        # 尝试通过公开URL访问
        public_url = f"http://{settings.MINIO_ENDPOINT}/{bucket_name}/{image_path}"
        print(f"尝试通过公开URL访问: {public_url}")

        try:
            response = httpx.get(public_url, timeout=5.0)
            if response.status_code == 200:
                print("✅ 图片可以通过公开URL成功访问")
                print(f"内容类型: {response.headers.get('content-type')}")
                print(f"图片大小: {len(response.content)} 字节")
            else:
                print(f"❌ 无法通过公开URL访问图片，状态码: {response.status_code}")
                print(f"响应内容: {response.text[:200]}...")
        except Exception as e:
            print(f"❌ 访问公开URL时出错: {e}")

            # 尝试使用预签名URL
            print("\n尝试使用预签名URL...")
            presigned_url = client.presigned_get_object(bucket_name, image_path)
            print(f"预签名URL: {presigned_url[:100]}...")

            try:
                response = httpx.get(presigned_url, timeout=5.0)
                if response.status_code == 200:
                    print("✅ 图片可以通过预签名URL成功访问")
                else:
                    print(f"❌ 无法通过预签名URL访问图片，状态码: {response.status_code}")
            except Exception as e:
                print(f"❌ 访问预签名URL时出错: {e}")

    else:
        print("❌ 图片不存在于MinIO中")

except Exception as e:
    print(f"❌ 检查图片时出错: {e}")

# 检查当前策略
print("\n=== 当前MinIO策略 ===")
try:
    policy_json = client.get_bucket_policy(bucket_name)
    policy = eval(policy_json)  # 简单方式解析JSON

    # 检查是否有diary-imagesV2的策略
    has_diary_images_v2 = False
    for stmt in policy.get("Statement", []):
        if stmt.get("Effect") == "Allow" and stmt.get("Principal") == "*":
            for res in stmt.get("Resource", []):
                if "diary-imagesV2" in res:
                    has_diary_images_v2 = True
                    print(f"✅ 找到diary-imagesV2策略: {res}")

    if not has_diary_images_v2:
        print("❌ 没有找到diary-imagesV2的公开访问策略!")

except Exception as e:
    print(f"获取策略失败: {e}")

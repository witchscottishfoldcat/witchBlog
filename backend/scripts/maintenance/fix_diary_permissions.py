#!/usr/bin/env python3
"""
修复MinIO日记图片权限问题
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fix_diary_permissions():
    """修复MinIO日记图片权限问题"""
    print("MinIO配置信息:")
    print(f"端点: {settings.MINIO_ENDPOINT}")
    print(f"访问密钥: {settings.MINIO_ACCESS_KEY}")
    print(f"安全连接: {settings.MINIO_SECURE}")
    print(f"桶名: {settings.MINIO_BUCKET_NAME}")

    # 创建MinIO客户端
    client = Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )

    bucket_name = settings.MINIO_BUCKET_NAME

    try:
        # 检查桶是否存在
        if client.bucket_exists(bucket_name):
            print(f"\n桶 {bucket_name} 存在")

            # 获取当前桶策略
            try:
                policy = client.get_bucket_policy(bucket_name)
                print("\n当前桶策略:")
                print(json.dumps(json.loads(policy), indent=2))

                policy_dict = json.loads(policy)
            except Exception as e:
                print(f"\n获取桶策略失败: {e}")
                policy_dict = {"Version": "2012-10-17", "Statement": []}

            # 确保包含日记图片的策略
            diary_policy_exists = False
            for statement in policy_dict.get("Statement", []):
                for resource in statement.get("Resource", []):
                    if "diary-images" in resource:
                        diary_policy_exists = True
                        print(f"\n发现已存在的日记图片策略: {resource}")
                        break
                if diary_policy_exists:
                    break

            if not diary_policy_exists:
                print("\n未发现日记图片策略，将添加新的策略")

                # 添加日记图片策略
                diary_policy = {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}/diary-images/*",
                        f"arn:aws:s3:::{bucket_name}/diary-images/**",
                    ],
                }

                policy_dict["Statement"].append(diary_policy)
            else:
                print("\n日记图片策略已存在，确保权限配置正确")
                # 无论如何，确保策略正确
                diary_policy = {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}/diary-images/*",
                        f"arn:aws:s3:::{bucket_name}/diary-images/**",
                    ],
                }

                # 更新现有策略或添加新策略
                updated = False
                for statement in policy_dict.get("Statement", []):
                    for resource in statement.get("Resource", []):
                        if "diary-images" in resource:
                            statement.update(diary_policy)
                            updated = True
                            break
                    if updated:
                        break

                if not updated:
                    policy_dict["Statement"].append(diary_policy)

            # 应用策略
            try:
                client.set_bucket_policy(bucket_name, json.dumps(policy_dict))
                print("\n成功设置日记图片访问策略")
                print("\n新的桶策略:")
                print(json.dumps(policy_dict, indent=2))
            except Exception as e:
                print(f"\n设置桶策略失败: {e}")

            # 检查特定文件是否可访问
            test_object_name = "diary-images/public/2025/12/11/1765258418_d4ebc18d.jpg"
            try:
                # 尝试获取对象信息
                stat = client.stat_object(bucket_name, test_object_name)
                print(f"\n测试对象 {test_object_name} 存在:")
                print(f"大小: {stat.size} 字节")
                print(f"最后修改: {stat.last_modified}")
                print(f"内容类型: {stat.content_type}")

                # 尝试生成预签名URL
                presigned_url = client.presigned_get_object(
                    bucket_name=bucket_name,
                    object_name=test_object_name,
                    expires=3600,  # 1小时
                )
                print(f"\n预签名URL (有效1小时):")
                print(presigned_url)

                # 公开URL格式
                public_url = (
                    f"http://{settings.MINIO_ENDPOINT}/{bucket_name}/{test_object_name}"
                )
                print(f"\n公开URL格式:")
                print(public_url)

            except S3Error as e:
                if e.code == "NoSuchKey":
                    print(f"\n测试对象 {test_object_name} 不存在")
                else:
                    print(f"\n访问测试对象失败: {e}")
                    print(f"错误代码: {e.code}")
                    print(f"错误信息: {e.message}")

        else:
            print(f"\n桶 {bucket_name} 不存在")

    except Exception as e:
        print(f"\n检查桶时出错: {e}")


if __name__ == "__main__":
    fix_diary_permissions()

#!/usr/bin/env python3
"""
修复所有MinIO权限问题
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import json

from minio import Minio

from app.core.config import settings


def fix_all_minio_permissions():
    """检查并修复所有MinIO权限问题"""
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
            except Exception as e:
                print(f"\n获取桶策略失败: {e}")

            # 设置新的桶策略，包含所有必要的文件夹
            new_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                    }
                ],
            }

            try:
                client.set_bucket_policy(bucket_name, json.dumps(new_policy))
                print("\n成功设置新的桶策略，允许公开访问所有对象")
            except Exception as e:
                print(f"\n设置桶策略失败: {e}")

        else:
            print(f"\n桶 {bucket_name} 不存在")

    except Exception as e:
        print(f"\n检查桶时出错: {e}")


if __name__ == "__main__":
    fix_all_minio_permissions()

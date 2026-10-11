#!/usr/bin/env python3
"""
MinIO 访问权限管理脚本
用于快速设置或检查 MinIO 的公共访问权限
"""

import argparse
import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_minio_client():
    """创建 MinIO 客户端"""
    return Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


def set_public_policy(client, bucket_name):
    """设置 MinIO 桶的公共访问策略"""
    try:
        # 确保桶存在
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            logger.info(f"创建MinIO桶: {bucket_name}")

        # 设置公开访问策略
        public_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}/diary-images/*",
                        f"arn:aws:s3:::{bucket_name}/diary-images/*/thumbnails/*",
                    ],
                },
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/anime-posters/*"],
                },
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/avatar/*"],
                },
            ],
        }

        # 应用策略
        client.set_bucket_policy(bucket_name, json.dumps(public_policy))
        logger.info(f"成功设置MinIO桶的公共访问策略: {bucket_name}")
        return True

    except S3Error as e:
        logger.error(f"设置MinIO桶策略失败: {e}")
        return False
    except Exception as e:
        logger.error(f"发生错误: {e}")
        return False


def get_current_policy(client, bucket_name):
    """获取当前的桶策略"""
    try:
        policy = client.get_bucket_policy(bucket_name)
        print(f"当前策略: {policy}")
        return policy
    except S3Error as e:
        logger.error(f"获取桶策略失败: {e}")
        return None


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="MinIO 访问权限管理工具")
    parser.add_argument(
        "action",
        choices=["set", "get", "verify"],
        help="操作类型: set(设置策略), get(获取当前策略), verify(验证URL访问)",
    )
    parser.add_argument(
        "--bucket",
        default=settings.MINIO_BUCKET_NAME,
        help=f"MinIO桶名称 (默认: {settings.MINIO_BUCKET_NAME})",
    )
    parser.add_argument("--test-url", help="测试URL的可访问性 (仅用于verify操作)")

    args = parser.parse_args()

    # 创建MinIO客户端
    client = create_minio_client()

    if args.action == "set":
        print(f"设置MinIO桶 {args.bucket} 的公共访问策略...")
        if set_public_policy(client, args.bucket):
            print("✅ 策略设置成功")
        else:
            print("❌ 策略设置失败")

    elif args.action == "get":
        print(f"获取MinIO桶 {args.bucket} 的当前策略...")
        policy = get_current_policy(client, args.bucket)
        if policy:
            print("✅ 获取策略成功")
        else:
            print("❌ 获取策略失败")

    elif args.action == "verify":
        test_url = args.test_url
        if not test_url:
            # 使用默认测试URL
            object_name = "diary-images/public/test/sample.jpg"
            test_url = f"http://{settings.MINIO_ENDPOINT}/{args.bucket}/{object_name}"

        print(f"验证URL访问: {test_url}")
        try:
            import requests

            response = requests.head(test_url, timeout=5)
            if response.status_code == 200:
                print("✅ URL可以公开访问")
            else:
                print(f"❌ URL访问失败，状态码: {response.status_code}")
        except Exception as e:
            print(f"❌ 访问URL时发生异常: {e}")


if __name__ == "__main__":
    main()

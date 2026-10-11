#!/usr/bin/env python3
"""
修复 MinIO 桶的公共访问权限，确保图片 URL 可以被公开访问
"""

import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def set_public_policy():
    """设置 MinIO 桶的公共访问策略"""
    try:
        # 创建 MinIO 客户端
        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        bucket_name = settings.MINIO_BUCKET_NAME

        # 确保桶存在
        if not client.bucket_exists(bucket_name):
            logger.info(f"创建MinIO桶: {bucket_name}")
            client.make_bucket(bucket_name)
        else:
            logger.info(f"MinIO桶已存在: {bucket_name}")

        # 设置公开访问策略
        public_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/diary-images/*"],
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

        # 验证策略
        current_policy = client.get_bucket_policy(bucket_name)
        logger.info(f"当前桶策略: {current_policy}")

        return True

    except S3Error as e:
        logger.error(f"设置MinIO桶策略失败: {e}")
        return False
    except Exception as e:
        logger.error(f"发生错误: {e}")
        return False


if __name__ == "__main__":
    if set_public_policy():
        print("MinIO 公共访问策略设置成功！")
    else:
        print("MinIO 公共访问策略设置失败！")

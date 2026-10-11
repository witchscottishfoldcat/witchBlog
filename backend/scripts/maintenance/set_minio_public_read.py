#!/usr/bin/env python3
"""
设置MinIO桶为公共读取
"""

import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def set_bucket_public_read():
    """设置桶为公共读取"""
    try:
        # 创建MinIO客户端
        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        bucket_name = settings.MINIO_BUCKET_NAME

        # 检查桶是否存在
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            logger.info(f"创建MinIO桶: {bucket_name}")

        # 设置完全公共读取策略
        public_read_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                }
            ],
        }

        # 应用策略
        client.set_bucket_policy(bucket_name, json.dumps(public_read_policy))
        logger.info(f"设置完全公共读取策略: {bucket_name}")

        return True

    except S3Error as e:
        logger.error(f"设置MinIO桶策略失败: {e}")
        return False
    except Exception as e:
        logger.error(f"发生错误: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    if set_bucket_public_read():
        print("MinIO 桶公共读取策略设置成功！")
    else:
        print("MinIO 桶公共读取策略设置失败！")

#!/usr/bin/env python3
"""
监控并定期重置MinIO策略
"""

import json
import logging
import time

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_and_fix_policy():
    """检查并修复MinIO策略"""
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
            logger.error(f"桶不存在: {bucket_name}")
            return False

        # 定义我们需要的策略
        required_policy = {
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
        client.set_bucket_policy(bucket_name, json.dumps(required_policy))
        logger.info(f"应用MinIO策略: {bucket_name}")

        return True

    except S3Error as e:
        logger.error(f"MinIO错误: {e}")
        return False
    except Exception as e:
        logger.error(f"发生错误: {e}")
        return False


def main():
    """主函数，定期检查并修复策略"""
    logger.info("开始监控MinIO策略...")

    # 立即执行一次
    check_and_fix_policy()

    # 然后定期检查（每30秒）
    try:
        while True:
            time.sleep(30)
            check_and_fix_policy()
    except KeyboardInterrupt:
        logger.info("停止监控MinIO策略")


if __name__ == "__main__":
    main()

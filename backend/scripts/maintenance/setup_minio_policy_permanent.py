#!/usr/bin/env python3
"""
永久设置MinIO桶策略，确保包含所有必要的路径
"""

import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def setup_permanent_policy():
    """设置永久MinIO桶策略，合并现有策略"""
    try:
        # 创建MinIO客户端
        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        bucket_name = settings.MINIO_BUCKET_NAME

        # 确保桶存在
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            logger.info(f"创建MinIO桶: {bucket_name}")

        # 获取当前策略（如果有的话）
        try:
            current_policy_json = client.get_bucket_policy(bucket_name)
            current_policy = json.loads(current_policy_json)
            logger.info("获取到现有策略")
        except S3Error:
            logger.info("没有现有策略，创建新策略")
            current_policy = {"Version": "2012-10-17", "Statement": []}

        # 创建我们需要的策略声明
        diary_statements = [
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
        ]

        # 合并策略
        # 保留现有策略，确保不会覆盖其他重要路径
        existing_resources = set()
        for statement in current_policy.get("Statement", []):
            for resource in statement.get("Resource", []):
                existing_resources.add(resource)

        # 添加我们的策略，避免重复
        new_statements = []
        for statement in diary_statements:
            for resource in statement.get("Resource", []):
                if resource not in existing_resources:
                    new_statements.append(statement)
                    existing_resources.add(resource)

        # 合并所有语句
        all_statements = current_policy.get("Statement", []) + new_statements

        # 应用合并后的策略
        merged_policy = {"Version": "2012-10-17", "Statement": all_statements}

        # 应用策略
        client.set_bucket_policy(bucket_name, json.dumps(merged_policy))
        logger.info(f"成功设置MinIO桶的合并策略: {bucket_name}")

        # 打印最终策略
        logger.info(f"最终策略: {json.dumps(merged_policy, indent=2)}")

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
    if setup_permanent_policy():
        print("MinIO 永久策略设置成功！")
    else:
        print("MinIO 永久策略设置失败！")

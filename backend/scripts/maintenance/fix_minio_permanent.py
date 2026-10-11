#!/usr/bin/env python3
"""
健壮地设置MinIO桶策略，确保包含所有必要的路径并且不会丢失现有权限
"""

import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def robust_minio_policy():
    """健壮地设置MinIO桶策略，确保包含所有必要的路径"""
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
            logger.info(f"创建MinIO桶: {bucket_name}")
            client.make_bucket(bucket_name)

        # 定义我们需要的最小策略集合
        required_statements = [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": ["s3:GetObject"],
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}/diary-images/*",
                    f"arn:aws:s3:::{bucket_name}/diary-images/*/*",
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

        # 获取当前策略（如果有的话）
        try:
            current_policy_json = client.get_bucket_policy(bucket_name)
            current_policy = json.loads(current_policy_json)
            logger.info("获取到现有策略")

            # 合并策略
            # 1. 收集现有资源
            existing_resources = set()
            for statement in current_policy.get("Statement", []):
                for resource in statement.get("Resource", []):
                    existing_resources.add(resource)

            # 2. 添加需要的策略，避免重复
            new_statements = []
            for statement in required_statements:
                statement_resources = statement.get("Resource", [])
                # 检查是否有任何资源已存在
                if not any(
                    resource in existing_resources for resource in statement_resources
                ):
                    new_statements.append(statement)
                    for resource in statement_resources:
                        existing_resources.add(resource)

            # 3. 合并所有语句
            all_statements = current_policy.get("Statement", []) + new_statements

            # 4. 应用合并后的策略
            merged_policy = {"Version": "2012-10-17", "Statement": all_statements}

        except S3Error as e:
            logger.info(f"没有现有策略，创建新策略: {e}")
            # 如果没有策略，使用我们定义的策略
            merged_policy = {"Version": "2012-10-17", "Statement": required_statements}

        # 应用策略
        client.set_bucket_policy(bucket_name, json.dumps(merged_policy))
        logger.info(f"成功设置MinIO桶的健壮策略: {bucket_name}")

        # 验证策略
        current_policy = client.get_bucket_policy(bucket_name)
        policy_dict = json.loads(current_policy)

        # 检查是否包含我们需要的策略
        diary_images_allowed = False
        for statement in policy_dict.get("Statement", []):
            resources = statement.get("Resource", [])
            for resource in resources:
                if "diary-images/*" in resource:
                    diary_images_allowed = True
                    logger.info(f"找到日记图片权限策略: {resource}")

        if diary_images_allowed:
            logger.info("✅ 日记图片公开访问权限已正确设置")
        else:
            logger.error("❌ 日记图片公开访问权限未正确设置")

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
    if robust_minio_policy():
        print("MinIO 健壮策略设置成功！")
    else:
        print("MinIO 健壮策略设置失败！")

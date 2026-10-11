#!/usr/bin/env python3
"""
更新MinIO策略以确保所有日记图片都是公开访问的
"""

import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def update_diary_images_policy():
    """更新日记图片的MinIO策略，确保所有图片都是公开访问的"""
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

        # 获取当前策略
        try:
            current_policy_json = client.get_bucket_policy(bucket_name)
            current_policy = json.loads(current_policy_json)
            logger.info("获取到现有策略")
        except S3Error:
            logger.info("没有现有策略，创建新策略")
            current_policy = {"Version": "2012-10-17", "Statement": []}

        # 检查是否已经有日记图片策略
        diary_policy_exists = False
        for statement in current_policy.get("Statement", []):
            resources = statement.get("Resource", [])
            for resource in resources:
                if "diary-images" in resource:
                    diary_policy_exists = True
                    logger.info(f"找到现有日记图片策略: {resource}")
                    break
            if diary_policy_exists:
                break

        # 如果没有日记图片策略，添加它
        if not diary_policy_exists:
            # 添加日记图片公开访问策略
            diary_statement = {
                "Effect": "Allow",
                "Principal": "*",
                "Action": ["s3:GetObject"],
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}/diary-images/*",
                    f"arn:aws:s3:::{bucket_name}/diary-images/*/*",
                ],
            }

            current_policy["Statement"].append(diary_statement)
            logger.info("添加日记图片公开访问策略")
        else:
            # 确保现有策略是正确的
            updated = False
            for statement in current_policy.get("Statement", []):
                resources = statement.get("Resource", [])
                diary_resources = [r for r in resources if "diary-images" in r]

                if diary_resources:
                    # 确保包含了所有需要的资源
                    required_resources = [
                        f"arn:aws:s3:::{bucket_name}/diary-images/*",
                        f"arn:aws:s3:::{bucket_name}/diary-images/*/*",
                    ]

                    # 检查是否缺少任何必需的资源
                    missing_resources = set(required_resources) - set(diary_resources)
                    if missing_resources:
                        # 合并所有资源
                        all_resources = list(set(diary_resources + required_resources))
                        statement["Resource"] = all_resources
                        updated = True
                        logger.info(f"更新日记图片策略，添加缺失的资源: {missing_resources}")

            if not updated:
                logger.info("日记图片策略已经是最新且完整的")

        # 应用更新后的策略
        client.set_bucket_policy(bucket_name, json.dumps(current_policy))
        logger.info("成功更新MinIO桶策略")

        # 验证策略
        updated_policy_json = client.get_bucket_policy(bucket_name)
        updated_policy = json.loads(updated_policy_json)

        logger.info("当前策略包含的资源:")
        for statement in updated_policy.get("Statement", []):
            for resource in statement.get("Resource", []):
                if "diary-images" in resource:
                    logger.info(f"  - {resource}")

        return True

    except S3Error as e:
        logger.error(f"更新MinIO策略失败: {e}")
        return False
    except Exception as e:
        logger.error(f"发生错误: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    logger.info("=== 开始更新日记图片公开访问策略 ===")

    if update_diary_images_policy():
        logger.info("✅ 日记图片公开访问策略更新成功")
        logger.info("所有日记图片现在都是公开可访问的")
    else:
        logger.error("❌ 日记图片公开访问策略更新失败")

    logger.info("=== 更新完成 ===")

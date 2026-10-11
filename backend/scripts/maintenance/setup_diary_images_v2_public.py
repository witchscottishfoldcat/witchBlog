#!/usr/bin/env python3
"""
设置新的 diary-imagesV2 文件夹为公开访问
"""
import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# 设置日志
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def setup_diary_images_v2_public():
    """设置 diary-imagesV2 文件夹的公开访问权限"""
    try:
        # 创建 MinIO 客户端
        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        bucket_name = settings.MINIO_BUCKET_NAME
        logger.info(f"正在为存储桶 {bucket_name} 中的 diary-imagesV2 设置公开访问权限...")

        # 获取当前策略
        try:
            current_policy_json = client.get_bucket_policy(bucket_name)
            policy_dict = json.loads(current_policy_json)
            logger.info("已获取当前存储桶策略")
        except S3Error:
            # 如果没有策略，创建一个空的
            policy_dict = {"Version": "2012-10-17", "Statement": []}
            logger.info("当前存储桶没有策略，将创建新策略")

        # 检查是否已经有 diary-imagesV2 相关的策略
        diary_v2_policy_exists = False
        for statement in policy_dict.get("Statement", []):
            # 查找匹配的 GetObject 策略
            if (
                statement.get("Effect") == "Allow"
                and statement.get("Principal") == "*"
                and "s3:GetObject" in statement.get("Action", [])
            ):
                # 检查资源中是否包含 diary-imagesV2 路径
                for resource in statement.get("Resource", []):
                    if "diary-imagesV2" in resource:
                        diary_v2_policy_exists = True
                        logger.info("发现已有的 diary-imagesV2 策略")
                        break

        # 添加新的 diary-imagesV2 策略
        diary_v2_policy = {
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [
                f"arn:aws:s3:::{bucket_name}/diary-imagesV2/*",
                f"arn:aws:s3:::{bucket_name}/diary-imagesV2/*/*",
            ],
        }

        if not diary_v2_policy_exists:
            policy_dict["Statement"].append(diary_v2_policy)
            logger.info("添加新的 diary-imagesV2 策略")
        else:
            # 更新现有策略，确保包含所有必要资源
            updated = False
            for statement in policy_dict.get("Statement", []):
                if (
                    statement.get("Effect") == "Allow"
                    and statement.get("Principal") == "*"
                    and "s3:GetObject" in statement.get("Action", [])
                ):
                    # 检查是否有 diary-imagesV2 资源
                    has_diary_v2_resource = any(
                        "diary-imagesV2" in r for r in statement.get("Resource", [])
                    )
                    if has_diary_v2_resource:
                        # 合并资源，确保包含所有 diary-imagesV2 路径
                        existing_resources = set(statement.get("Resource", []))
                        needed_resources = set(diary_v2_policy["Resource"])
                        all_resources = list(existing_resources.union(needed_resources))
                        statement["Resource"] = all_resources
                        updated = True
                        logger.info("更新了现有的 diary-imagesV2 策略")
                        break

            if not updated:
                policy_dict["Statement"].append(diary_v2_policy)
                logger.info("添加新的 diary-imagesV2 策略（未找到可更新的现有策略）")

        # 应用更新后的策略
        client.set_bucket_policy(bucket_name, json.dumps(policy_dict))
        logger.info("成功设置 diary-imagesV2 的公开访问权限")

        # 验证策略
        policy = client.get_bucket_policy(bucket_name)
        policy_obj = json.loads(policy)
        logger.info("当前策略内容:")
        for i, stmt in enumerate(policy_obj.get("Statement", [])):
            logger.info(f"  语句 {i+1}: {json.dumps(stmt, indent=2)}")

        return True

    except Exception as e:
        logger.error(f"设置 diary-imagesV2 公开访问权限时发生错误: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = setup_diary_images_v2_public()
    if success:
        print("diary-imagesV2 公开访问权限设置成功！")
    else:
        print("diary-imagesV2 公开访问权限设置失败！")

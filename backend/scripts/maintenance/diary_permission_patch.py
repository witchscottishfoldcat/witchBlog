#!/usr/bin/env python3
"""
在保存日记图片后验证权限的补丁脚本
通过修改DiaryService的save_diary_image方法，在保存图片后立即验证权限
"""

import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

logger = logging.getLogger(__name__)


def verify_diary_image_permissions(object_name: str) -> bool:
    """验证特定日记图片的访问权限"""
    try:
        # 创建MinIO客户端
        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        bucket_name = settings.MINIO_BUCKET_NAME

        # 获取当前策略
        try:
            current_policy_json = client.get_bucket_policy(bucket_name)
            current_policy = json.loads(current_policy_json)
        except S3Error as e:
            logger.error(f"获取MinIO策略失败: {e}")
            return False

        # 检查是否有匹配日记图片的策略
        has_permission = False
        for statement in current_policy.get("Statement", []):
            if statement.get("Effect") == "Allow" and statement.get("Principal") == "*":
                for resource in statement.get("Resource", []):
                    # 检查策略是否覆盖了图片路径
                    if resource.endswith("/*") or resource.endswith("/*/*"):
                        # 提取资源路径前缀
                        resource_prefix = resource.replace(
                            f"arn:aws:s3:::{bucket_name}/", ""
                        ).rstrip("*")
                        if object_name.startswith(resource_prefix):
                            has_permission = True
                            logger.info(f"图片 {object_name} 权限验证通过，匹配策略: {resource}")
                            break

        if not has_permission:
            logger.warning(f"图片 {object_name} 可能没有公开访问权限")
            # 尝试修复权限
            return ensure_diary_image_permissions(bucket_name, client)

        return True

    except Exception as e:
        logger.error(f"验证图片权限时发生错误: {e}")
        return False


def ensure_diary_image_permissions(bucket_name: str, client: Minio) -> bool:
    """确保日记图片有正确的访问权限"""
    try:
        # 获取当前策略
        try:
            current_policy_json = client.get_bucket_policy(bucket_name)
            policy_dict = json.loads(current_policy_json)
        except S3Error:
            # 如果没有策略，创建一个空的
            policy_dict = {"Version": "2012-10-17", "Statement": []}

        # 定义日记图片所需的权限策略
        diary_policy = {
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [
                f"arn:aws:s3:::{bucket_name}/diary-images/*",
                f"arn:aws:s3:::{bucket_name}/diary-images/*/*",
            ],
        }

        # 检查是否已经有日记相关的策略
        diary_policy_exists = False
        for statement in policy_dict.get("Statement", []):
            if "diary-images" in statement.get("Resource", [""])[0]:
                diary_policy_exists = True
                # 更新现有策略以确保完整性
                statement["Resource"] = diary_policy["Resource"]
                break

        # 如果没有日记相关的策略，添加它
        if not diary_policy_exists:
            policy_dict["Statement"].append(diary_policy)

        # 应用更新后的策略
        client.set_bucket_policy(bucket_name, json.dumps(policy_dict))
        logger.info("成功确保日记图片访问权限")
        return True

    except Exception as e:
        logger.error(f"确保日记图片权限时发生错误: {e}")
        return False


# 以下是DiaryService.save_diary_image方法的补丁代码
# 应该将这段代码添加到save_diary_image方法的末尾

"""
# 在save_diary_image方法的最后，db.commit()之后添加以下代码：

# 验证图片权限
if not verify_diary_image_permissions(minio_object_name):
    logger.warning(f"图片权限验证失败，已尝试修复: {minio_object_name}")
else:
    logger.info(f"图片权限验证通过: {minio_object_name}")
"""

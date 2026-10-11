#!/usr/bin/env python3
"""
检查并修复日记图片权限问题
当保存日记图片时，MinIO权限可能被覆盖或丢失
"""

import json
import logging

from minio import Minio
from minio.error import S3Error
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.diary import DiaryImage

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_and_fix_minio_permissions():
    """检查并修复MinIO权限问题"""
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

        # 检查日记图片策略是否存在
        diary_policy_exists = False
        anime_policy_exists = False
        avatar_policy_exists = False

        for statement in current_policy.get("Statement", []):
            resources = statement.get("Resource", [])
            for resource in resources:
                if "diary-images" in resource:
                    diary_policy_exists = True
                    logger.info(f"找到日记图片策略: {resource}")
                if "anime-posters" in resource:
                    anime_policy_exists = True
                    logger.info(f"找到动漫海报策略: {resource}")
                if "avatar" in resource:
                    avatar_policy_exists = True
                    logger.info(f"找到头像策略: {resource}")

        # 如果策略不存在，添加它们
        if (
            not diary_policy_exists
            or not anime_policy_exists
            or not avatar_policy_exists
        ):
            # 添加所需的策略
            required_statements = []

            if not diary_policy_exists:
                required_statements.append(
                    {
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": [
                            f"arn:aws:s3:::{bucket_name}/diary-images/*",
                            f"arn:aws:s3:::{bucket_name}/diary-images/*/*",
                        ],
                    }
                )
                logger.info("添加日记图片权限策略")

            if not anime_policy_exists:
                required_statements.append(
                    {
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/anime-posters/*"],
                    }
                )
                logger.info("添加动漫海报权限策略")

            if not avatar_policy_exists:
                required_statements.append(
                    {
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/avatar/*"],
                    }
                )
                logger.info("添加头像权限策略")

            # 合并策略
            updated_statements = (
                current_policy.get("Statement", []) + required_statements
            )
            updated_policy = {"Version": "2012-10-17", "Statement": updated_statements}

            # 应用更新后的策略
            client.set_bucket_policy(bucket_name, json.dumps(updated_policy))
            logger.info("成功更新MinIO桶策略")
        else:
            logger.info("所有权限策略已存在")

        # 验证策略
        updated_policy_json = client.get_bucket_policy(bucket_name)
        updated_policy = json.loads(updated_policy_json)

        logger.info("当前策略包含的资源:")
        for statement in updated_policy.get("Statement", []):
            for resource in statement.get("Resource", []):
                logger.info(f"  - {resource}")

        return True

    except S3Error as e:
        logger.error(f"检查MinIO权限失败: {e}")
        return False
    except Exception as e:
        logger.error(f"发生错误: {e}")
        import traceback

        traceback.print_exc()
        return False


def check_diary_image_access():
    """检查日记图片访问情况"""
    try:
        # 获取数据库会话
        db = next(get_db())

        # 查询最近的日记图片
        recent_images = (
            db.query(DiaryImage).order_by(DiaryImage.id.desc()).limit(5).all()
        )

        if not recent_images:
            logger.info("没有找到日记图片")
            return

        # 创建MinIO客户端
        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        bucket_name = settings.MINIO_BUCKET_NAME

        logger.info(f"检查最近的 {len(recent_images)} 张日记图片:")

        for image in recent_images:
            object_name = image.minio_object_name
            image_url = f"http://{settings.MINIO_ENDPOINT}/{bucket_name}/{object_name}"

            logger.info(f"图片 ID: {image.id}")
            logger.info(f"对象名称: {object_name}")
            logger.info(f"原始文件名: {image.original_filename}")
            logger.info(f"公开URL: {image_url}")

            # 检查对象是否存在
            try:
                stat = client.stat_object(bucket_name, object_name)
                logger.info(f"对象存在，大小: {stat.size} 字节")
            except S3Error as e:
                logger.error(f"对象不存在或无法访问: {e}")

            logger.info("-" * 50)

        db.close()

    except Exception as e:
        logger.error(f"检查日记图片访问时出错: {e}")
        import traceback

        traceback.print_exc()


def fix_diary_service_issue():
    """修复DiaryService中的潜在问题

    问题分析：
    1. DiaryService在初始化时调用_ensure_bucket_policy()
    2. 但这可能会覆盖已有的策略
    3. 需要修改策略合并逻辑，确保不丢失现有权限
    """
    logger.info("分析DiaryService中的潜在问题...")
    logger.info("问题原因可能是:")
    logger.info("1. DiaryService初始化时可能会覆盖已有的MinIO策略")
    logger.info("2. 策略合并逻辑可能不完善，导致某些权限丢失")
    logger.info("3. 需要确保策略添加是增量式的，而不是覆盖式的")

    logger.info("建议的解决方案:")
    logger.info("1. 修改DiaryService._ensure_bucket_policy方法，使用增量式策略更新")
    logger.info("2. 在保存图片后，立即验证并恢复权限")
    logger.info("3. 定期检查MinIO权限，确保不会被意外覆盖")


if __name__ == "__main__":
    logger.info("=== 开始检查和修复日记图片权限问题 ===")

    # 1. 检查并修复MinIO权限
    logger.info("步骤1: 检查并修复MinIO权限")
    check_and_fix_minio_permissions()

    # 2. 检查日记图片访问情况
    logger.info("\n步骤2: 检查日记图片访问情况")
    check_diary_image_access()

    # 3. 分析问题原因
    logger.info("\n步骤3: 分析问题原因")
    fix_diary_service_issue()

    logger.info("\n=== 检查完成 ===")
    logger.info("如果问题仍然存在，可能需要:")
    logger.info("1. 重启应用服务，确保使用最新的权限配置")
    logger.info("2. 检查是否有其他代码在修改MinIO策略")
    logger.info("3. 考虑使用MinIO的事件通知机制，实时监控权限变更")

#!/usr/bin/env python3
"""
全面修复日记图片权限问题
此脚本提供更全面的权限修复机制，解决权限被重置的问题
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


class ComprehensiveDiaryPermissionFixer:
    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME

    def check_and_fix_bucket_policy(self):
        """检查并修复桶策略"""
        try:
            # 确保桶存在
            if not self.client.bucket_exists(self.bucket_name):
                logger.info(f"创建MinIO桶: {self.bucket_name}")
                self.client.make_bucket(self.bucket_name)

            # 获取当前策略
            try:
                current_policy_json = self.client.get_bucket_policy(self.bucket_name)
                current_policy = json.loads(current_policy_json)
                logger.info("获取到现有策略")
            except S3Error:
                logger.info("没有现有策略，创建新策略")
                current_policy = {"Version": "2012-10-17", "Statement": []}

            # 分析现有策略
            diary_policy_exists = False
            updated_statements = []

            for statement in current_policy.get("Statement", []):
                # 检查是否是允许公开访问的GetObject策略
                if (
                    statement.get("Effect") == "Allow"
                    and statement.get("Principal") == "*"
                    and "s3:GetObject" in statement.get("Action", [])
                ):
                    resources = statement.get("Resource", [])
                    diary_resources = [r for r in resources if "diary-images" in r]

                    if diary_resources:
                        diary_policy_exists = True
                        # 确保包含了所有必需的资源
                        needed_resources = {
                            f"arn:aws:s3:::{self.bucket_name}/diary-images/*",
                            f"arn:aws:s3:::{self.bucket_name}/diary-images/*/*",
                        }

                        existing_diary_resources = set(diary_resources)
                        other_resources = [
                            r for r in resources if "diary-images" not in r
                        ]

                        # 合并所有资源
                        all_resources = list(
                            needed_resources.union(set(other_resources))
                        )
                        statement["Resource"] = all_resources
                        logger.info(f"更新现有日记策略，资源数: {len(all_resources)}")

                updated_statements.append(statement)

            # 如果没有日记相关的策略，添加它
            if not diary_policy_exists:
                updated_statements.append(
                    {
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": [
                            f"arn:aws:s3:::{self.bucket_name}/diary-images/*",
                            f"arn:aws:s3:::{self.bucket_name}/diary-images/*/*",
                        ],
                    }
                )
                logger.info("添加新的日记图片权限策略")

            # 更新策略
            updated_policy = {"Version": "2012-10-17", "Statement": updated_statements}

            self.client.set_bucket_policy(self.bucket_name, json.dumps(updated_policy))
            logger.info("成功更新MinIO桶策略")

            # 验证策略
            updated_policy_json = self.client.get_bucket_policy(self.bucket_name)
            updated_policy = json.loads(updated_policy_json)

            logger.info("当前策略包含的资源:")
            for statement in updated_policy.get("Statement", []):
                if "s3:GetObject" in statement.get("Action", []):
                    for resource in statement.get("Resource", []):
                        if "diary-images" in resource:
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

    def check_recent_images(self):
        """检查最近图片的访问情况"""
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

            logger.info(f"检查最近的 {len(recent_images)} 张日记图片:")

            for image in recent_images:
                object_name = image.minio_object_name
                image_url = (
                    f"http://{settings.MINIO_ENDPOINT}/{self.bucket_name}/{object_name}"
                )

                logger.info(f"图片 ID: {image.id}")
                logger.info(f"对象名称: {object_name}")
                logger.info(f"原始文件名: {image.original_filename}")
                logger.info(f"公开URL: {image_url}")

                # 检查对象是否存在
                try:
                    stat = self.client.stat_object(self.bucket_name, object_name)
                    logger.info(f"对象存在，大小: {stat.size} 字节")
                except S3Error as e:
                    logger.error(f"对象不存在或无法访问: {e}")

                logger.info("-" * 50)

            db.close()

        except Exception as e:
            logger.error(f"检查日记图片访问时出错: {e}")
            import traceback

            traceback.print_exc()

    def fix_permissions(self):
        """执行完整的权限修复"""
        logger.info("=== 开始全面修复日记图片权限 ===")

        # 1. 检查并修复桶策略
        logger.info("步骤1: 检查并修复桶策略")
        if self.check_and_fix_bucket_policy():
            logger.info("✅ 桶策略修复成功")
        else:
            logger.error("❌ 桶策略修复失败")
            return False

        # 2. 检查最近图片访问情况
        logger.info("\n步骤2: 检查最近图片访问情况")
        self.check_recent_images()

        logger.info("\n=== 权限修复完成 ===")
        logger.info("建议重启应用程序以确保使用最新的权限配置")
        return True


if __name__ == "__main__":
    fixer = ComprehensiveDiaryPermissionFixer()
    fixer.fix_permissions()

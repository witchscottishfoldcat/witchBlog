#!/usr/bin/env python3
"""
设置MinIO存储桶为混合访问策略：
- public/ 目录：公开访问
- private/ 目录：私有访问（需要认证）
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import logging

from app.core.config import settings
from app.services.minio_service import minio_service

# 设置日志
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def setup_mixed_access_policy():
    """设置混合访问策略：公开public目录，私有private目录"""
    try:
        # 检查是否为模拟模式
        if minio_service._mock_mode:
            logger.info("MinIO处于模拟模式，无需设置访问策略")
            return True

        # 创建混合访问策略
        mixed_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET_NAME}/public/*"],
                }
            ],
        }

        # 设置存储桶策略
        policy_json = json.dumps(mixed_policy)
        minio_service.client.set_bucket_policy(settings.MINIO_BUCKET_NAME, policy_json)

        logger.info(f"成功将存储桶 {settings.MINIO_BUCKET_NAME} 设置为混合访问策略")
        logger.info("public/ 目录：公开访问")
        logger.info("private/ 目录：私有访问（需要认证）")
        return True

    except Exception as e:
        logger.error(f"设置存储桶策略失败: {str(e)}")
        return False


def get_bucket_policy():
    """获取当前存储桶策略"""
    try:
        if minio_service._mock_mode:
            logger.info("MinIO处于模拟模式，无法获取访问策略")
            return None

        policy = minio_service.client.get_bucket_policy(settings.MINIO_BUCKET_NAME)
        logger.info(f"当前存储桶策略: {policy}")
        return policy

    except Exception as e:
        logger.error(f"获取存储桶策略失败: {str(e)}")
        return None


def create_directories():
    """创建必要的目录结构"""
    try:
        if minio_service._mock_mode:
            logger.info("MinIO处于模拟模式，无需创建目录")
            return True

        # 创建空对象来表示目录
        directories = ["public/md_files/", "private/md_files/"]

        for directory in directories:
            # 确保目录名以/结尾
            if not directory.endswith("/"):
                directory += "/"

            try:
                # 检查目录是否已存在
                minio_service.client.stat_object(
                    bucket_name=settings.MINIO_BUCKET_NAME, object_name=directory
                )
                logger.info(f"目录 {directory} 已存在")
            except:
                # 目录不存在，创建它
                from io import BytesIO

                minio_service.client.put_object(
                    bucket_name=settings.MINIO_BUCKET_NAME,
                    object_name=directory,
                    data=BytesIO(b""),
                    length=0,
                    content_type="application/x-directory",
                )
                logger.info(f"已创建目录 {directory}")

        return True
    except Exception as e:
        logger.error(f"创建目录失败: {str(e)}")
        return False


def migrate_existing_files():
    """迁移现有文件到新的目录结构"""
    try:
        if minio_service._mock_mode:
            logger.info("MinIO处于模拟模式，无需迁移文件")
            return True

        # 获取所有现有的md_files目录下的文件
        objects = minio_service.client.list_objects(
            bucket_name=settings.MINIO_BUCKET_NAME, prefix="md_files/", recursive=True
        )

        moved_count = 0
        for obj in objects:
            # 跳过目录对象
            if obj.object_name.endswith("/"):
                continue

            # 从数据库中获取文件的公开状态
            object_name = obj.object_name

            # 这里需要连接数据库获取文件信息
            # 但由于循环导入问题，我们使用另一种方式
            # 在实际使用中，应该创建一个专门的数据访问层

            # 为了演示，我们暂时将所有文件移动到private目录
            new_object_name = object_name.replace("md_files/", "private/md_files/")

            # 复制文件到新位置
            minio_service.client.copy_object(
                bucket_name=settings.MINIO_BUCKET_NAME,
                object_name=new_object_name,
                source=f"{settings.MINIO_BUCKET_NAME}/{object_name}",
            )

            # 删除原文件
            minio_service.client.remove_object(
                bucket_name=settings.MINIO_BUCKET_NAME, object_name=object_name
            )

            moved_count += 1
            logger.info(f"已移动文件: {object_name} -> {new_object_name}")

        if moved_count > 0:
            logger.info(f"已迁移 {moved_count} 个文件到新的目录结构")
        else:
            logger.info("没有需要迁移的文件")

        return True
    except Exception as e:
        logger.error(f"迁移文件失败: {str(e)}")
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("设置MinIO存储桶为混合访问策略")
    print("=" * 60)
    print("\n说明:")
    print("- public/ 目录：公开访问，任何人都可以访问")
    print("- private/ 目录：私有访问，需要认证才能访问")
    print("\n此操作将:")
    print("1. 创建目录结构")
    print("2. 设置存储桶访问策略")
    print("3. 迁移现有文件")
    print("\n继续吗？(y/n)")

    choice = input().strip().lower()
    if choice != "y":
        print("操作已取消")
        return

    # 1. 创建目录结构
    print("\n步骤1: 创建目录结构...")
    if not create_directories():
        print("❌ 创建目录结构失败")
        return

    # 2. 设置存储桶策略
    print("\n步骤2: 设置存储桶策略...")
    if not setup_mixed_access_policy():
        print("❌ 设置存储桶策略失败")
        return

    # 3. 迁移现有文件
    print("\n步骤3: 迁移现有文件...")
    if not migrate_existing_files():
        print("❌ 迁移文件失败")
        return

    # 4. 显示最终策略
    print("\n步骤4: 验证最终设置...")
    get_bucket_policy()

    print("\n✅ 混合访问策略设置完成！")
    print("\n现在您需要:")
    print("1. 更新数据库中的文件URL（使用update_to_mixed_urls.py脚本）")
    print("2. 确保API端点只返回有权限访问的文件")
    print("3. 测试公开和私有文件的访问")

    print("=" * 60)


if __name__ == "__main__":
    main()

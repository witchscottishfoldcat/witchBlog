#!/usr/bin/env python3
"""
设置MinIO存储桶为公开访问
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


def set_bucket_public_policy():
    """设置存储桶为公开访问"""
    try:
        # 检查是否为模拟模式
        if minio_service._mock_mode:
            logger.info("MinIO处于模拟模式，无需设置访问策略")
            return True

        # 创建公开访问策略
        public_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET_NAME}/*"],
                }
            ],
        }

        # 设置存储桶策略
        policy_json = json.dumps(public_policy)
        minio_service.client.set_bucket_policy(settings.MINIO_BUCKET_NAME, policy_json)

        logger.info(f"成功将存储桶 {settings.MINIO_BUCKET_NAME} 设置为公开访问")
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


def main():
    """主函数"""
    print("=" * 60)
    print("设置MinIO存储桶为公开访问")
    print("=" * 60)

    # 首先获取当前策略
    print("\n当前存储桶策略:")
    current_policy = get_bucket_policy()

    if current_policy:
        # 检查是否已经是公开策略
        if (
            '"Principal":{"AWS":"*"}' in current_policy
            and '"Effect":"Allow"' in current_policy
            and '"s3:GetObject"' in current_policy
        ):
            print("\n✅ 存储桶已经是公开访问，无需更改")
            return

    print("\n设置存储桶为公开访问...")
    success = set_bucket_public_policy()

    if success:
        print("\n✅ 成功将存储桶设置为公开访问")
        print("\n现在永久URL应该可以正常工作了")
        print("请再次运行测试脚本验证:")
        print("python scripts/test_permanent_urls.py")
    else:
        print("\n❌ 设置存储桶策略失败")
        print("\n请检查MinIO服务器是否运行正常，以及访问权限是否正确")

    print("=" * 60)


if __name__ == "__main__":
    main()

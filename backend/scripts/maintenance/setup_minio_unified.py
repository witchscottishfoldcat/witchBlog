#!/usr/bin/env python3
"""
统一的MinIO权限设置入口
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging

from app.services.minio_policy_service import minio_policy_service

# 设置日志
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def main():
    """主函数"""
    logger.info("=== 使用统一权限管理服务设置MinIO策略 ===")

    if minio_policy_service.setup_all_policies():
        logger.info("✅ MinIO策略设置成功")

        # 检查几个关键路径的权限
        key_paths = [
            "diary-imagesV2/public/2025/12/26/example.jpg",
            "diary-images/private/example.jpg",
            "anime-covers/example.jpg",
            "md_files/example.md",
        ]

        logger.info("\n=== 检查关键路径权限 ===")
        for path in key_paths:
            has_permission = minio_policy_service.check_permissions(path)
            status = "✅" if has_permission else "❌"
            logger.info(f"{status} {path}: {'有权限' if has_permission else '无权限'}")
    else:
        logger.error("❌ MinIO策略设置失败")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

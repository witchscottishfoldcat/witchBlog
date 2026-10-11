#!/usr/bin/env python3
"""
测试永久URL是否正常工作
"""

import os
import sys

import requests

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging

from app.core.database import SessionLocal
from app.models.md_file import MDFile
from app.services.minio_service import minio_service

# 设置日志
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def test_permanent_urls():
    """测试永久URL是否可以访问"""
    db = SessionLocal()
    try:
        # 获取所有文件
        files = db.query(MDFile).all()
        if not files:
            logger.info("数据库中没有文件")
            return True

        logger.info(f"找到 {len(files)} 个文件")

        success_count = 0
        failure_count = 0

        for file in files:
            if not file.file_url:
                logger.warning(f"文件 {file.id} ({file.title}) 没有URL")
                continue

            logger.info(f"测试文件 {file.id} ({file.title})")
            logger.debug(f"URL: {file.file_url}")

            try:
                # 测试URL是否可访问
                response = requests.get(file.file_url, timeout=5)
                if response.status_code == 200:
                    logger.info(f"✅ 文件 {file.title} 的永久URL可以访问")
                    success_count += 1
                else:
                    logger.error(
                        f"❌ 文件 {file.title} 的永久URL无法访问，状态码: {response.status_code}"
                    )
                    failure_count += 1
            except requests.exceptions.RequestException as e:
                logger.error(f"❌ 文件 {file.title} 的永久URL访问出错: {str(e)}")
                failure_count += 1

        logger.info(f"\n测试结果：成功 {success_count}，失败 {failure_count}")

        if failure_count > 0:
            logger.warning("\n部分永久URL无法访问，可能的原因：")
            logger.warning("1. MinIO存储桶未设置为公开访问")
            logger.warning("2. MinIO服务器不可访问")
            logger.warning("3. 文件在MinIO中不存在或已被删除")
            logger.warning("\n解决方案：")
            logger.warning(
                "1. 使用 mc policy set public <minio-endpoint>/<bucket-name> 设置存储桶为公开"
            )
            logger.warning("2. 检查MinIO服务器是否运行正常")
            logger.warning("3. 运行 python scripts/update_to_permanent_urls.py 更新URL")

        return failure_count == 0

    except Exception as e:
        logger.error(f"测试过程中出错: {str(e)}")
        return False
    finally:
        db.close()


def main():
    """主函数"""
    print("=" * 60)
    print("测试永久URL是否正常工作")
    print("=" * 60)

    success = test_permanent_urls()

    print("\n" + "=" * 60)
    if success:
        print("🎉 所有永久URL都可以正常访问！")
    else:
        print("⚠️ 部分永久URL无法访问，请检查MinIO配置")
    print("=" * 60)


if __name__ == "__main__":
    main()

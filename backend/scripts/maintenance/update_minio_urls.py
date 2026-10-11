#!/usr/bin/env python3
"""
批量更新MinIO文件URL的后台脚本
这个脚本可以定期运行，更新数据库中即将过期的URL
"""

import os
import sys
from datetime import datetime, timedelta

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


def update_expired_urls(batch_size: int = 100, force_all: bool = False):
    """
    更新即将过期的URL

    Args:
        batch_size: 每批处理的文件数量
        force_all: 是否强制更新所有文件的URL，而不仅仅是即将过期的
    """
    db = SessionLocal()
    try:
        if force_all:
            # 获取所有文件
            files = db.query(MDFile).limit(batch_size).all()
            logger.info(f"强制更新所有文件URL，共 {len(files)} 个文件")
        else:
            # 获取所有文件（因为我们无法直接从URL判断过期时间）
            # 在实际应用中，可以添加一个url_updated_at字段来跟踪URL更新时间
            files = db.query(MDFile).limit(batch_size).all()
            logger.info(f"更新文件URL，共 {len(files)} 个文件")

        updated_count = 0
        for file in files:
            try:
                # 生成新的URL
                if file.object_name:
                    file.file_url = minio_service.get_file_url(file.object_name)
                    updated_count += 1
                    logger.debug(f"已更新文件 {file.id} ({file.title}) 的URL")
            except Exception as e:
                logger.error(f"更新文件 {file.id} URL时出错: {str(e)}")

        # 提交更改
        db.commit()
        logger.info(f"成功更新 {updated_count} 个文件的URL")

        return updated_count

    except Exception as e:
        logger.error(f"更新URL时出错: {str(e)}")
        db.rollback()
        return 0
    finally:
        db.close()


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="更新MinIO文件URL")
    parser.add_argument("--batch-size", type=int, default=100, help="每批处理的文件数量")
    parser.add_argument("--force-all", action="store_true", help="强制更新所有文件的URL")

    args = parser.parse_args()

    logger.info("开始更新MinIO文件URL...")
    start_time = datetime.now()

    updated_count = update_expired_urls(
        batch_size=args.batch_size, force_all=args.force_all
    )

    end_time = datetime.now()
    duration = end_time - start_time

    logger.info(f"更新完成，共更新 {updated_count} 个文件的URL，耗时 {duration.total_seconds():.2f} 秒")


if __name__ == "__main__":
    main()

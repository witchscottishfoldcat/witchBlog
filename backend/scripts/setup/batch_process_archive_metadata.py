#!/usr/bin/env python3
"""
批量处理归档文件元数据脚本
用于解析已有归档文件的元数据并存储到数据库中
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import logging
from datetime import date, datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.md_file_archive import MDFileArchive
from app.services.md_metadata_parser import MDMetadataParser
from app.services.md_metadata_service import MDMetadataService
from app.services.minio_service import MinIOService

# 配置日志
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def main():
    """主函数"""
    # 初始化数据库连接
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # 初始化服务
    metadata_parser = MDMetadataParser()
    metadata_service = MDMetadataService()
    minio_service = MinIOService()

    try:
        # 获取所有归档文件
        archives = db.query(MDFileArchive).all()
        logger.info(f"找到 {len(archives)} 个归档文件")

        updated_count = 0
        for archive in archives:
            try:
                # 获取归档文件内容
                if not archive.archive_object_name:
                    logger.warning(f"归档文件 {archive.id} 没有对象名，跳过处理")
                    continue

                content = minio_service.get_file_content(archive.archive_object_name)

                # 解析元数据
                parsed_metadata = metadata_service.extract_metadata_from_content(
                    content
                )

                # 处理元数据中的日期序列化
                metadata_json = None
                if parsed_metadata:
                    # 创建一个可序列化的元数据副本
                    serializable_metadata = {}
                    for key, value in parsed_metadata.items():
                        if isinstance(value, (datetime, date)):
                            serializable_metadata[key] = value.isoformat()
                        else:
                            serializable_metadata[key] = value
                    metadata_json = serializable_metadata

                # 更新归档文件的元数据
                # 处理published字段，可能是日期或布尔值
                published_value = parsed_metadata.get("published", False)
                if isinstance(published_value, (datetime, date)):
                    # 如果是日期，转换为布尔值（有日期就表示已发布）
                    archive.published = True
                else:
                    # 否则直接使用布尔值或默认值
                    archive.published = bool(published_value)

                archive.category = parsed_metadata.get("category")
                archive.pinned = parsed_metadata.get("pinned", False)
                archive.encrypted = parsed_metadata.get("encrypted", False)
                archive.author = parsed_metadata.get("author")
                archive.parsed_metadata = metadata_json

                # 单独提交每个归档文件的更改
                db.commit()
                updated_count += 1
                logger.info(f"已更新归档文件 {archive.id}: {archive.title}")

            except Exception as e:
                logger.error(f"处理归档文件 {archive.id} 时出错: {e}")
                db.rollback()
                continue

        logger.info(f"批量处理完成，共更新 {updated_count} 个归档文件的元数据")

    except Exception as e:
        logger.error(f"批量处理过程中出错: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

"""
批量处理MD文件的元数据
用于解析已有MD文件的front-matter并更新到数据库
"""

import os
import sys
from typing import List

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

import time

from loguru import logger

from app.core.config import settings
from app.core.database import get_db
from app.models.md_file import MDFile
from app.services.md_metadata_service import MDMetadataService
from app.services.minio_service import MinIOService


def batch_process_md_files(db: Session) -> dict:
    """
    批量处理所有MD文件的元数据

    Args:
        db: 数据库会话

    Returns:
        处理结果统计
    """
    # 获取所有MD文件
    md_files = db.query(MDFile).all()

    total_files = len(md_files)
    processed = 0
    updated = 0
    errors = 0

    logger.info(f"开始批量处理 {total_files} 个MD文件")

    minio_service = MinIOService()

    for md_file in md_files:
        try:
            processed += 1
            logger.info(
                f"处理文件 [{processed}/{total_files}]: {md_file.title} (ID: {md_file.id})"
            )

            # 从MinIO获取文件内容
            content = minio_service.get_file_content(md_file.object_name)

            if not content:
                logger.warning(f"无法获取文件内容: {md_file.object_name}")
                continue

            # 解析并存储元数据
            MDMetadataService.parse_and_store_metadata(db, md_file, content)
            updated += 1

            # 添加延迟避免过于频繁的操作
            time.sleep(0.1)

        except Exception as e:
            errors += 1
            logger.error(f"处理文件失败 {md_file.id}: {str(e)}")
            continue

    return {
        "total_files": total_files,
        "processed": processed,
        "updated": updated,
        "errors": errors,
    }


def process_files_with_metadata(db: Session) -> List[MDFile]:
    """
    获取已解析元数据的文件列表

    Args:
        db: 数据库会话

    Returns:
        包含元数据的文件列表
    """
    files = db.query(MDFile).filter(MDFile.parsed_metadata.isnot(None)).all()

    return files


def process_files_without_metadata(db: Session) -> List[MDFile]:
    """
    获取未解析元数据的文件列表

    Args:
        db: 数据库会话

    Returns:
        不包含元数据的文件列表
    """
    files = db.query(MDFile).filter(MDFile.parsed_metadata.is_(None)).all()

    return files


def print_statistics(db: Session):
    """
    打印元数据统计信息

    Args:
        db: 数据库会话
    """
    total = db.query(MDFile).count()
    with_metadata = db.query(MDFile).filter(MDFile.parsed_metadata.isnot(None)).count()
    without_metadata = total - with_metadata

    logger.info("===== 元数据统计 =====")
    logger.info(f"总文件数: {total}")
    logger.info(
        f"包含元数据: {with_metadata} ({with_metadata/total*100:.1f}%)"
        if total > 0
        else "包含元数据: 0 (0%)"
    )
    logger.info(
        f"不包含元数据: {without_metadata} ({without_metadata/total*100:.1f}%)"
        if total > 0
        else "不包含元数据: 0 (0%)"
    )


def reset_metadata(db: Session, file_id: int = None) -> bool:
    """
    重置文件的元数据

    Args:
        db: 数据库会话
        file_id: 文件ID，如果为None则重置所有文件

    Returns:
        是否成功
    """
    try:
        if file_id:
            # 重置单个文件
            md_file = db.query(MDFile).filter(MDFile.id == file_id).first()
            if not md_file:
                logger.error(f"文件 {file_id} 不存在")
                return False

            md_file.parsed_metadata = None
            md_file.published = None
            md_file.category = None
            md_file.pinned = False
            md_file.encrypted = False
            md_file.author = None

            db.commit()
            logger.info(f"已重置文件 {file_id} 的元数据")
        else:
            # 重置所有文件
            db.query(MDFile).update(
                {
                    "parsed_metadata": None,
                    "published": None,
                    "category": None,
                    "pinned": False,
                    "encrypted": False,
                    "author": None,
                }
            )

            db.commit()
            logger.info("已重置所有文件的元数据")

        return True

    except Exception as e:
        db.rollback()
        logger.error(f"重置元数据失败: {str(e)}")
        return False


def main():
    """主函数"""
    # 确保项目根目录在Python路径中
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, project_root)

    # 获取数据库会话
    db = next(get_db())

    try:
        # 显示命令行选项
        if len(sys.argv) < 2:
            print("用法:")
            print("  python batch_process_md_metadata.py batch       # 批量处理所有文件")
            print("  python batch_process_md_metadata.py stats       # 显示统计信息")
            print("  python batch_process_md_metadata.py reset       # 重置所有元数据")
            print("  python batch_process_md_metadata.py reset <id>   # 重置指定文件的元数据")
            return

        command = sys.argv[1].lower()

        if command == "batch":
            # 批量处理所有文件
            print_statistics(db)
            result = batch_process_md_files(db)
            logger.info("===== 批量处理结果 =====")
            logger.info(f"总文件数: {result['total_files']}")
            logger.info(f"已处理: {result['processed']}")
            logger.info(f"已更新: {result['updated']}")
            logger.info(f"错误: {result['errors']}")
            print_statistics(db)

        elif command == "stats":
            # 显示统计信息
            print_statistics(db)

        elif command == "reset":
            # 重置元数据
            if len(sys.argv) > 2:
                file_id = int(sys.argv[2])
                reset_metadata(db, file_id)
            else:
                reset_metadata(db, None)

        else:
            logger.error(f"未知命令: {command}")

    finally:
        db.close()


if __name__ == "__main__":
    main()

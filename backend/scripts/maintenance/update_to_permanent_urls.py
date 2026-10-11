#!/usr/bin/env python3
"""
将现有文件的URL从预签名URL更新为永久URL
"""

import os
import sys

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


def update_to_permanent_urls():
    """将所有文件的URL更新为永久URL"""
    db = SessionLocal()
    try:
        # 获取所有文件
        files = db.query(MDFile).all()
        logger.info(f"找到 {len(files)} 个文件")

        updated_count = 0
        for file in files:
            try:
                # 生成永久URL
                if file.object_name:
                    old_url = file.file_url
                    file.file_url = minio_service.get_file_url(
                        file.object_name, presigned=False
                    )

                    # 检查URL是否真的变了
                    if old_url != file.file_url:
                        updated_count += 1
                        logger.info(f"已更新文件 {file.id} ({file.title}) 的URL为永久URL")
                        logger.debug(f"  旧URL: {old_url}")
                        logger.debug(f"  新URL: {file.file_url}")
                    else:
                        logger.debug(f"文件 {file.id} ({file.title}) 的URL已经是永久URL")
            except Exception as e:
                logger.error(f"更新文件 {file.id} ({file.title}) URL时出错: {str(e)}")

        # 提交更改
        db.commit()
        logger.info(f"成功更新 {updated_count} 个文件的URL为永久URL")

        return updated_count

    except Exception as e:
        logger.error(f"更新URL时出错: {str(e)}")
        db.rollback()
        return 0
    finally:
        db.close()


def main():
    """主函数"""
    print("=" * 60)
    print("将现有文件的URL从预签名URL更新为永久URL")
    print("=" * 60)
    print("\n注意：使用永久URL需要MinIO存储桶设置为公开访问")
    print("如果存储桶不是公开的，永久URL将无法访问")
    print("\n继续吗？(y/n)")

    choice = input().strip().lower()
    if choice != "y":
        print("操作已取消")
        return

    logger.info("开始更新URL...")
    updated_count = update_to_permanent_urls()

    if updated_count > 0:
        print(f"\n✅ 成功更新了 {updated_count} 个文件的URL为永久URL！")
        print("\n现在这些URL将不会过期，可以长期使用。")
        print("\n请确保MinIO存储桶已设置为公开访问，否则这些URL将无法访问。")
    else:
        print("\n⚠️ 没有文件需要更新，或者所有URL都已经是永久URL。")

    print("=" * 60)


if __name__ == "__main__":
    main()

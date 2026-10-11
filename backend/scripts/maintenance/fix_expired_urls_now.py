#!/usr/bin/env python3
"""
立即修复当前所有MinIO文件的URL过期问题
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


def fix_all_urls():
    """立即修复所有文件的URL"""
    db = SessionLocal()
    try:
        # 获取所有文件
        files = db.query(MDFile).all()
        logger.info(f"找到 {len(files)} 个文件")

        updated_count = 0
        for file in files:
            try:
                # 生成新的URL
                if file.object_name:
                    old_url = file.file_url
                    file.file_url = minio_service.get_file_url(file.object_name)

                    # 检查URL是否真的变了
                    if old_url != file.file_url:
                        updated_count += 1
                        logger.info(f"已更新文件 {file.id} ({file.title}) 的URL")
                    else:
                        logger.debug(f"文件 {file.id} ({file.title}) 的URL未变化")
            except Exception as e:
                logger.error(f"更新文件 {file.id} ({file.title}) URL时出错: {str(e)}")

        # 提交更改
        db.commit()
        logger.info(f"成功更新 {updated_count} 个文件的URL")

        return updated_count

    except Exception as e:
        logger.error(f"修复URL时出错: {str(e)}")
        db.rollback()
        return 0
    finally:
        db.close()


def main():
    """主函数"""
    print("=" * 60)
    print("立即修复所有MinIO文件的URL过期问题")
    print("=" * 60)

    logger.info("开始修复URL...")
    updated_count = fix_all_urls()

    if updated_count > 0:
        print(f"\n✅ 成功更新了 {updated_count} 个文件的URL！")
        print("现在这些URL在1小时内都是有效的。")
        print("\n💡 提示：为了一劳永逸地解决这个问题，您可以：")
        print("1. 使用后台任务定期更新URL")
        print("2. 使用系统提供的动态URL刷新功能")
        print("3. 设置MinIO存储桶为公开访问并使用永久URL")
    else:
        print("\n⚠️ 没有文件需要更新，或者所有URL都已经是最新状态。")

    print("=" * 60)


if __name__ == "__main__":
    main()

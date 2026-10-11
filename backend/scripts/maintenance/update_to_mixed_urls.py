#!/usr/bin/env python3
"""
更新数据库中的文件URL为混合访问策略格式
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


def update_to_mixed_urls():
    """将文件的URL更新为混合访问策略格式"""
    db = SessionLocal()
    try:
        # 获取所有文件
        files = db.query(MDFile).all()
        logger.info(f"找到 {len(files)} 个文件")

        updated_count = 0
        for file in files:
            try:
                # 获取当前object_name
                object_name = file.object_name

                # 检查object_name是否已经包含public或private前缀
                if object_name.startswith("public/") or object_name.startswith(
                    "private/"
                ):
                    logger.debug(f"文件 {file.id} ({file.title}) 的object_name已经是新格式，跳过")
                    continue

                # 根据文件的公开状态确定新的object_name
                new_prefix = "public/" if file.is_public else "private/"

                # 检查旧格式的object_name
                if object_name.startswith("md_files/"):
                    # 新格式：private/md_files/xxx.md 或 public/md_files/xxx.md
                    new_object_name = new_prefix + object_name
                else:
                    # 如果不是md_files开头，直接添加前缀
                    new_object_name = new_prefix + object_name

                # 生成新的URL
                if file.is_public:
                    # 公开文件使用永久URL
                    new_url = minio_service.get_file_url(
                        new_object_name, presigned=False
                    )
                else:
                    # 私有文件使用预签名URL
                    new_url = minio_service.get_file_url(
                        new_object_name, presigned=True
                    )

                # 更新数据库
                file.object_name = new_object_name
                file.file_url = new_url

                updated_count += 1
                logger.info(f"已更新文件 {file.id} ({file.title})")
                logger.debug(f"  旧object_name: {object_name}")
                logger.debug(f"  新object_name: {new_object_name}")
                logger.debug(f"  旧URL: {file.file_url[:50]}...")
                logger.debug(f"  新URL: {new_url[:50]}...")

            except Exception as e:
                logger.error(f"更新文件 {file.id} ({file.title}) 时出错: {str(e)}")

        # 提交更改
        db.commit()
        logger.info(f"成功更新 {updated_count} 个文件的URL为混合访问策略格式")

        return updated_count

    except Exception as e:
        logger.error(f"更新URL时出错: {str(e)}")
        db.rollback()
        return 0
    finally:
        db.close()


def test_mixed_access():
    """测试混合访问策略是否正常工作"""
    db = SessionLocal()
    try:
        # 获取所有文件
        files = db.query(MDFile).all()
        if not files:
            logger.info("数据库中没有文件")
            return True

        logger.info(f"找到 {len(files)} 个文件")

        public_success = 0
        public_failure = 0
        private_success = 0
        private_failure = 0

        for file in files:
            if not file.file_url:
                logger.warning(f"文件 {file.id} ({file.title}) 没有URL")
                continue

            logger.info(
                f"测试文件 {file.id} ({file.title}) - {'公开' if file.is_public else '私有'}"
            )

            try:
                # 测试URL是否可访问
                import requests

                response = requests.get(file.file_url, timeout=5)

                if file.is_public:
                    # 公开文件应该可以访问
                    if response.status_code == 200:
                        logger.info(f"✅ 公开文件 {file.title} 的URL可以访问")
                        public_success += 1
                    else:
                        logger.error(
                            f"❌ 公开文件 {file.title} 的URL无法访问，状态码: {response.status_code}"
                        )
                        public_failure += 1
                else:
                    # 私有文件使用预签名URL，应该可以访问
                    if response.status_code == 200:
                        logger.info(f"✅ 私有文件 {file.title} 的URL可以访问")
                        private_success += 1
                    else:
                        logger.error(
                            f"❌ 私有文件 {file.title} 的URL无法访问，状态码: {response.status_code}"
                        )
                        private_failure += 1
            except requests.exceptions.RequestException as e:
                logger.error(f"❌ 文件 {file.title} 的URL访问出错: {str(e)}")
                if file.is_public:
                    public_failure += 1
                else:
                    private_failure += 1

        logger.info(f"\n测试结果：")
        logger.info(f"公开文件：成功 {public_success}，失败 {public_failure}")
        logger.info(f"私有文件：成功 {private_success}，失败 {private_failure}")

        if public_failure > 0:
            logger.warning("\n部分公开文件无法访问，可能的原因：")
            logger.warning("1. MinIO存储桶策略未正确设置")
            logger.warning("2. 公开文件未正确移动到public/目录")

        if private_failure > 0:
            logger.warning("\n部分私有文件无法访问，可能的原因：")
            logger.warning("1. 私有文件未正确移动到private/目录")
            logger.warning("2. 预签名URL可能已过期")

        return public_failure == 0 and private_failure == 0

    except Exception as e:
        logger.error(f"测试过程中出错: {str(e)}")
        return False
    finally:
        db.close()


def main():
    """主函数"""
    print("=" * 60)
    print("更新数据库中的文件URL为混合访问策略格式")
    print("=" * 60)
    print("\n继续吗？(y/n)")

    choice = input().strip().lower()
    if choice != "y":
        print("操作已取消")
        return

    logger.info("开始更新URL...")
    updated_count = update_to_mixed_urls()

    if updated_count > 0:
        print(f"\n✅ 成功更新了 {updated_count} 个文件的URL为混合访问策略格式！")
        print("\n现在测试混合访问策略...")
        success = test_mixed_access()

        if success:
            print("\n🎉 混合访问策略测试成功！")
        else:
            print("\n⚠️ 混合访问策略测试部分失败，请检查MinIO配置")
    else:
        print("\n⚠️ 没有文件需要更新，或者所有文件都已经是混合访问策略格式")

    print("=" * 60)


if __name__ == "__main__":
    main()

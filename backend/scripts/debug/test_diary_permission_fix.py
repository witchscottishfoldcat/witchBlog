#!/usr/bin/env python3
"""
测试日记图片权限修复
"""

import json
import logging

from minio import Minio
from minio.error import S3Error

from app.core.config import settings
from app.core.database import get_db
from app.schemas.diary import DiaryImageCreate
from app.services.diary_service import DiaryService

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_permission_before_and_after_save():
    """测试保存前后权限状态"""
    try:
        # 创建DiaryService实例
        diary_service = DiaryService()

        # 创建MinIO客户端
        client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        bucket_name = settings.MINIO_BUCKET_NAME

        # 查询一个现有的日记进行测试
        db = next(get_db())

        # 创建一个测试日记
        from app.models.diary import Diary
        from app.schemas.diary import DiaryCreate

        test_diary_data = DiaryCreate(
            title="权限测试日记", content="这是一个用于测试图片权限的日记", is_public=True
        )

        test_diary = diary_service.create_diary(db, test_diary_data, None)
        diary_id = test_diary.id
        logger.info(f"创建测试日记，ID: {diary_id}")

        # 生成上传URL
        upload_urls = diary_service.generate_upload_urls(diary_id, None, 1)
        upload_url = upload_urls[0]
        object_name = upload_url.object_name

        logger.info(f"测试对象名称: {object_name}")

        # 检查策略状态
        try:
            current_policy_json = client.get_bucket_policy(bucket_name)
            current_policy = json.loads(current_policy_json)
            logger.info("当前策略包含的资源:")
            for statement in current_policy.get("Statement", []):
                for resource in statement.get("Resource", []):
                    if "diary-images" in resource:
                        logger.info(f"  - {resource}")
        except S3Error:
            logger.warning("没有获取到当前策略")

        # 尝试保存图片信息（但不实际上传文件）
        # 这里使用虚构的图片信息进行测试
        test_image_data = DiaryImageCreate(
            original_filename="test.jpg",
            file_size=1024,
            mime_type="image/jpeg",
            width=800,
            height=600,
        )

        # 先删除可能存在的测试图片
        try:
            client.remove_object(bucket_name, object_name)
            logger.info("删除可能存在的测试图片对象")
        except S3Error:
            pass

        # 创建一个空文件用于测试
        from io import BytesIO

        client.put_object(
            bucket_name,
            object_name,
            BytesIO(b"test"),
            len(b"test"),
            content_type="image/jpeg",
        )
        logger.info("创建测试图片对象")

        # 保存图片信息（这会触发权限验证）
        try:
            db_image = diary_service.save_diary_image(
                db, diary_id, test_image_data, object_name, None
            )
            logger.info(f"成功保存图片信息: {db_image.id}")
        except Exception as e:
            logger.error(f"保存图片信息失败: {e}")
            import traceback

            traceback.print_exc()

        # 再次检查策略状态
        try:
            current_policy_json = client.get_bucket_policy(bucket_name)
            current_policy = json.loads(current_policy_json)
            logger.info("保存后当前策略包含的资源:")
            for statement in current_policy.get("Statement", []):
                for resource in statement.get("Resource", []):
                    if "diary-images" in resource:
                        logger.info(f"  - {resource}")
        except S3Error:
            logger.warning("保存后没有获取到当前策略")

        # 清理测试数据
        try:
            client.remove_object(bucket_name, object_name)
            logger.info("清理测试图片对象")
        except S3Error:
            pass

        db.close()

    except Exception as e:
        logger.error(f"测试过程中发生错误: {e}")
        import traceback

        traceback.print_exc()


def test_permission_validation():
    """测试权限验证功能"""
    logger.info("测试DiaryService的权限验证功能...")

    # 创建DiaryService实例
    diary_service = DiaryService()

    # 测试验证一个不存在的路径
    test_object_name = "diary-images/test/permission/test.jpg"
    result = diary_service._verify_diary_image_permissions(test_object_name)
    logger.info(f"验证不存在的图片路径结果: {result}")

    # 测试确保权限
    result = diary_service._ensure_diary_image_permissions()
    logger.info(f"确保权限操作结果: {result}")


if __name__ == "__main__":
    logger.info("=== 开始测试日记图片权限修复 ===")

    # 测试权限验证功能
    logger.info("\n步骤1: 测试权限验证功能")
    test_permission_validation()

    # 测试保存前后的权限状态
    logger.info("\n步骤2: 测试保存前后的权限状态")
    test_permission_before_and_after_save()

    logger.info("\n=== 测试完成 ===")

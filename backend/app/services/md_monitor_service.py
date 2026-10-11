import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.md_file import MDFile
from app.services.md_cache_service import md_cache_service
from app.services.minio_service import minio_service

logger = logging.getLogger(__name__)


class MDMonitorService:
    """MD文件监控服务，用于监控文件变化并更新缓存"""

    def __init__(self):
        self.minio_service = minio_service
        self.cache_service = md_cache_service
        self.check_interval = 3600  # 检查间隔(秒)，默认1小时
        self.running = False

    async def start_monitoring(self):
        """启动监控任务"""
        if self.running:
            logger.warning("文件监控已在运行中")
            return

        self.running = True
        logger.info("启动MD文件监控任务")

        try:
            while self.running:
                try:
                    # 检查链路全是同步IO（DB 查询/commit + MinIO stat_object），
                    # 整体丢线程池执行，避免阻塞事件循环造成全站卡顿窗口
                    await asyncio.to_thread(self.check_file_changes)
                    await asyncio.sleep(self.check_interval)
                except Exception as e:
                    logger.error(f"文件监控任务出错: {e}")
                    await asyncio.sleep(60)  # 出错后等待1分钟再重试
        finally:
            self.running = False
            logger.info("MD文件监控任务已停止")

    def stop_monitoring(self):
        """停止监控任务"""
        self.running = False
        logger.info("请求停止MD文件监控任务")

    def check_file_changes(self):
        """检查文件变化"""
        db = SessionLocal()
        try:
            # 获取所有需要检查的MD文件
            # 优先检查最近24小时内修改的文件
            recent_time = datetime.utcnow() - timedelta(hours=24)
            md_files = db.query(MDFile).filter(MDFile.updated_at >= recent_time).all()

            # 如果最近没有修改的文件，则检查前50个文件
            if not md_files:
                md_files = db.query(MDFile).limit(50).all()

            logger.info(f"检查 {len(md_files)} 个MD文件的变化")

            changes_count = 0
            for md_file in md_files:
                if self.check_single_file(md_file, db):
                    changes_count += 1

            if changes_count > 0:
                logger.info(f"检测到 {changes_count} 个文件有变化，已更新缓存")

        except Exception as e:
            logger.error(f"检查文件变化时出错: {e}")
        finally:
            db.close()

    def check_single_file(self, md_file: MDFile, db: Session) -> bool:
        """检查单个文件是否有变化"""
        try:
            # 如果文件没有file_url，跳过检查
            if not md_file.file_url:
                return False

            # 获取MinIO中文件的当前ETag
            try:
                # 注意：这里需要MinIO服务支持获取对象元数据的功能
                # 如果MinIO服务没有提供获取ETag的方法，我们可以通过其他方式检查文件变化
                current_etag = self.get_minio_file_etag(md_file.object_name)

                # 如果ETag发生变化，使缓存失效
                if current_etag and current_etag != md_file.etag:
                    logger.info(f"文件 {md_file.id} 的ETag已变化，使缓存失效")

                    # 使缓存失效
                    self.cache_service.invalidate_cache(md_file.file_url)

                    # 更新数据库中的ETag
                    md_file.etag = current_etag
                    db.commit()

                    return True
            except Exception as e:
                logger.debug(f"获取文件 {md_file.id} 的ETag失败: {e}")
                # 如果无法获取ETag，跳过此次检查

            return False

        except Exception as e:
            logger.error(f"检查文件 {md_file.id} 变化时出错: {e}")
            return False

    def get_minio_file_etag(self, object_name: str) -> Optional[str]:
        """获取MinIO中文件的ETag"""
        try:
            # 这里需要使用MinIO客户端获取对象元数据
            # 由于MinIO服务类可能没有直接提供此功能，我们需要扩展或实现
            # 暂时使用一个模拟实现

            # 注意：实际实现需要根据MinIO服务的具体API来获取ETag
            # 这里只是示例代码
            try:
                # 假设MinIOService有一个get_object_metadata方法
                metadata = self.minio_service.client.stat_object(
                    bucket_name=self.minio_service.bucket_name, object_name=object_name
                )
                return metadata.etag
            except Exception as e:
                logger.debug(f"获取对象 {object_name} 元数据失败: {e}")
                return None
        except Exception as e:
            logger.error(f"获取MinIO文件ETag时出错: {e}")
            return None

    def invalidate_cache_on_update(self, file_id: int, db: Session) -> bool:
        """在更新文件时使缓存失效"""
        try:
            # 获取文件信息
            md_file = db.query(MDFile).filter(MDFile.id == file_id).first()
            if not md_file:
                logger.warning(f"文件 {file_id} 不存在，无法使缓存失效")
                return False

            # 使MD文件内容缓存失效
            if md_file.file_url:
                result = self.cache_service.invalidate_cache(md_file.file_url)
                if result:
                    logger.info(f"文件 {file_id} 更新后，MD缓存已失效")

            # 清除RSS缓存（如果文件是公开的）
            if md_file.is_public:
                try:
                    from app.services.rss import rss_service

                    rss_service.clear_cache()
                    logger.info(f"文件 {file_id} 更新后，RSS缓存已清除")
                except Exception as rss_error:
                    logger.error(f"清除RSS缓存失败: {rss_error}")

            return True

        except Exception as e:
            logger.error(f"文件 {file_id} 更新后使缓存失效时出错: {e}")
            return False

    def invalidate_cache_on_delete(self, file_url: Optional[str]) -> bool:
        """在删除文件时使缓存失效"""
        try:
            if not file_url:
                return True  # 如果没有file_url，不需要使缓存失效

            # 使MD文件内容缓存失效
            result = self.cache_service.invalidate_cache(file_url)
            if result:
                logger.info(f"文件删除后，MD缓存已失效: {file_url}")

            # 清除RSS缓存（无论文件是否公开，都清除RSS缓存以保持一致性）
            try:
                from app.services.rss import rss_service

                rss_service.clear_cache()
                logger.info("文件删除后，RSS缓存已清除")
            except Exception as rss_error:
                logger.error(f"清除RSS缓存失败: {rss_error}")

            return result

        except Exception as e:
            logger.error(f"文件删除后使缓存失效时出错: {e}")
            return False


# 创建全局监控服务实例
md_monitor_service = MDMonitorService()


# 装饰器函数，用于在文件更新时自动使缓存失效
def invalidate_cache_on_file_update(file_id: int, db: Session):
    """在文件更新时自动使缓存失效"""
    md_monitor_service.invalidate_cache_on_update(file_id, db)


# 装饰器函数，用于在文件删除时自动使缓存失效
def invalidate_cache_on_file_delete(file_url: Optional[str]):
    """在文件删除时自动使缓存失效"""
    md_monitor_service.invalidate_cache_on_delete(file_url)

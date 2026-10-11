"""
MinIO URL 刷新定时任务

定期将数据库中 MinIO 文件的访问 URL 收敛为稳定的代理 URL，
同时清理历史遗留的预签名 / OSS 直链地址。
"""

from app.core.unified_logging import get_logger

logger = get_logger(__name__)

# 每批处理的文件数；任务按 id 游标分批，确保遍历全部文件而非重复刷新前 N 条
URL_REFRESH_BATCH_SIZE = 100


def refresh_minio_urls():
    """刷新 MinIO 文件 URL（按 id 游标分批遍历全部文件）"""
    from app.core.database import SessionLocal
    from app.models.md_file import MDFile
    from app.services.minio_service import minio_service

    db = SessionLocal()
    updated = 0
    failed = 0
    try:
        cursor_id = 0
        while True:
            batch = (
                db.query(MDFile)
                .filter(MDFile.object_name.isnot(None), MDFile.id > cursor_id)
                .order_by(MDFile.id)
                .limit(URL_REFRESH_BATCH_SIZE)
                .all()
            )
            if not batch:
                break

            for f in batch:
                try:
                    new_url = minio_service.get_file_url(f.object_name)
                    if f.file_url != new_url:
                        f.file_url = new_url
                        updated += 1
                except Exception as e:
                    failed += 1
                    logger.warning(f"更新文件 {f.id} URL 失败: {e}")

            cursor_id = batch[-1].id
            db.commit()

        logger.info(f"MinIO URL 刷新完成: 更新 {updated} 个文件, 失败 {failed} 个")
        return updated
    except Exception as e:
        db.rollback()
        logger.error(f"MinIO URL 刷新失败: {e}")
        return 0
    finally:
        db.close()

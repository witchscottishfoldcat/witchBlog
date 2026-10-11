"""MD缓存批量刷新服务：短 session 元数据读写 + 线程池回源编排。

批量回源 MinIO 属于慢操作，统一采用「短 session 取元数据 → 线程池回源 →
短 session 写回结果」的模式，既不长时间占用 DB 连接（QueuePool 耗尽问题），
也不阻塞事件循环（路由层见 app/api/v1/md_cache_simple.py）。
"""
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import sessionmaker
from starlette.concurrency import run_in_threadpool

from app.core.database import engine
from app.core.storage_paths import MD_PROXY_URL_PREFIX
from app.core.unified_logging import get_logger
from app.models.md_file import MDFile
from app.services.md_cache_service import md_cache_service

logger = get_logger(__name__)

# 批量接口专用短 session：expire_on_commit=False 保证 commit/detach 后
# ORM 对象的已加载属性仍可在线程池中直接访问
_BatchSessionLocal = sessionmaker(
    bind=engine, autocommit=False, autoflush=False, expire_on_commit=False
)


def load_md_files(file_ids: Optional[List[int]] = None) -> List[MDFile]:
    """短 session 加载 MD 文件元数据，返回 detached 对象（连接已释放）。"""
    db = _BatchSessionLocal()
    try:
        query = db.query(MDFile)
        if file_ids:
            query = query.filter(MDFile.id.in_(file_ids))
        return query.all()
    finally:
        db.close()


def apply_proxy_urls(file_ids: List[int]) -> int:
    """短 session 批量写回 proxy_url，返回更新条数。"""
    if not file_ids:
        return 0
    db = _BatchSessionLocal()
    try:
        rows = db.query(MDFile).filter(MDFile.id.in_(file_ids)).all()
        for row in rows:
            row.proxy_url = f"{MD_PROXY_URL_PREFIX}{row.id}"
        db.commit()
        return len(rows)
    except Exception as e:
        db.rollback()
        logger.error(f"写回 proxy_url 失败: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="更新数据库失败，请查看服务端日志")
    finally:
        db.close()


def clear_proxy_urls() -> int:
    """短 session 清空所有 proxy_url 字段，返回清空条数。"""
    db = _BatchSessionLocal()
    try:
        rows = db.query(MDFile).filter(MDFile.proxy_url.isnot(None)).all()
        for row in rows:
            row.proxy_url = None
        db.commit()
        return len(rows)
    except Exception as e:
        db.rollback()
        logger.error(f"清空 proxy_url 失败: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="更新数据库失败，请查看服务端日志")
    finally:
        db.close()


def fetch_and_cache_batch(files: List[MDFile], force: bool = False) -> dict:
    """同步回源循环（在线程池中执行）：逐文件清缓存（可选）+ 下载 + 本地缓存。

    返回 {file_id: title} 形式的成功清单和失败明细。
    """
    succeeded = {}
    failed = []
    for md_file in files:
        try:
            if force and md_file.file_url:
                md_cache_service.invalidate_cache(md_file.file_url)
            content = md_cache_service.fetch_and_cache(md_file)
            if content is not None:
                succeeded[md_file.id] = md_file.title
            else:
                failed.append(
                    {
                        "id": md_file.id,
                        "title": md_file.title,
                        "status": "failed",
                        "reason": "无法从OSS/MinIO获取文件内容",
                    }
                )
        except Exception as e:
            failed.append(
                {
                    "id": md_file.id,
                    "title": md_file.title,
                    "status": "failed",
                    "reason": type(e).__name__,
                }
            )
            logger.error(
                f"处理文件异常: {md_file.title} (ID: {md_file.id}), "
                f"错误: {type(e).__name__}: {e}"
            )
    return {"succeeded": succeeded, "failed": failed}


def invalidate_all_caches(files: List[MDFile]) -> int:
    """逐文件清理本地缓存（在线程池中执行），返回清理成功条数。"""
    count = 0
    for md_file in files:
        try:
            if md_file.file_url and md_cache_service.invalidate_cache(md_file.file_url):
                count += 1
        except Exception as e:
            logger.error(f"清理缓存失败: {md_file.title}, 错误: {type(e).__name__}: {e}")
    return count


def list_file_records(db) -> List[dict]:
    """列出全部 MD 文件的存储路径信息（含私有文件，调用方须自鉴权）。"""
    all_files = db.query(MDFile).all()
    return [
        {
            "id": file.id,
            "title": file.title,
            "file_url": file.file_url,
            "proxy_url": file.proxy_url,
        }
        for file in all_files
    ]


# 便捷异步包装：路由层统一经由线程池执行同步 DB/磁盘操作
async def load_md_files_async(file_ids: Optional[List[int]] = None) -> List[MDFile]:
    return await run_in_threadpool(load_md_files, file_ids)


async def apply_proxy_urls_async(file_ids: List[int]) -> int:
    return await run_in_threadpool(apply_proxy_urls, file_ids)


async def clear_proxy_urls_async() -> int:
    return await run_in_threadpool(clear_proxy_urls)


async def fetch_and_cache_batch_async(files: List[MDFile], force: bool = False) -> dict:
    return await run_in_threadpool(fetch_and_cache_batch, files, force)


async def invalidate_all_caches_async(files: List[MDFile]) -> int:
    return await run_in_threadpool(invalidate_all_caches, files)


async def list_file_records_async(db) -> List[dict]:
    return await run_in_threadpool(list_file_records, db)

"""
MD缓存简化刷新接口 - 合并了MD缓存刷新功能

批量回源的短 session 编排与数据访问见 app/services/md_cache_batch_service.py。
"""
from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_active_superuser, get_db
from app.core.storage_paths import MD_PROXY_URL_PREFIX
from app.core.unified_logging import get_logger
from app.models.user import User
from app.services import md_cache_batch_service as batch_service
from app.services.md_cache_service import md_cache_service

logger = get_logger(__name__)
router = APIRouter()


@router.post("/refresh-all")
async def refresh_all_md_cache(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    一键刷新所有MD文件缓存：
    1. 从数据库获取所有MD文件的OSS路径
    2. 从OSS下载文件内容并缓存到本地
    3. 更新proxy_url字段

    返回：
    - 处理结果统计
    """
    all_files = await batch_service.load_md_files_async()
    logger.info(f"从数据库获取到 {len(all_files)} 个MD文件记录")

    if not all_files:
        return {"message": "数据库中没有MD文件记录", "total_files": 0, "success_count": 0}

    result = await batch_service.fetch_and_cache_batch_async(all_files)
    success_count = len(result["succeeded"])
    for title in result["succeeded"].values():
        logger.info(f"✓ 成功处理文件: {title}")
    for item in result["failed"]:
        logger.error(f"✗ 处理失败: {item['title']}")

    await batch_service.apply_proxy_urls_async(list(result["succeeded"].keys()))

    return {
        "message": "MD文件缓存刷新完成",
        "total_files": len(all_files),
        "success_count": success_count,
    }


@router.post("/clear-all")
async def clear_all_md_cache(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    清空所有MD文件缓存和proxy_url字段：
    1. 直接删除所有缓存文件
    2. 清空数据库中的proxy_url字段

    返回：
    - 处理结果统计
    """
    # 1. 直接删除所有缓存文件（磁盘IO，放线程池）
    logger.info("开始清理所有缓存文件...")
    cache_cleaned_count = await run_in_threadpool(md_cache_service.clean_all_cache)
    logger.info(f"成功清理了 {cache_cleaned_count} 个缓存文件")

    # 2. 清空数据库中的proxy_url字段（短 session）
    all_files = await batch_service.load_md_files_async()
    if not all_files:
        return {
            "message": "数据库中没有MD文件记录",
            "total_files": 0,
            "cache_cleaned": cache_cleaned_count,
            "db_cleared": 0,
        }

    db_cleared_count = await batch_service.clear_proxy_urls_async()
    logger.info(f"成功清空 {db_cleared_count} 个文件的proxy_url字段")

    return {
        "message": "MD文件缓存和proxy_url字段清空完成",
        "cache_cleaned": cache_cleaned_count,
        "db_cleared": db_cleared_count,
        "total_files": len(all_files),
    }


@router.post("/force-refresh-all")
async def force_refresh_all_md_cache(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    强制重新下载所有MD文件（解决编码问题）：
    1. 从数据库获取所有MD文件的OSS路径
    2. 清除现有缓存
    3. 从OSS重新下载文件内容并缓存到本地
    4. 更新proxy_url字段

    返回：
    - 处理结果统计
    """
    all_files = await batch_service.load_md_files_async()
    logger.info(f"从数据库获取到 {len(all_files)} 个MD文件记录")

    if not all_files:
        return {"message": "数据库中没有MD文件记录", "total_files": 0, "success_count": 0}

    result = await batch_service.fetch_and_cache_batch_async(all_files, force=True)
    success_count = len(result["succeeded"])
    for title in result["succeeded"].values():
        logger.info(f"✓ 成功强制处理文件: {title}")
    for item in result["failed"]:
        logger.error(f"✗ 强制处理失败: {item['title']}")

    await batch_service.apply_proxy_urls_async(list(result["succeeded"].keys()))

    return {
        "message": "MD文件缓存强制刷新完成（已重新下载所有文件）",
        "total_files": len(all_files),
        "success_count": success_count,
    }


@router.post("/refresh-cache")
async def refresh_md_cache(
    file_ids: List[int] = Body(default=[], description="要刷新缓存的MD文件ID列表，如果为空则刷新所有文件"),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    刷新指定MD文件缓存 - 从OSS/MinIO重新拉取文件内容并写入缓存

    参数：
    - file_ids: 要刷新缓存的MD文件ID列表，如果为空则刷新所有文件

    返回：
    - 刷新结果统计
    """
    all_files = await batch_service.load_md_files_async(file_ids or None)
    if file_ids:
        logger.info(f"根据提供的ID列表查询到 {len(all_files)} 个MD文件")
    else:
        logger.info(f"查询到 {len(all_files)} 个MD文件，将刷新所有文件的缓存")

    logger.info(f"开始处理 {len(all_files)} 个文件的缓存刷新")

    result = await batch_service.fetch_and_cache_batch_async(all_files)

    refreshed_files = [
        {
            "id": file_id,
            "title": title,
            "status": "success",
            "new_proxy_url": f"{MD_PROXY_URL_PREFIX}{file_id}",
        }
        for file_id, title in result["succeeded"].items()
    ]
    failed_files = result["failed"]

    await batch_service.apply_proxy_urls_async(list(result["succeeded"].keys()))

    return {
        "message": "缓存刷新完成",
        "total_files": len(all_files),
        "success_count": len(refreshed_files),
        "failed_count": len(failed_files),
        "refreshed_files": refreshed_files,
        "failed_files": failed_files,
    }


@router.post("/clear-cache")
async def clear_md_cache(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    清空所有MD文件缓存

    返回：
    - 清空结果统计
    """
    # 获取所有已缓存的文件（磁盘IO，放线程池）
    cache_stats = await run_in_threadpool(md_cache_service.get_cache_stats)

    if "error" in cache_stats:
        raise HTTPException(status_code=500, detail="获取缓存信息失败")

    file_count = cache_stats.get("file_count", 0)

    # 清理所有缓存文件
    await run_in_threadpool(md_cache_service.clean_expired_cache)

    # 获取所有MD文件并清理其缓存
    all_files = await batch_service.load_md_files_async()
    cleared_files = await batch_service.invalidate_all_caches_async(all_files)
    db_cleared = await batch_service.clear_proxy_urls_async()

    return {
        "message": "缓存清空完成",
        "original_cache_count": file_count,
        "cleaned_files": cleared_files,
        "db_cleared": db_cleared,
        "total_cleared": cleared_files,
    }


@router.get("/list-files")
async def list_md_files(
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    列出所有MD文件信息（含私有文件的存储路径，仅超级管理员）

    返回：
    - MD文件列表
    """
    try:
        file_list = await batch_service.list_file_records_async(db)
        return {"total_files": len(file_list), "files": file_list}
    except Exception as e:
        logger.error(f"获取MD文件列表时出错: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="内部服务器错误")

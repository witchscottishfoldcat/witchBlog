"""
代理路由 - 解决前端跨域获取图片和MD文件的问题
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, sessionmaker

from app.api.deps import get_current_active_superuser, get_current_user_optional
from app.core.database import engine, get_db
from app.core.exceptions import NotFoundException
from app.core.storage_paths import MD_PROXY_URL_PREFIX
from app.core.unified_logging import get_logger
from app.models.user import User
from app.services import image_proxy_service
from app.services.image_cache_service import image_cache_service, is_object_allowed
from app.services.image_proxy_service import fetch_image
from app.services.md_cache_service import md_cache_service
from app.services.md_file import MDFileService
from app.services.oss_access_service import check_oss_object_access

# MD 代理专用短 session：expire_on_commit=False 保证 commit 后 ORM 对象属性
# 仍可直接访问，从而可以在关闭连接后用 detached 对象继续走 MinIO 回源/缓存，
# 避免长占 DB 连接（修复 QueuePool 耗尽）。
_MDProxySessionLocal = sessionmaker(
    bind=engine, autocommit=False, autoflush=False, expire_on_commit=False
)

logger = get_logger(__name__)
router = APIRouter()

# 图片抓取核心（SSRF 防护 + 大小限制 + 内容类型校验）已收敛到服务层，
# 此处以模块属性形式保留旧名称，兼容旧调用方和测试的导入。
PROXY_MAX_CONTENT_BYTES = image_proxy_service.PROXY_MAX_CONTENT_BYTES
PROXY_TIMEOUT_SECONDS = image_proxy_service.PROXY_TIMEOUT_SECONDS
fetch_with_size_limit = image_proxy_service.fetch_with_size_limit
_fetch_with_size_limit = image_proxy_service.fetch_with_size_limit


@router.get("/image")
async def proxy_image(
    url: str = Query(..., description="要代理的图片URL"),
    width: Optional[int] = Query(None, description="可选的图片宽度"),
    height: Optional[int] = Query(None, description="可选的图片高度"),
):
    """
    代理获取图片，解决前端跨域问题

    使用方式:
    前端: <img src="/api/proxy/image?url=<图片URL>" />

    参数:
    - url: 要代理的图片URL（必需）
    - width: 可选的图片宽度
    - height: 可选的图片高度
    """
    content, content_type = await fetch_image(url)

    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",  # 缓存一天
            "Access-Control-Allow-Origin": "*",  # 允许跨域访问
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*",
        },
    )


@router.get("/thumbnail")
async def create_thumbnail(
    url: str = Query(..., description="原始图片URL"),
    width: int = Query(300, description="缩略图宽度", ge=10, le=1000),
    height: int = Query(300, description="缩略图高度", ge=10, le=1000),
):
    """
    创建缩略图（需要安装Pillow库）
    使用方式: /api/proxy/thumbnail?url=https://example.com/large.jpg&width=200&height=200
    """
    # 缩略图生成尚未接入 Pillow，当前返回原图（保留与历史一致的空 content-type 默认值）
    content, content_type = await fetch_image(url, default_content_type="")

    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/md/{file_id}")
async def proxy_md_file(
    file_id: int,
    force_refresh: bool = Query(False, description="是否强制刷新缓存"),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    代理获取MD文件内容，通过缓存加速访问

    参数：
    - file_id: MD文件的ID
    - force_refresh: 是否强制刷新缓存

    权限：匿名用户仅可获取公开文件（is_public=True）；
    登录用户可获取自己的文件，超级管理员可获取任意文件。
    无权访问时统一返回 404，避免泄露文件是否存在。

    注意：本接口用独立短 session 查元数据，查完立即归还连接；
    后续 MinIO 回源 / 缓存读取不再占用 DB 连接，避免高并发下
    MinIO 慢回源拖垮数据库连接池（QueuePool 耗尽）。
    """
    logger.info(f"收到MD文件代理请求: file_id={file_id}, force_refresh={force_refresh}")

    try:
        # 用独立短 session 查询文件元数据，提取后续所需的字段后立即关闭连接。
        # 这样后续耗时的 MinIO 回源/缓存读取不再占用 DB 连接。
        logger.info(f"开始获取MD文件信息: file_id={file_id}")
        md_file_service = MDFileService()
        db = _MDProxySessionLocal()
        try:
            # 回源用 object_name 直连 MinIO，既省一次 MinIO 调用，
            # 又避免 commit 导致 ORM 对象 expire（不刷新预签名 URL）
            md_file = md_file_service.get_file(
                db, file_id, user_id=None, refresh_url=False, check_permission=False
            )
            # 访问控制：私有文件仅 owner / 超级管理员可读
            if not md_file.is_public:
                is_owner = (
                    current_user is not None and md_file.owner_id == current_user.id
                )
                is_superuser = current_user is not None and bool(
                    current_user.is_superuser
                )
                if not (is_owner or is_superuser):
                    requester = current_user.username if current_user else "anonymous"
                    logger.warning(
                        f"拒绝访问私有MD文件: file_id={file_id}, " f"requester={requester}"
                    )
                    raise HTTPException(
                        status_code=404, detail=f"文件 {file_id} 不存在或无权访问"
                    )
            # 提取后续需要的字段（脱离 session 后这些纯数据仍可用）
            need_update_proxy_url = not md_file.proxy_url
            logger.info(
                f"成功获取MD文件信息: id={md_file.id}, "
                f"title={md_file.title}, file_url={md_file.file_url}"
            )
        finally:
            db.close()

        # 从缓存获取文件内容
        # md_cache_service.get_content 含同步磁盘IO与MinIO SDK同步调用，
        # 放到线程池执行避免阻塞事件循环
        logger.info(f"开始获取文件内容: force_refresh={force_refresh}")
        from starlette.concurrency import run_in_threadpool

        content = await run_in_threadpool(
            md_cache_service.get_content, md_file, force_refresh=force_refresh
        )

        if content is None:
            logger.error(f"无法获取MD文件内容: file_id={file_id}")
            raise HTTPException(status_code=500, detail="无法获取文件内容")

        logger.info(f"成功获取文件内容: length={len(content)} bytes")

        # 更新文件的proxy_url字段（如果尚未设置）：用独立短 session，避免长占连接
        if need_update_proxy_url:
            try:
                proxy_url = f"{MD_PROXY_URL_PREFIX}{file_id}"
                db = _MDProxySessionLocal()
                try:
                    md_file_service.set_proxy_url(db, file_id, proxy_url)
                    logger.info(f"更新MD文件 {file_id} 的代理URL: {proxy_url}")
                finally:
                    db.close()
            except Exception:
                logger.exception(f"更新MD文件代理URL时出错: file_id={file_id}")

        # 返回文件内容
        logger.info(
            f"准备返回文件响应: file_id={file_id}, "
            f"content_length={len(content) if content else 0}"
        )

        # 确保内容是正确的UTF-8编码
        if isinstance(content, str):
            content_bytes = content.encode("utf-8")
        else:
            content_bytes = content

        # 构建响应，不设置Content-Disposition头部以避免编码问题
        response = Response(
            content=content_bytes,
            media_type="text/markdown; charset=utf-8",
            headers={
                "Cache-Control": "public, max-age=3600",  # 缓存1小时
                "Access-Control-Allow-Origin": "*",  # 允许跨域访问
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
            },
        )

        logger.info(f"成功返回文件响应: file_id={file_id}")
        return response

    except NotFoundException as e:
        logger.warning(f"MD文件不存在: file_id={file_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        import traceback

        logger.error(f"代理MD文件时出错: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="内部服务器错误")


@router.get("/md/{file_id}/invalidate")
async def invalidate_md_cache(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    使MD文件的缓存失效

    参数:
    - file_id: MD文件的ID
    """
    try:
        # 获取MD文件信息
        md_file_service = MDFileService()
        md_file = md_file_service.get_file(db, file_id, user_id=current_user.id)

        if not md_file:
            raise HTTPException(status_code=404, detail="MD文件不存在")

        # 使缓存失效
        if md_file.file_url and md_cache_service.invalidate_cache(md_file.file_url):
            return {"message": "缓存已成功失效"}
        else:
            raise HTTPException(status_code=500, detail="失效缓存失败")

    except NotFoundException as e:
        logger.warning(f"MD文件不存在: file_id={file_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        import traceback

        logger.error(f"失效MD文件缓存时出错: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="内部服务器错误")


@router.get("/md/stats")
async def get_cache_stats(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    获取缓存统计信息
    """
    try:
        stats = md_cache_service.get_cache_stats()
        return stats
    except Exception as e:
        logger.error(f"获取缓存统计信息时出错: {e}")
        raise HTTPException(status_code=500, detail="内部服务器错误")


@router.post("/md/clean")
async def clean_expired_cache(
    current_user: User = Depends(get_current_active_superuser),
):
    """
    清理过期的缓存文件
    """
    try:
        cleaned_count = md_cache_service.clean_expired_cache()
        return {"message": f"已清理 {cleaned_count} 个过期缓存文件"}
    except Exception as e:
        logger.error(f"清理过期缓存时出错: {e}")
        raise HTTPException(status_code=500, detail="内部服务器错误")


# ==================== OSS 图片代理 ====================
# 隐藏 OSS 直链地址：前端拿到的图片 URL 均指向本端点，
# 由后端用服务端凭证从 OSS 拉取并流式返回，配合本地磁盘缓存。
# 记录级访问控制（公开/私有判定）见 app/services/oss_access_service.py。


@router.get("/oss/{object_name:path}")
async def proxy_oss_object(
    object_name: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    代理获取 OSS（MinIO）对象，隐藏 OSS 真实地址

    使用方式:
    前端: <img src="http://后端/api/v1/proxy/oss/diary-imagesV2/xxx.jpg" />

    参数:
    - object_name: OSS 对象名（支持包含多级路径）
    """
    # 校验白名单，防止任意读取 OSS 对象
    if not is_object_allowed(object_name):
        logger.warning(f"OSS 代理拒绝非法 object_name: {object_name}")
        raise HTTPException(status_code=403, detail="禁止访问的对象")

    # 记录级访问控制：私有对象仅 owner / 超级管理员可读
    if not check_oss_object_access(db, object_name, current_user):
        logger.warning(
            f"OSS 代理拒绝无权访问的对象: {object_name}, "
            f"requester={current_user.username if current_user else 'anonymous'}"
        )
        # 统一 404，避免泄露对象是否存在
        raise HTTPException(status_code=404, detail="对象不存在或无权访问")

    try:
        # 同步拉取在阻塞线程中完成，这里用 run_in_threadpool 避免阻塞事件循环
        from starlette.concurrency import run_in_threadpool

        result = await run_in_threadpool(image_cache_service.get_content, object_name)
        if result is None:
            raise HTTPException(status_code=404, detail="对象不存在或获取失败")

        data, content_type = result

        return Response(
            content=data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=86400",  # 浏览器/CDN 缓存 1 天
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
                "Cross-Origin-Resource-Policy": "cross-origin",
            },
        )
    except HTTPException:
        raise
    except Exception:
        import traceback

        logger.error(f"代理 OSS 对象出错: {object_name}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="内部服务器错误")


@router.post("/oss/clean")
async def clean_expired_image_cache(
    current_user: User = Depends(get_current_active_superuser),
):
    """清理过期的图片缓存"""
    try:
        cleaned_count = image_cache_service.clean_expired_cache()
        return {"message": f"已清理 {cleaned_count} 个过期图片缓存文件"}
    except Exception as e:
        logger.error(f"清理过期图片缓存时出错: {e}")
        raise HTTPException(status_code=500, detail="内部服务器错误")


@router.get("/oss-stats")
async def get_image_cache_stats(
    current_user: User = Depends(get_current_active_superuser),
):
    """获取图片缓存统计信息"""
    try:
        return image_cache_service.get_cache_stats()
    except Exception as e:
        logger.error(f"获取图片缓存统计信息时出错: {e}")
        raise HTTPException(status_code=500, detail="内部服务器错误")

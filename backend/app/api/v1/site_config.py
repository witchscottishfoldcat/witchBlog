from typing import List

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_current_active_user, get_db
from app.core.config import settings
from app.core.unified_logging import get_logger
from app.core.uploads import ensure_upload_size
from app.models.user import User
from app.schemas.site_config import (
    SiteConfig,
    SiteConfigCreate,
    SiteConfigPublic,
    SiteConfigUpdate,
)
from app.services.minio_service import MinIOService, to_proxy_url
from app.services.site_config import _rewrite_config_urls, site_config_service

logger = get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=List[SiteConfig])
def read_site_configs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取所有站点配置（需要认证）"""
    configs = site_config_service.get_all_site_configs(db, skip=skip, limit=limit)
    # 返回前将 OSS 直链改写为代理 URL（历史数据兼容）
    return [_rewrite_config_urls(c) for c in configs]


@router.get("/active", response_model=SiteConfig)
def read_active_site_config(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """获取当前激活的站点配置（需要认证）"""
    config = site_config_service.get_active_site_config(db)
    if not config:
        raise HTTPException(status_code=404, detail="未找到激活的站点配置")
    return _rewrite_config_urls(config)


@router.get("/public", response_model=SiteConfigPublic)
def read_public_site_config(request: Request, db: Session = Depends(get_db)):
    """获取公开的站点配置信息（不需要认证）"""
    config = site_config_service.get_public_site_config(db)
    if not config:
        # 返回默认配置
        return SiteConfigPublic(
            site_name="WitchCat",
            site_signature=None,
            site_announcement=None,
            site_icon=None,
            profile_image=None,
            rss_url=f"{request.url.scheme}://{request.url.netloc}/rss/feed",
        )
    return SiteConfigPublic(
        site_name=config.site_name,
        site_signature=config.site_signature,
        site_announcement=config.site_announcement,
        site_icon=to_proxy_url(config.site_icon),
        profile_image=to_proxy_url(config.profile_image),
        rss_url=f"{request.url.scheme}://{request.url.netloc}/rss/feed",
    )


@router.post("/revalidate-frontend")
async def revalidate_frontend_cache(
    current_user: User = Depends(get_current_active_superuser),
):
    """通知前台（Next.js）清除站点配置相关缓存（需要超级管理员）

    后台保存站点配置后调用。前台入口为 POST /api/site-config/revalidate，
    密钥从环境变量读取（FRONTEND_REVALIDATE_SECRET 须与前台的
    REVALIDATE_SECRET 一致），不会出现在任何接口响应中。
    """
    if not settings.FRONTEND_BASE_URL or not settings.FRONTEND_REVALIDATE_SECRET:
        raise HTTPException(
            status_code=400,
            detail="未配置 FRONTEND_BASE_URL / FRONTEND_REVALIDATE_SECRET，无法刷新前台缓存",
        )

    url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/api/site-config/revalidate"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url, json={"secret": settings.FRONTEND_REVALIDATE_SECRET}
            )
    except httpx.HTTPError as e:
        logger.error(f"调用前台缓存刷新失败（网络错误）: {e}")
        raise HTTPException(status_code=502, detail="调用前台缓存刷新失败（网络错误）")

    if resp.status_code != 200:
        logger.error(f"前台缓存刷新返回异常状态: HTTP {resp.status_code}")
        raise HTTPException(
            status_code=502,
            detail=(
                f"前台缓存刷新失败（HTTP {resp.status_code}），"
                "请检查 FRONTEND_REVALIDATE_SECRET 是否与前台的 REVALIDATE_SECRET 一致"
            ),
        )

    logger.info(f"前台站点配置缓存刷新成功: {url}")
    return resp.json()


@router.post("/", response_model=SiteConfig)
def create_site_config(
    config_in: SiteConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建新的站点配置（需要认证）"""
    config = site_config_service.create_site_config(db, obj_in=config_in)
    return _rewrite_config_urls(config)


@router.put("/{config_id}", response_model=SiteConfig)
def update_site_config(
    config_id: int,
    config_in: SiteConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新站点配置（需要认证）"""
    config = site_config_service.get_site_config(db, config_id=config_id)
    if not config:
        raise HTTPException(status_code=404, detail="站点配置不存在")

    config = site_config_service.update_site_config(db, db_obj=config, obj_in=config_in)
    return _rewrite_config_urls(config)


@router.delete("/{config_id}", response_model=dict)
def delete_site_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除站点配置（需要认证）"""
    success = site_config_service.delete_site_config(db, config_id=config_id)
    if not success:
        raise HTTPException(status_code=404, detail="站点配置不存在")

    return {"detail": "站点配置已删除"}


@router.post("/{config_id}/upload-icon", response_model=dict)
def upload_site_icon(
    config_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """上传站点图标（需要认证）"""
    ensure_upload_size(file)

    # 验证文件类型
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只能上传图片文件")

    # 使用 Pillow 校验文件内容是否为真实图片
    file_data = file.file.read()
    file.file.seek(0)
    is_valid, _, _ = MinIOService.validate_image_content(file_data)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="文件内容不是有效图片或格式不被支持（仅允许 JPEG/PNG/GIF/WEBP/BMP）",
        )

    # 上传图片
    url = site_config_service.upload_site_icon(db, config_id=config_id, file=file)
    if not url:
        raise HTTPException(status_code=404, detail="站点配置不存在")

    return {"detail": "站点图标上传成功", "url": url}


@router.post("/{config_id}/upload-profile", response_model=dict)
def upload_profile_image(
    config_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """上传个人头像（需要认证）"""
    ensure_upload_size(file)

    # 验证文件类型
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只能上传图片文件")

    # 使用 Pillow 校验文件内容是否为真实图片
    file_data = file.file.read()
    file.file.seek(0)
    is_valid, _, _ = MinIOService.validate_image_content(file_data)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="文件内容不是有效图片或格式不被支持（仅允许 JPEG/PNG/GIF/WEBP/BMP）",
        )

    # 上传图片
    url = site_config_service.upload_profile_image(db, config_id=config_id, file=file)
    if not url:
        raise HTTPException(status_code=404, detail="站点配置不存在")

    return {"detail": "个人头像上传成功", "url": url}

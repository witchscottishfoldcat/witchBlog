from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_db
from app.core.unified_logging import get_logger
from app.core.uploads import ensure_upload_size
from app.models.user import User
from app.schemas.link import (
    DEFAULT_LINK_CATEGORY,
    Link,
    LinkCategoryStats,
    LinkCreate,
    LinkImageUploadResponse,
    LinkList,
    LinkUpdate,
    normalize_category,
)
from app.services.link import LinkService, _rewrite_link_image_url

logger = get_logger(__name__)


def _validate_category_or_400(category: str) -> str:
    """路径/查询参数中的分类校验：非法分类返回 400"""
    try:
        return normalize_category(category)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


router = APIRouter()


@router.get("/", response_model=List[Link])
async def get_links(
    category: Optional[str] = Query(
        None, description="链接分类（内置: friend, video, other；支持自定义分类）"
    ),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(100, ge=1, le=1000, description="返回数量"),
    sort_by: str = Query(
        "sort_order", description="排序方式: sort_order, created_at, name"
    ),
    db: Session = Depends(get_db),
):
    """获取链接列表"""
    service = LinkService(db)
    links = service.get_links(
        category=category,
        is_active=is_active,
        tags=tags,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
    )
    return [_rewrite_link_image_url(link) for link in links]


@router.get("/list", response_model=LinkList)
async def get_links_paginated(
    category: Optional[str] = Query(
        None, description="链接分类（内置: friend, video, other；支持自定义分类）"
    ),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    sort_by: str = Query(
        "sort_order", description="排序方式: sort_order, created_at, name"
    ),
    db: Session = Depends(get_db),
):
    """分页获取链接列表"""
    service = LinkService(db)
    skip = (page - 1) * size

    links = service.get_links(
        category=category,
        is_active=is_active,
        tags=tags,
        skip=skip,
        limit=size,
        sort_by=sort_by,
    )

    total = service.count_links(category=category, is_active=is_active, tags=tags)

    pages = (total + size - 1) // size

    return {
        "items": [_rewrite_link_image_url(link) for link in links],
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }


# 注意：单段字面量路由（/random）必须声明在 /{link_id} 之前，
# 否则会被路径参数路由遮蔽，导致 HTTP 层永远 422（link_id int 解析失败）
@router.get("/random/{category}", response_model=List[Link])
async def get_random_links_by_category(
    category: str,
    limit: int = Query(5, ge=1, le=50, description="返回数量"),
    db: Session = Depends(get_db),
):
    """根据分类随机获取链接"""
    category = _validate_category_or_400(category)

    service = LinkService(db)
    return [
        _rewrite_link_image_url(link)
        for link in service.get_random_links(category=category, limit=limit)
    ]


@router.get("/random", response_model=List[Link])
async def get_random_links(
    category: Optional[str] = Query(
        None, description="链接分类（内置: friend, video, other；支持自定义分类）"
    ),
    limit: int = Query(5, ge=1, le=50, description="返回数量"),
    db: Session = Depends(get_db),
):
    """随机获取链接"""
    if category:
        category = _validate_category_or_400(category)

    service = LinkService(db)
    return [
        _rewrite_link_image_url(link)
        for link in service.get_random_links(category=category, limit=limit)
    ]


@router.get("/{link_id}", response_model=Link)
async def get_link(link_id: int, db: Session = Depends(get_db)):
    """获取单个链接"""
    service = LinkService(db)
    link = service.get_link(link_id)
    if not link:
        raise HTTPException(status_code=404, detail="链接不存在")
    return _rewrite_link_image_url(link)


@router.post("/", response_model=Link)
async def create_link(
    link: LinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建链接"""
    service = LinkService(db)
    return _rewrite_link_image_url(service.create_link(link))


@router.put("/{link_id}", response_model=Link)
async def update_link(
    link_id: int,
    link: LinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新链接"""
    service = LinkService(db)
    db_link = service.update_link(link_id, link)
    if not db_link:
        raise HTTPException(status_code=404, detail="链接不存在")
    return _rewrite_link_image_url(db_link)


@router.delete("/{link_id}")
async def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除链接"""
    service = LinkService(db)
    if not service.delete_link(link_id):
        raise HTTPException(status_code=404, detail="链接不存在")
    return {"message": "链接删除成功"}


@router.get("/categories/stats", response_model=List[LinkCategoryStats])
async def get_category_stats(db: Session = Depends(get_db)):
    """获取各分类链接统计"""
    service = LinkService(db)
    return service.get_category_stats()


@router.get("/tags/all", response_model=List[str])
async def get_all_tags(db: Session = Depends(get_db)):
    """获取所有标签"""
    service = LinkService(db)
    return service.get_all_tags()


@router.get("/by-tags/list", response_model=List[Link])
async def get_links_by_tags(
    tags: str = Query(..., description="标签，多个标签用逗号分隔"), db: Session = Depends(get_db)
):
    """根据标签获取链接"""
    tag_list = [tag.strip() for tag in tags.split(",")]
    if not tag_list:
        raise HTTPException(status_code=400, detail="标签不能为空")

    service = LinkService(db)
    return [
        _rewrite_link_image_url(link) for link in service.get_links_by_tags(tag_list)
    ]


@router.post("/upload-image", response_model=LinkImageUploadResponse)
async def upload_link_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """上传链接图片到MinIO"""
    # 检查文件类型
    service = LinkService(db)
    if not service.minio_service.is_image_file(file.filename or ""):
        raise HTTPException(status_code=400, detail="不支持的文件类型，请上传图片文件")

    # 检查文件大小（统一走 MAX_UPLOAD_SIZE 配置）
    ensure_upload_size(file)

    # 使用 Pillow 校验文件内容是否为真实图片
    file_data = file.file.read()
    file.file.seek(0)
    is_valid, _, _ = service.minio_service.validate_image_content(file_data)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="文件内容不是有效图片或格式不被支持（仅允许 JPEG/PNG/GIF/WEBP/BMP）",
        )

    # 确定MIME类型
    content_type = file.content_type or "image/jpeg"

    try:
        object_name, image_url = service.upload_link_image(
            file_data=file.file,
            file_name=file.filename or "",
            content_type=content_type,
        )

        return {"object_name": object_name, "image_url": image_url, "message": "图片上传成功"}
    except Exception as e:
        logger.error(f"图片上传失败: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="图片上传失败")


@router.post("/{link_id}/upload-image", response_model=Link)
async def upload_image_to_link(
    link_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """为指定链接上传新图片"""
    # 检查文件类型
    service = LinkService(db)
    if not service.minio_service.is_image_file(file.filename or ""):
        raise HTTPException(status_code=400, detail="不支持的文件类型，请上传图片文件")

    # 检查文件大小
    file.file.seek(0, 2)  # 移动到文件末尾
    file_size = file.file.tell()
    file.file.seek(0)  # 重置文件指针

    max_size = 10 * 1024 * 1024  # 10MB
    if file_size > max_size:
        raise HTTPException(status_code=400, detail="文件太大，请上传小于10MB的图片")

    # 使用 Pillow 校验文件内容是否为真实图片
    file_data = file.file.read()
    file.file.seek(0)
    is_valid, _, _ = service.minio_service.validate_image_content(file_data)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="文件内容不是有效图片或格式不被支持（仅允许 JPEG/PNG/GIF/WEBP/BMP）",
        )

    # 确定MIME类型
    content_type = file.content_type or "image/jpeg"

    try:
        link_update = LinkUpdate()
        updated_link = service.update_link_with_image(
            link_id=link_id,
            image_data=file.file,
            image_name=file.filename or "",
            content_type=content_type,
            link_update=link_update,
        )

        if not updated_link:
            raise HTTPException(status_code=404, detail="链接不存在")

        return _rewrite_link_image_url(updated_link)
    except Exception as e:
        logger.error(f"图片上传失败: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="图片上传失败")


@router.post("/create-with-image", response_model=Link)
async def create_link_with_image(
    name: str = Form(...),
    url: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    category: str = Form(DEFAULT_LINK_CATEGORY),
    is_active: bool = Form(True),
    sort_order: int = Form(0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建链接并上传图片"""
    # 检查文件类型
    service = LinkService(db)
    if not service.minio_service.is_image_file(file.filename or ""):
        raise HTTPException(status_code=400, detail="不支持的文件类型，请上传图片文件")

    # 检查文件大小
    file.file.seek(0, 2)  # 移动到文件末尾
    file_size = file.file.tell()
    file.file.seek(0)  # 重置文件指针

    max_size = 10 * 1024 * 1024  # 10MB
    if file_size > max_size:
        raise HTTPException(status_code=400, detail="文件太大，请上传小于10MB的图片")

    # 使用 Pillow 校验文件内容是否为真实图片
    file_data = file.file.read()
    file.file.seek(0)
    is_valid, _, _ = service.minio_service.validate_image_content(file_data)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="文件内容不是有效图片或格式不被支持（仅允许 JPEG/PNG/GIF/WEBP/BMP）",
        )

    # 确定MIME类型
    content_type = file.content_type or "image/jpeg"

    try:
        # 上传图片
        object_name, image_url = service.upload_link_image(
            file_data=file.file,
            file_name=file.filename or "",
            content_type=content_type,
        )

        # 创建链接
        link_data = LinkCreate(
            name=name,
            url=url,
            description=description,
            image_url=image_url,
            image_type="minio",
            tags=tags,
            category=category,
            is_active=is_active,
            sort_order=sort_order,
        )

        return _rewrite_link_image_url(service.create_link(link_data))
    except Exception as e:
        logger.error(f"创建链接失败: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="创建链接失败")

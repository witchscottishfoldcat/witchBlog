from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_db
from app.models.user import User
from app.schemas.resource_link import (
    ResourceLink,
    ResourceLinkCategoryStats,
    ResourceLinkCreate,
    ResourceLinkList,
    ResourceLinkTagStats,
    ResourceLinkUpdate,
)
from app.services.resource_link import ResourceLinkService

router = APIRouter()


@router.get("/", response_model=List[ResourceLink])
async def get_resource_links(
    category: Optional[str] = Query(
        None,
        description="资源分类: bilibili, douyin, weibo, zhihu, github, personal, other",
    ),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(100, ge=1, le=1000, description="返回数量"),
    sort_by: str = Query(
        "sort_order", description="排序方式: sort_order, created_at, title"
    ),
    db: Session = Depends(get_db),
):
    """获取资源链接列表"""
    service = ResourceLinkService(db)
    links = service.get_resource_links(
        category=category,
        is_active=is_active,
        tags=tags,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
    )
    return links


@router.get("/list", response_model=ResourceLinkList)
async def get_resource_links_paginated(
    category: Optional[str] = Query(
        None,
        description="资源分类: bilibili, douyin, weibo, zhihu, github, personal, other",
    ),
    tags: Optional[str] = Query(None, description="标签，多个标签用逗号分隔"),
    is_active: Optional[bool] = Query(True, description="是否启用"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    sort_by: str = Query(
        "sort_order", description="排序方式: sort_order, created_at, title"
    ),
    db: Session = Depends(get_db),
):
    """分页获取资源链接列表"""
    service = ResourceLinkService(db)
    links, total = service.get_resource_links_paginated(
        category=category,
        is_active=is_active,
        tags=tags,
        page=page,
        size=size,
        sort_by=sort_by,
    )

    pages = (total + size - 1) // size

    return {"items": links, "total": total, "page": page, "size": size, "pages": pages}


@router.get("/categories", response_model=List[ResourceLinkCategoryStats])
async def get_resource_link_categories(
    is_active: Optional[bool] = Query(True, description="是否启用"),
    db: Session = Depends(get_db),
):
    """获取资源链接分类统计"""
    service = ResourceLinkService(db)
    categories = service.get_category_stats(is_active=is_active)

    return [
        ResourceLinkCategoryStats(category=cat.category, count=cat.count)
        for cat in categories
    ]


@router.get("/tags", response_model=List[ResourceLinkTagStats])
async def get_resource_link_tags(
    is_active: Optional[bool] = Query(True, description="是否启用"),
    db: Session = Depends(get_db),
):
    """获取资源链接标签统计"""
    service = ResourceLinkService(db)
    tags = service.get_tag_stats(is_active=is_active)

    return [ResourceLinkTagStats(tag=tag["tag"], count=tag["count"]) for tag in tags]


@router.get("/{link_id}", response_model=ResourceLink)
async def get_resource_link(link_id: int, db: Session = Depends(get_db)):
    """获取单个资源链接"""
    service = ResourceLinkService(db)
    link = service.get_resource_link(link_id)
    if not link:
        raise HTTPException(status_code=404, detail="资源链接不存在")
    return link


@router.post("/", response_model=ResourceLink)
async def create_resource_link(
    link: ResourceLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建资源链接"""
    service = ResourceLinkService(db)
    return service.create_resource_link(link)


@router.put("/{link_id}", response_model=ResourceLink)
async def update_resource_link(
    link_id: int,
    link: ResourceLinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新资源链接"""
    service = ResourceLinkService(db)
    return service.update_resource_link(link_id, link)


@router.delete("/{link_id}")
async def delete_resource_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除资源链接"""
    service = ResourceLinkService(db)
    success = service.delete_resource_link(link_id)
    if not success:
        raise HTTPException(status_code=404, detail="资源链接不存在")

    return {"message": "资源链接删除成功"}

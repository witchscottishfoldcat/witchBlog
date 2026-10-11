from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_db
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.sponsor import Sponsor as SponsorSchema
from app.schemas.sponsor import SponsorCreate, SponsorList, SponsorUpdate
from app.services.sponsor_service import SponsorService

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=List[SponsorSchema])
async def get_sponsors(
    limit: int = Query(100, ge=1, le=500, description="返回数量"),
    db: Session = Depends(get_db),
):
    """公开：获取已在鸣谢列表展示的赞助记录（仅 is_active，按权重/时间排序）。

    供博客支持页的鸣谢列表调用，无需登录。
    """
    return SponsorService(db).get_active_sponsors(limit=limit)


@router.get("/all", response_model=SponsorList)
async def get_all_sponsors(
    is_active: Optional[bool] = Query(None, description="按展示状态筛选"),
    source: Optional[str] = Query(None, description="按赞助渠道筛选"),
    limit: int = Query(200, ge=1, le=1000, description="返回数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """管理端：获取全部赞助记录（含未展示），仅超级管理员。"""
    items = SponsorService(db).get_sponsors(
        is_active=is_active, source=source, limit=limit
    )
    return {"items": items, "total": len(items)}


@router.post("/", response_model=SponsorSchema, status_code=201)
async def create_sponsor(
    payload: SponsorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """新增赞助鸣谢记录，仅超级管理员。"""
    sponsor = SponsorService(db).create_sponsor(payload)
    logger.info(f"新增赞助鸣谢: {sponsor.name} (id={sponsor.id})")
    return sponsor


@router.get("/{sponsor_id}", response_model=SponsorSchema)
async def get_sponsor(
    sponsor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取单条赞助记录，仅超级管理员。"""
    sponsor = SponsorService(db).get_sponsor(sponsor_id)
    if not sponsor:
        raise HTTPException(status_code=404, detail="赞助记录不存在")
    return sponsor


@router.put("/{sponsor_id}", response_model=SponsorSchema)
async def update_sponsor(
    sponsor_id: int,
    payload: SponsorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新赞助记录，仅超级管理员。"""
    service = SponsorService(db)
    sponsor = service.get_sponsor(sponsor_id)
    if not sponsor:
        raise HTTPException(status_code=404, detail="赞助记录不存在")
    return service.update_sponsor(sponsor, payload)


@router.delete("/{sponsor_id}", status_code=204)
async def delete_sponsor(
    sponsor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除赞助记录，仅超级管理员。"""
    service = SponsorService(db)
    sponsor = service.get_sponsor(sponsor_id)
    if not sponsor:
        raise HTTPException(status_code=404, detail="赞助记录不存在")
    service.delete_sponsor(sponsor)
    logger.info(f"删除赞助鸣谢: {sponsor.name} (id={sponsor_id})")
    return None

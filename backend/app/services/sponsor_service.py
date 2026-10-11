"""赞助鸣谢服务：Sponsor 记录的数据访问与展示筛选。"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.sponsor import Sponsor
from app.schemas.sponsor import SponsorCreate, SponsorUpdate

# 列表默认排序：权重降序，其次赞助时间降序（MySQL 中 DESC 默认 NULL 在后，无需 nullslast）
_SORT_DESC = (Sponsor.sort_order.desc(), Sponsor.sponsored_at.desc(), Sponsor.id.desc())


class SponsorService:
    """赞助鸣谢服务类"""

    def __init__(self, db: Session):
        self.db = db

    def get_active_sponsors(self, limit: int = 100) -> List[Sponsor]:
        """公开鸣谢列表：仅展示中的记录，按权重/时间排序"""
        return (
            self.db.query(Sponsor)
            .filter(Sponsor.is_active.is_(True))
            .order_by(*_SORT_DESC)
            .limit(limit)
            .all()
        )

    def get_sponsors(
        self,
        is_active: Optional[bool] = None,
        source: Optional[str] = None,
        limit: int = 200,
    ) -> List[Sponsor]:
        """管理端列表：可按展示状态与赞助渠道筛选"""
        query = self.db.query(Sponsor)
        if is_active is not None:
            query = query.filter(Sponsor.is_active.is_(is_active))
        if source:
            query = query.filter(Sponsor.source == source.strip().lower())
        return query.order_by(*_SORT_DESC).limit(limit).all()

    def get_sponsor(self, sponsor_id: int) -> Optional[Sponsor]:
        """获取单条赞助记录"""
        return self.db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()

    def create_sponsor(self, payload: SponsorCreate) -> Sponsor:
        """新增赞助鸣谢记录"""
        sponsor = Sponsor(**payload.dict())
        self.db.add(sponsor)
        self.db.commit()
        self.db.refresh(sponsor)
        return sponsor

    def update_sponsor(self, sponsor: Sponsor, payload: SponsorUpdate) -> Sponsor:
        """按传入字段部分更新赞助记录"""
        for field, value in payload.dict(exclude_unset=True).items():
            setattr(sponsor, field, value)
        self.db.commit()
        self.db.refresh(sponsor)
        return sponsor

    def delete_sponsor(self, sponsor: Sponsor) -> None:
        """删除赞助记录"""
        self.db.delete(sponsor)
        self.db.commit()

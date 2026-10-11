from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SkillPeriod(Base):
    """技能学习时间段模型"""

    __tablename__ = "skill_periods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id"), nullable=False, comment="技能ID"
    )
    start_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, comment="开始时间"
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, comment="结束时间，为空表示至今"
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="备注")
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, comment="创建时间"
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间"
    )

    # 关联技能
    skill = relationship("Skill", back_populates="periods")

    def __repr__(self):
        return (
            f"<SkillPeriod(id={self.id}, skill_id={self.skill_id}, "
            f"start='{self.start_date}', end='{self.end_date}')>"
        )

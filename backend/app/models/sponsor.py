from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Sponsor(BaseModel):
    """赞助鸣谢模型"""

    __tablename__ = "sponsors"

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="赞助者昵称")
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="赞助留言")
    amount: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2), nullable=True, comment="赞助金额（元），为空则不展示金额"
    )
    source: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="other",
        comment="赞助渠道: alipay / wechat / other",
    )
    is_anonymous: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, comment="匿名展示（前台不显示昵称）"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="是否在鸣谢列表展示"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="排序权重，越大越靠前"
    )
    sponsored_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, comment="赞助时间，为空则使用创建时间"
    )

    def __repr__(self):
        return (
            f"<Sponsor(id={self.id}, name={self.name}, "
            f"source={self.source}, is_active={self.is_active})>"
        )

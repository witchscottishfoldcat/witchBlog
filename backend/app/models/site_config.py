from typing import Optional

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class SiteConfig(BaseModel):
    """站点配置模型"""

    __tablename__ = "site_configs"

    # 基本站点信息
    site_name: Mapped[str] = mapped_column(
        String(100), nullable=False, default="WitchCat", comment="站点名称"
    )
    site_signature: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment="站点签名"
    )
    site_announcement: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="站点公告"
    )

    # 图片相关
    site_icon: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="站点图标URL"
    )
    profile_image: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="个人头像URL"
    )

    # 状态标志
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="是否启用"
    )

    def __repr__(self):
        return (
            f"<SiteConfig(id={self.id}, site_name={self.site_name}, "
            f"is_active={self.is_active})>"
        )

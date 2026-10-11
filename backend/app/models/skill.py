import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SkillCategory(enum.Enum):
    """技能类别枚举"""

    FRONTEND = "前端开发"
    BACKEND = "后端开发"
    DEV_TOOLS = "开发工具"
    DATABASE = "数据库"
    OTHER = "其他技能"


class SkillLevel(enum.Enum):
    """技能等级枚举"""

    BEGINNER = "入门"
    JUNIOR = "初级"
    INTERMEDIATE = "中级"
    SENIOR = "高级"


class Skill(Base):
    """技能模型"""

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="技能名称")
    category: Mapped[SkillCategory] = mapped_column(
        Enum(SkillCategory), nullable=False, comment="技能类别"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="技能描述"
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, comment="创建时间"
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间"
    )

    # 计算得出的属性
    total_learning_days: Mapped[Optional[int]] = mapped_column(
        Integer, default=0, comment="总学习天数"
    )
    current_level: Mapped[Optional[SkillLevel]] = mapped_column(
        Enum(SkillLevel), default=SkillLevel.BEGINNER, comment="当前等级"
    )

    # 关联技能学习时间段
    periods = relationship(
        "SkillPeriod", back_populates="skill", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return (
            f"<Skill(id={self.id}, name='{self.name}', "
            f"category='{self.category.value}')>"
        )

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class ScheduledTask(BaseModel):
    """定时任务配置模型"""

    __tablename__ = "scheduled_tasks"

    # 任务标识
    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, comment="任务唯一标识"
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True, comment="任务描述"
    )

    # 触发配置
    trigger_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="interval",
        comment="触发类型: interval(固定间隔), cron(定时)",
    )
    trigger_config: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="触发配置 JSON"
    )

    # 开关状态
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="是否启用"
    )

    # 执行记录
    last_run_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, comment="上次执行时间"
    )
    next_run_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, comment="下次执行时间"
    )
    last_status: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True, comment="上次执行结果: success, failed, running"
    )
    last_error: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="上次执行错误信息"
    )
    last_duration: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="上次执行耗时（秒）"
    )
    run_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="累计执行次数"
    )

    def __repr__(self):
        status = "启用" if self.is_enabled else "禁用"
        return f"<ScheduledTask(name={self.name}, {status}, runs={self.run_count})>"

"""定时任务持久化状态服务：ScheduledTask 记录的数据访问。

运行时调度状态由 app/core/scheduler.py 提供；本模块只负责数据库侧记录。
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.scheduled_task import ScheduledTask


def get_all_records(db: Session) -> List[ScheduledTask]:
    """获取全部定时任务的持久化记录"""
    return db.query(ScheduledTask).all()


def get_record(db: Session, task_name: str) -> Optional[ScheduledTask]:
    """按任务名获取单条持久化记录"""
    return db.query(ScheduledTask).filter(ScheduledTask.name == task_name).first()

"""
定时任务管理 API

提供任务列表查看、启用/禁用开关、手动触发等管理功能。
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser, get_db
from app.core.scheduler import scheduler
from app.core.unified_logging import get_logger
from app.models.user import User
from app.services import scheduled_task_service

logger = get_logger(__name__)
router = APIRouter()


# ==================== 响应模型 ====================


class TaskStatusResponse(BaseModel):
    """任务状态响应"""

    name: str
    description: Optional[str]
    trigger_type: str
    schedule: str
    is_enabled: bool
    is_running: bool
    last_run_at: Optional[datetime]
    next_run_at: Optional[datetime]
    last_status: Optional[str]
    last_error: Optional[str]
    last_duration: Optional[int]
    run_count: int


class TaskListResponse(BaseModel):
    """任务列表响应"""

    tasks: List[TaskStatusResponse]
    total: int
    enabled_count: int
    disabled_count: int


# ==================== API 端点 ====================


@router.get("/tasks", response_model=TaskListResponse)
async def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取所有定时任务列表和状态（仅超级管理员，last_error 可能含内部信息）"""
    # 从数据库获取持久化状态
    records = scheduled_task_service.get_all_records(db)
    record_map = {r.name: r for r in records}

    # 合并调度器运行时状态
    runtime_status = {s["name"]: s for s in scheduler.get_all_status()}

    tasks = []
    for name in scheduler.get_job_names():
        record = record_map.get(name)
        runtime = runtime_status.get(name, {})

        tasks.append(
            TaskStatusResponse(
                name=name,
                description=(
                    record.description if record else runtime.get("description", "")
                ),
                trigger_type=(
                    record.trigger_type if record else runtime.get("trigger", "")
                ),
                schedule=runtime.get("schedule", ""),
                is_enabled=record.is_enabled if record else True,
                is_running=runtime.get("is_running", False),
                last_run_at=record.last_run_at if record else None,
                next_run_at=record.next_run_at if record else None,
                last_status=record.last_status if record else None,
                last_error=record.last_error if record else None,
                last_duration=record.last_duration if record else None,
                run_count=record.run_count if record else 0,
            )
        )

    enabled = sum(1 for t in tasks if t.is_enabled)

    return TaskListResponse(
        tasks=tasks,
        total=len(tasks),
        enabled_count=enabled,
        disabled_count=len(tasks) - enabled,
    )


@router.get("/tasks/{task_name}", response_model=TaskStatusResponse)
async def get_task_detail(
    task_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """获取单个任务详情（仅超级管理员）"""
    if task_name not in scheduler.get_job_names():
        raise HTTPException(status_code=404, detail=f"任务 {task_name} 不存在")

    record = scheduled_task_service.get_record(db, task_name)
    runtime_list = scheduler.get_all_status()
    runtime = next((s for s in runtime_list if s["name"] == task_name), {})

    return TaskStatusResponse(
        name=task_name,
        description=record.description if record else "",
        trigger_type=record.trigger_type if record else "",
        schedule=runtime.get("schedule", ""),
        is_enabled=record.is_enabled if record else True,
        is_running=runtime.get("is_running", False),
        last_run_at=record.last_run_at if record else None,
        next_run_at=record.next_run_at if record else None,
        last_status=record.last_status if record else None,
        last_error=record.last_error if record else None,
        last_duration=record.last_duration if record else None,
        run_count=record.run_count if record else 0,
    )


@router.post("/tasks/{task_name}/enable")
async def enable_task(
    task_name: str,
    current_user: User = Depends(get_current_active_superuser),
):
    """启用定时任务"""
    success = await scheduler.enable_job(task_name)
    if not success:
        raise HTTPException(status_code=404, detail=f"任务 {task_name} 不存在")
    return {"message": f"任务 {task_name} 已启用", "is_enabled": True}


@router.post("/tasks/{task_name}/disable")
async def disable_task(
    task_name: str,
    current_user: User = Depends(get_current_active_superuser),
):
    """禁用定时任务"""
    success = await scheduler.disable_job(task_name)
    if not success:
        raise HTTPException(status_code=404, detail=f"任务 {task_name} 不存在")
    return {"message": f"任务 {task_name} 已禁用", "is_enabled": False}


@router.post("/tasks/{task_name}/run")
async def run_task_now(
    task_name: str,
    current_user: User = Depends(get_current_active_superuser),
):
    """手动触发执行任务"""
    result = await scheduler.run_job_now(task_name)
    if not result.get("success") and "不存在" in result.get("error", ""):
        raise HTTPException(status_code=404, detail=result["error"])
    return result

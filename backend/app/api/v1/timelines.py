from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_active_superuser,
    get_current_user,
    get_current_user_optional,
    get_db,
)
from app.core.unified_logging import get_logger
from app.models.user import User
from app.schemas.timeline import (
    TimelineCreate,
    TimelineListResponse,
    TimelineResponse,
    TimelineUpdate,
)
from app.services.timeline_service import timeline_service

logger = get_logger(__name__)

router = APIRouter()


def _convert_timeline_to_response(
    timeline, user_id: Optional[int] = None
) -> TimelineResponse:
    """将数据库模型转换为响应模型"""
    # 获取持续时间描述
    duration = timeline_service.get_duration_description(timeline)

    return TimelineResponse(
        id=timeline.id,
        title=timeline.title,
        subtitle=timeline.subtitle,
        description=timeline.description,
        start_date=timeline.start_date,
        end_date=timeline.end_date,
        location=timeline.location,
        tags=timeline.tags,
        skills=timeline.skills,
        is_public=timeline.is_public,
        user_id=timeline.user_id,
        created_at=timeline.created_at,
        updated_at=timeline.updated_at,
        duration=duration,
    )


@router.post("/", response_model=TimelineResponse, status_code=status.HTTP_201_CREATED)
async def create_timeline(
    timeline: TimelineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """创建时间线记录（需登录）"""
    user_id = current_user.id if current_user else None
    db_timeline = timeline_service.create_timeline(db, timeline, user_id)
    return _convert_timeline_to_response(db_timeline, user_id)


@router.get("/", response_model=TimelineListResponse)
async def get_timelines(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=1000, description="每页记录数"),
    public_only: bool = Query(True, description="是否只获取公开记录"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    tags: Optional[str] = Query(None, description="标签筛选，多个标签用逗号分隔"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取时间线记录列表"""
    # 处理标签参数
    tags_list = None
    if tags:
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

    # 如果用户已登录且不限制为公开记录，则获取用户的所有记录
    if current_user and not public_only:
        user_id = current_user.id
        is_public = None
    else:
        user_id = None
        is_public = True

    timelines_result = timeline_service.get_timelines(
        db=db,
        skip=skip,
        limit=limit,
        user_id=user_id,
        is_public=is_public,
        search=search,
        tags=tags_list,
    )
    timelines, total = timelines_result

    # 转换为响应模型
    timeline_responses = [
        _convert_timeline_to_response(timeline) for timeline in timelines
    ]

    return TimelineListResponse(
        timelines=timeline_responses, total=total, skip=skip, limit=limit
    )


@router.get("/{timeline_id}", response_model=TimelineResponse)
async def get_timeline(
    timeline_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取单个时间线记录"""
    user_id = current_user.id if current_user else None
    timeline = timeline_service.get_timeline(db, timeline_id, user_id)
    return _convert_timeline_to_response(timeline, user_id)


@router.put("/{timeline_id}", response_model=TimelineResponse)
async def update_timeline(
    timeline_id: int,
    timeline_update: TimelineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """更新时间线记录"""
    db_timeline = timeline_service.update_timeline(
        db, timeline_id, timeline_update, current_user.id
    )
    return _convert_timeline_to_response(db_timeline, current_user.id)


@router.delete("/{timeline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timeline(
    timeline_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """删除时间线记录"""
    timeline_service.delete_timeline(db, timeline_id, current_user.id)
    return None


@router.get("/my/timelines", response_model=TimelineListResponse)
async def get_my_timelines(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=1000, description="每页记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    tags: Optional[str] = Query(None, description="标签筛选，多个标签用逗号分隔"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取当前用户的时间线记录列表"""
    # 处理标签参数
    tags_list = None
    if tags:
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

    timelines_result = timeline_service.get_timelines(
        db=db,
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        is_public=None,
        search=search,
        tags=tags_list,
    )
    timelines, total = timelines_result

    # 转换为响应模型
    timeline_responses = [
        _convert_timeline_to_response(timeline) for timeline in timelines
    ]

    return TimelineListResponse(
        timelines=timeline_responses, total=total, skip=skip, limit=limit
    )

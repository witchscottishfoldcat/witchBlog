from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.crud.crud_skill import skill, skill_period

router = APIRouter()


@router.get("/", response_model=List[schemas.SkillWithProjects])
def read_skills(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None, description="按类别筛选"),
) -> Any:
    """
    获取技能列表（公开接口）
    """
    skills = skill.get_multi(db, skip=skip, limit=limit, category=category)

    # 默认包含项目数量信息
    result = []
    for s in skills:
        related_projects = skill.get_related_projects(db, s.id)

        # 创建技能字典，确保只包含需要的字段
        skill_dict = {
            "id": s.id,
            "name": s.name,
            "category": s.category.value
            if hasattr(s.category, "value")
            else str(s.category),
            "description": s.description,
            "total_learning_days": s.total_learning_days,
            "current_level": s.current_level.value
            if s.current_level is not None and hasattr(s.current_level, "value")
            else str(s.current_level),
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "periods": [],
            "project_count": len(related_projects),
            "related_projects": [],  # 空列表，只显示数量
        }
        result.append(skill_dict)

    return result


@router.post("/", response_model=schemas.Skill)
def create_skill(
    *,
    db: Session = Depends(deps.get_db),
    skill_in: schemas.SkillCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    创建新技能
    """
    # 检查技能名称是否已存在
    existing_skill = skill.get_by_name(db, name=skill_in.name)
    if existing_skill:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="技能名称已存在")

    return skill.create(db=db, obj_in=skill_in)


@router.get("/stats", response_model=schemas.SkillStats)
def get_skill_stats(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    获取技能统计信息（公开接口）
    """
    return skill.get_stats(db)


@router.get("/{skill_id}/projects", response_model=List[schemas.RelatedProject])
def get_skill_projects(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
) -> Any:
    """
    获取技能相关的项目列表（公开接口）
    """
    db_skill = skill.get(db=db, id=skill_id)
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="技能不存在")

    related_projects = skill.get_related_projects(db, skill_id)
    return [schemas.RelatedProject.from_orm(p) for p in related_projects]


@router.get("/{skill_id}", response_model=schemas.SkillWithPeriodsAndProjects)
def read_skill(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
    include_projects: bool = Query(True, description="是否包含相关项目信息"),
) -> Any:
    """
    获取技能详情，包含学习时间段和相关项目（公开接口）
    """
    db_skill = skill.get(db=db, id=skill_id)
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="技能不存在")

    # 如果需要包含项目信息
    if include_projects:
        related_projects = skill.get_related_projects(db, skill_id)
        project_list = [schemas.RelatedProject.from_orm(p) for p in related_projects]

        # 将技能对象转换为字典，然后添加项目信息
        skill_dict = db_skill.__dict__.copy()
        skill_dict["related_projects"] = project_list
        skill_dict["project_count"] = len(related_projects)
        return skill_dict

    return db_skill


@router.put("/{skill_id}", response_model=schemas.Skill)
def update_skill(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
    skill_in: schemas.SkillUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    更新技能信息
    """
    db_skill = skill.get(db=db, id=skill_id)
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="技能不存在")

    # 如果更新名称，检查是否与其他技能重复
    if skill_in.name and skill_in.name != db_skill.name:
        existing_skill = skill.get_by_name(db, name=skill_in.name)
        if existing_skill:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="技能名称已存在"
            )

    return skill.update(db=db, db_obj=db_skill, obj_in=skill_in)


@router.delete("/{skill_id}", response_model=schemas.Skill)
def delete_skill(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    删除技能
    """
    db_skill = skill.get(db=db, id=skill_id)
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="技能不存在")
    return skill.remove(db=db, id=skill_id)


# 技能学习时间段相关接口
@router.get("/{skill_id}/periods", response_model=List[schemas.SkillPeriod])
def read_skill_periods(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    获取技能的所有学习时间段（公开接口）
    """
    db_skill = skill.get(db=db, id=skill_id)
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="技能不存在")

    return skill_period.get_multi_by_skill(
        db=db, skill_id=skill_id, skip=skip, limit=limit
    )


@router.post("/{skill_id}/periods", response_model=schemas.SkillPeriod)
def create_skill_period(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
    period_in: schemas.SkillPeriodCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    为技能添加学习时间段
    """
    db_skill = skill.get(db=db, id=skill_id)
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="技能不存在")

    # 验证时间段的合理性
    if period_in.end_date and period_in.start_date > period_in.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="开始时间不能晚于结束时间"
        )

    return skill_period.create(db=db, obj_in=period_in, skill_id=skill_id)


@router.put("/{skill_id}/periods/{period_id}", response_model=schemas.SkillPeriod)
def update_skill_period(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
    period_id: int,
    period_in: schemas.SkillPeriodUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    更新技能学习时间段
    """
    db_period = skill_period.get(db=db, id=period_id)
    if not db_period or db_period.skill_id != skill_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="学习时间段不存在")

    # 如果更新了时间，验证时间的合理性
    update_data = period_in.dict(exclude_unset=True)
    if "start_date" in update_data or "end_date" in update_data:
        start_date = update_data.get("start_date", db_period.start_date)
        end_date = update_data.get("end_date", db_period.end_date)

        if end_date and start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="开始时间不能晚于结束时间"
            )

    return skill_period.update(db=db, db_obj=db_period, obj_in=period_in)


@router.delete("/{skill_id}/periods/{period_id}", response_model=schemas.SkillPeriod)
def delete_skill_period(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
    period_id: int,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    删除技能学习时间段
    """
    db_period = skill_period.get(db=db, id=period_id)
    if not db_period or db_period.skill_id != skill_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="学习时间段不存在")

    return skill_period.remove(db=db, id=period_id)


@router.post("/{skill_id}/periods/current", response_model=schemas.SkillPeriod)
def add_current_period(
    *,
    db: Session = Depends(deps.get_db),
    skill_id: int,
    start_date: datetime,
    notes: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    添加从指定日期到当前时间的学习时间段
    """
    db_skill = skill.get(db=db, id=skill_id)
    if not db_skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="技能不存在")

    if start_date > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="开始时间不能晚于当前时间"
        )

    return skill_period.add_current_period(
        db=db, skill_id=skill_id, start_date=start_date, notes=notes
    )

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SkillCategoryBase(BaseModel):
    """技能类别基础模型"""


class SkillLevelBase(BaseModel):
    """技能等级基础模型"""


class SkillPeriodBase(BaseModel):
    """技能学习时间段基础模型"""

    start_date: datetime = Field(..., description="开始时间")
    end_date: Optional[datetime] = Field(None, description="结束时间，为空表示至今")
    notes: Optional[str] = Field(None, description="备注")


class SkillPeriodCreate(SkillPeriodBase):
    """创建技能学习时间段请求模型"""


class SkillPeriodUpdate(BaseModel):
    """更新技能学习时间段请求模型"""

    start_date: Optional[datetime] = Field(None, description="开始时间")
    end_date: Optional[datetime] = Field(None, description="结束时间，为空表示至今")
    notes: Optional[str] = Field(None, description="备注")


class SkillPeriod(SkillPeriodBase):
    """技能学习时间段响应模型"""

    id: int
    skill_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SkillBase(BaseModel):
    """技能基础模型"""

    name: str = Field(..., min_length=1, max_length=100, description="技能名称")
    category: str = Field(..., description="技能类别")
    description: Optional[str] = Field(None, description="技能描述")


class SkillCreate(SkillBase):
    """创建技能请求模型"""


class SkillUpdate(BaseModel):
    """更新技能请求模型"""

    name: Optional[str] = Field(None, min_length=1, max_length=100, description="技能名称")
    category: Optional[str] = Field(None, description="技能类别")
    description: Optional[str] = Field(None, description="技能描述")
    current_level: Optional[str] = Field(None, description="当前等级")


class Skill(SkillBase):
    """技能响应模型"""

    id: int
    total_learning_days: int
    current_level: str
    created_at: datetime
    updated_at: datetime
    periods: List[SkillPeriod] = []

    class Config:
        from_attributes = True


class RelatedProject(BaseModel):
    """相关项目模型"""

    id: int
    name: str
    description: Optional[str] = None
    url: str
    platform: str
    tag: str
    avatar_url: Optional[str] = None
    stars_count: int = 0
    forks_count: int = 0
    language_stats: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class SkillWithPeriods(Skill):
    """包含学习时间段的技能详情"""


class SkillWithProjects(Skill):
    """包含相关项目的技能详情"""

    related_projects: List[RelatedProject] = []
    project_count: int = 0

    class Config:
        from_attributes = True


class SkillWithPeriodsAndProjects(SkillWithPeriods):
    """包含学习时间段和相关项目的技能详情"""

    related_projects: List[RelatedProject] = []
    project_count: int = 0

    class Config:
        from_attributes = True


class SkillList(BaseModel):
    """技能列表响应模型"""

    skills: List[Skill]
    total: int
    page: int
    size: int


class SkillStats(BaseModel):
    """技能统计信息模型"""

    total_skills: int
    skills_by_category: dict
    skills_by_level: dict
    total_learning_days: int

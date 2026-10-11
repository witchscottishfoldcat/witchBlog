from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class TimelineBase(BaseModel):
    """时间线基础模型"""

    title: str = Field(..., min_length=1, max_length=255, description="经历名称")
    subtitle: Optional[str] = Field(None, max_length=255, description="副标题")
    description: Optional[str] = Field(None, description="介绍")
    start_date: datetime = Field(..., description="开始时间")
    end_date: Optional[datetime] = Field(None, description="结束时间，可以为空表示当前")
    location: Optional[str] = Field(None, max_length=255, description="地点")
    tags: Optional[List[str]] = Field(None, description="标签，如教育经历、工作经历等")
    skills: Optional[List[str]] = Field(None, description="小标签，所学技能或成就等")
    is_public: bool = Field(False, description="是否公开")

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_datetime(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v)
            except ValueError:
                try:
                    dt = datetime.strptime(v, "%Y-%m-%d")
                    return dt
                except ValueError:
                    raise ValueError(f"Invalid datetime format: {v}")
        return v


class TimelineCreate(TimelineBase):
    """创建时间线请求模型"""


class TimelineUpdate(BaseModel):
    """更新时间线请求模型"""

    title: Optional[str] = Field(None, min_length=1, max_length=255, description="经历名称")
    subtitle: Optional[str] = Field(None, max_length=255, description="副标题")
    description: Optional[str] = Field(None, description="介绍")
    start_date: Optional[datetime] = Field(None, description="开始时间")
    end_date: Optional[datetime] = Field(None, description="结束时间，可以为空表示当前")
    location: Optional[str] = Field(None, max_length=255, description="地点")
    tags: Optional[List[str]] = Field(None, description="标签，如教育经历、工作经历等")
    skills: Optional[List[str]] = Field(None, description="小标签，所学技能或成就等")
    is_public: Optional[bool] = Field(None, description="是否公开")

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, v):
        if v is None:
            return []
        return list(set(v))  # 去重

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_datetime(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v)
            except ValueError:
                try:
                    dt = datetime.strptime(v, "%Y-%m-%d")
                    return dt
                except ValueError:
                    raise ValueError(f"Invalid datetime format: {v}")
        return v


class TimelineResponse(TimelineBase):
    """时间线响应模型"""

    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    duration: Optional[str] = None  # 持续时间描述

    class Config:
        from_attributes = True


class TimelineListResponse(BaseModel):
    """时间线列表响应模型"""

    timelines: List[TimelineResponse]
    total: int
    skip: int
    limit: int

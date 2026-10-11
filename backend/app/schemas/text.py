from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class TextBase(BaseModel):
    """文本基础模型"""

    title: Optional[str] = None
    content: str
    author: Optional[str] = None
    category: str = "general"
    tags: Optional[List[str]] = []
    is_public: bool = False


class TextCreate(TextBase):
    """创建文本模型"""


class TextUpdate(BaseModel):
    """更新文本模型"""

    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class TextAnalysis(BaseModel):
    """文本分析模型"""

    model_config = ConfigDict(from_attributes=True)

    word_count: int
    char_count: int
    char_count_no_spaces: int
    sentence_count: int
    paragraph_count: int
    reading_time_minutes: float
    keywords: List[str]
    sentiment_score: Optional[int] = None
    language: Optional[str] = None


class Text(TextBase):
    """文本响应模型"""

    id: int
    owner_id: int
    word_count: int
    char_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TextWithAnalysis(Text):
    """带分析结果的文本模型"""

    analysis: Optional[TextAnalysis] = None

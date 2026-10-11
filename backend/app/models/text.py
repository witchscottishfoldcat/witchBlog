from typing import Any, Optional

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String
from sqlalchemy import Text as TextType
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Text(BaseModel):
    """文本模型"""

    __tablename__ = "texts"

    title: Mapped[Optional[str]] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(TextType, nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(100))
    category: Mapped[Optional[str]] = mapped_column(String(50), default="general")
    tags: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # 存储标签列表
    word_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    char_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    is_public: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)

    # 外键关联
    owner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))

    # 关联关系
    owner = relationship("User", back_populates="texts")
    analyses = relationship("TextAnalysis", back_populates="text")


class TextAnalysis(BaseModel):
    """文本分析模型"""

    __tablename__ = "text_analyses"

    text_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("texts.id"), nullable=False
    )
    word_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    char_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    char_count_no_spaces: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    sentence_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    paragraph_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    reading_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    keywords: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # 存储关键词列表
    sentiment_score: Mapped[Optional[int]] = mapped_column(Integer)  # 情感分析分数
    language: Mapped[Optional[str]] = mapped_column(String(10))  # 文本语言

    # 关联关系
    text = relationship("Text", back_populates="analyses")

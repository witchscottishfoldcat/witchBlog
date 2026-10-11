import re
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.text import Text, TextAnalysis
from app.schemas.text import TextAnalysis as TextAnalysisSchema
from app.schemas.text import TextCreate, TextUpdate


class TextService:
    """文本服务"""

    @staticmethod
    def get_text(db: Session, text_id: int, owner_id: Optional[int] = None) -> Text:
        """获取文本"""
        query = db.query(Text).filter(Text.id == text_id)

        if owner_id:
            query = query.filter(Text.owner_id == owner_id)
        else:
            # 如果没有指定所有者，只能获取公开文本
            query = query.filter(Text.is_public.is_(True))

        text = query.first()
        if not text:
            raise NotFoundException(f"文本 {text_id} 不存在")
        return text

    @staticmethod
    def get_latest_analysis(db: Session, text_id: int) -> Optional[TextAnalysis]:
        """获取文本最新的分析结果（无分析记录时返回 None）"""
        return (
            db.query(TextAnalysis)
            .filter(TextAnalysis.text_id == text_id)
            .order_by(TextAnalysis.created_at.desc())
            .first()
        )

    @staticmethod
    def get_texts(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        owner_id: Optional[int] = None,
        category: Optional[str] = None,
        is_public: Optional[bool] = None,
    ) -> List[Text]:
        """获取文本列表"""
        query = db.query(Text)

        if owner_id:
            query = query.filter(Text.owner_id == owner_id)
        elif is_public is not None:
            query = query.filter(Text.is_public == is_public)

        if category:
            query = query.filter(Text.category == category)

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def create_text(db: Session, text: TextCreate, owner_id: int) -> Text:
        """创建文本"""
        # 计算字数统计
        word_count, char_count = TextService._count_words_and_chars(text.content)

        db_text = Text(
            title=text.title,
            content=text.content,
            author=text.author,
            category=text.category,
            tags=text.tags,
            is_public=text.is_public,
            owner_id=owner_id,
            word_count=word_count,
            char_count=char_count,
        )
        db.add(db_text)
        db.commit()
        db.refresh(db_text)
        return db_text

    @staticmethod
    def update_text(
        db: Session,
        text_id: int,
        text_update: TextUpdate,
        owner_id: Optional[int],
    ) -> Text:
        """更新文本"""
        db_text = TextService.get_text(db, text_id, owner_id)

        update_data = text_update.dict(exclude_unset=True)

        # 如果更新内容，重新计算字数
        if "content" in update_data:
            word_count, char_count = TextService._count_words_and_chars(
                update_data["content"]
            )
            update_data["word_count"] = word_count
            update_data["char_count"] = char_count

        for field, value in update_data.items():
            setattr(db_text, field, value)

        db.commit()
        db.refresh(db_text)
        return db_text

    @staticmethod
    def delete_text(db: Session, text_id: int, owner_id: Optional[int]) -> bool:
        """删除文本"""
        db_text = TextService.get_text(db, text_id, owner_id)
        db.delete(db_text)
        db.commit()
        return True

    @staticmethod
    def analyze_text(
        db: Session, text_id: int, owner_id: Optional[int] = None
    ) -> TextAnalysisSchema:
        """分析文本"""
        text = TextService.get_text(db, text_id, owner_id)

        # 执行文本分析
        analysis = TextService._perform_analysis(text.content)

        # 保存分析结果
        db_analysis = TextAnalysis(text_id=text.id, **analysis.dict())
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)

        return TextAnalysisSchema.from_orm(db_analysis)

    @staticmethod
    def search_texts(
        db: Session,
        query: str,
        skip: int = 0,
        limit: int = 100,
        owner_id: Optional[int] = None,
    ) -> List[Text]:
        """搜索文本"""
        db_query = db.query(Text).filter(
            Text.content.contains(query) | Text.title.contains(query)
        )

        if owner_id:
            db_query = db_query.filter(Text.owner_id == owner_id)
        else:
            db_query = db_query.filter(Text.is_public.is_(True))

        return db_query.offset(skip).limit(limit).all()

    @staticmethod
    def _count_words_and_chars(text: str) -> tuple[int, int]:
        """计算字数和字符数"""
        char_count = len(text)

        # 英文单词
        english_words = re.findall(r"\b[a-zA-Z]+\b", text)
        # 中文字符
        chinese_chars = re.findall(r"[\u4e00-\u9fff]", text)
        word_count = len(english_words) + len(chinese_chars)

        return word_count, char_count

    @staticmethod
    def _perform_analysis(text: str) -> TextAnalysisSchema:
        """执行文本分析"""
        # 字符统计
        char_count = len(text)
        char_count_no_spaces = len(text.replace(" ", ""))

        # 单词统计
        english_words = re.findall(r"\b[a-zA-Z]+\b", text)
        chinese_chars = re.findall(r"[\u4e00-\u9fff]", text)
        word_count = len(english_words) + len(chinese_chars)

        # 句子统计
        sentences = re.split(r"[.!?。！？]+", text)
        sentence_count = len([s for s in sentences if s.strip()])

        # 段落统计
        paragraphs = text.split("\n\n")
        paragraph_count = len([p for p in paragraphs if p.strip()])

        # 阅读时间估算
        if word_count > 0:
            reading_time = word_count / 200
        else:
            reading_time = char_count / 400

        # 关键词提取
        keywords = TextService._extract_keywords(text)

        # 语言检测（简单实现）
        language = "zh" if chinese_chars else "en" if english_words else "unknown"

        return TextAnalysisSchema(
            word_count=word_count,
            char_count=char_count,
            char_count_no_spaces=char_count_no_spaces,
            sentence_count=sentence_count,
            paragraph_count=paragraph_count,
            reading_time_minutes=round(reading_time, 2),
            keywords=keywords,
            language=language,
        )

    @staticmethod
    def _extract_keywords(text: str, min_length: int = 2) -> List[str]:
        """提取关键词"""
        import string

        # 清理文本
        clean_text = text.translate(str.maketrans("", "", string.punctuation))
        words = re.findall(r"\b\w+\b", clean_text.lower())

        # 过滤短词
        words = [word for word in words if len(word) >= min_length]

        # 统计词频
        word_freq: Dict[str, int] = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1

        # 返回前10个高频词
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:10]]

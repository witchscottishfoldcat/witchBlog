from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.text import (
    Text,
    TextAnalysis,
    TextCreate,
    TextUpdate,
    TextWithAnalysis,
)
from app.services.text import TextService

router = APIRouter()


@router.post("/", response_model=Text)
def create_text(
    text: TextCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """创建新文本"""
    return TextService.create_text(db, text, current_user.id)


@router.get("/", response_model=List[Text])
def read_texts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取文本列表"""
    # 如果是普通用户，只返回自己的文本
    if current_user.is_superuser:
        texts = TextService.get_texts(
            db, skip=skip, limit=limit, category=category, is_public=is_public
        )
    else:
        texts = TextService.get_texts(
            db, skip=skip, limit=limit, owner_id=current_user.id, category=category
        )
    return texts


@router.get("/public", response_model=List[Text])
def read_public_texts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None),
) -> Any:
    """获取公开文本列表"""
    texts = TextService.get_texts(
        db, skip=skip, limit=limit, is_public=True, category=category
    )
    return texts


@router.get("/search", response_model=List[Text])
def search_texts(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """搜索文本"""
    if current_user.is_superuser:
        texts = TextService.search_texts(db, q, skip=skip, limit=limit)
    else:
        texts = TextService.search_texts(
            db, q, skip=skip, limit=limit, owner_id=current_user.id
        )
    return texts


@router.get("/{text_id}", response_model=Text)
def read_text(
    text_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取指定文本"""
    if current_user.is_superuser:
        return TextService.get_text(db, text_id)
    else:
        return TextService.get_text(db, text_id, current_user.id)


@router.put("/{text_id}", response_model=Text)
def update_text(
    text_id: int,
    text_update: TextUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """更新文本"""
    if current_user.is_superuser:
        # 超级用户可以更新任何文本
        text = TextService.get_text(db, text_id)
        if text is None:
            raise HTTPException(status_code=404, detail="文本不存在")
        return TextService.update_text(db, text_id, text_update, text.owner_id)
    else:
        return TextService.update_text(db, text_id, text_update, current_user.id)


@router.delete("/{text_id}")
def delete_text(
    text_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """删除文本"""
    if current_user.is_superuser:
        # 超级用户可以删除任何文本
        text = TextService.get_text(db, text_id)
        if text is None:
            raise HTTPException(status_code=404, detail="文本不存在")
        TextService.delete_text(db, text_id, text.owner_id)
    else:
        TextService.delete_text(db, text_id, current_user.id)

    return {"message": "Text deleted successfully"}


@router.post("/{text_id}/analyze", response_model=TextAnalysis)
def analyze_text(
    text_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """分析文本"""
    if current_user.is_superuser:
        return TextService.analyze_text(db, text_id)
    else:
        return TextService.analyze_text(db, text_id, current_user.id)


@router.get("/{text_id}/analysis", response_model=TextWithAnalysis)
def read_text_with_analysis(
    text_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取带分析结果的文本"""
    if current_user.is_superuser:
        text = TextService.get_text(db, text_id)
    else:
        text = TextService.get_text(db, text_id, current_user.id)

    # 获取最新的分析结果
    analysis = TextService.get_latest_analysis(db, text_id)

    return TextWithAnalysis(
        **text.__dict__, analysis=TextAnalysis.from_orm(analysis) if analysis else None
    )

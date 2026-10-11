from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_current_user_optional, get_db
from app.models.user import User
from app.schemas.md_file_archive import MDFileArchive, MDFileArchiveContent
from app.services.frontend_cache import notify_frontend_revalidate
from app.services.md_file_archive import md_file_archive_service

router = APIRouter()


def _can_view_archive(archive, user: Optional[User]) -> bool:
    """归档可见性：公开归档任何人可看，私有归档仅 owner / 超级管理员"""
    if archive.is_public:
        return True
    if user is not None and user.is_superuser:
        return True
    return user is not None and archive.owner_id == user.id


@router.post("/files/{file_id}/archive", response_model=MDFileArchive)
def archive_file(
    file_id: int,
    archive_reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """归档MD文件"""
    user_id = current_user.id

    try:
        archive = md_file_archive_service.archive_file(
            db=db,
            file_id=file_id,
            archive_reason=archive_reason,
            user_id=user_id,
            is_superuser=bool(current_user.is_superuser),
        )
        # 归档改变了前台 /archive 页数据，尽力立即刷新前台 ISR 缓存
        notify_frontend_revalidate()
        return archive
    except Exception:
        raise HTTPException(status_code=500, detail="归档失败")


@router.get("/archives", response_model=List[MDFileArchive])
def read_archives(
    skip: int = 0,
    limit: int = 100,
    is_public: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取用户的归档文件列表（匿名/普通用户仅可见公开归档）"""
    # 归档属于站长私有数据，非 owner/超管强制只返回公开归档
    if not (current_user and current_user.is_superuser):
        is_public = True

    archives, _ = md_file_archive_service.get_archives(
        db=db, skip=skip, limit=limit, owner_id=None, is_public=is_public, search=search
    )
    return archives


@router.get("/archives/{archive_id}", response_model=MDFileArchive)
def read_archive(
    archive_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取单个归档文件（私有归档仅 owner / 超级管理员）"""
    try:
        archive = md_file_archive_service.get_archive(
            db=db, archive_id=archive_id, user_id=None
        )
        if not _can_view_archive(archive, current_user):
            raise HTTPException(status_code=404, detail="归档不存在或无权访问")
        return archive
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="归档不存在或无权访问")


@router.get("/archives/{archive_id}/content", response_model=MDFileArchiveContent)
def read_archive_content(
    archive_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取归档文件内容（私有归档仅 owner / 超级管理员）"""
    try:
        archive = md_file_archive_service.get_archive(
            db=db, archive_id=archive_id, user_id=None
        )
        if not _can_view_archive(archive, current_user):
            raise HTTPException(status_code=404, detail="归档不存在或无权访问")
        content = md_file_archive_service.get_archive_content(
            db=db, archive_id=archive_id, user_id=None
        )

        return MDFileArchiveContent(
            id=archive.id,
            title=archive.title,
            original_filename=archive.original_filename,
            content=content,
            archive_date=archive.archive_date,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="归档不存在或无权访问")


@router.delete("/archives/{archive_id}", response_model=dict)
def delete_archive(
    archive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """删除归档文件"""
    user_id = current_user.id

    try:
        success = md_file_archive_service.delete_archive(
            db=db,
            archive_id=archive_id,
            user_id=user_id,
            is_superuser=bool(current_user.is_superuser),
        )
        if success:
            # 删除归档同样改变前台 /archive 页数据，尽力刷新前台缓存
            notify_frontend_revalidate()
            return {"detail": "归档文件已删除"}
        else:
            raise HTTPException(status_code=500, detail="删除归档文件失败")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/archives-count", response_model=dict)
def count_archives(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """统计归档文件数量（匿名/普通用户仅统计公开归档）"""
    if current_user and current_user.is_superuser:
        count = md_file_archive_service.count_archives(db=db, owner_id=None)
    else:
        count = md_file_archive_service.count_archives(
            db=db, owner_id=None, is_public=True
        )
    return {"count": count}

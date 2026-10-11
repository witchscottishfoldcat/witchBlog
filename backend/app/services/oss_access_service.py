"""OSS 对象代理访问控制服务。

需要按数据库记录做访问控制的前缀（ACCESS_CONTROLLED_PREFIXES）：
这些前缀下的对象存在公开/私有状态，匿名仅可访问公开记录，
私有对象仅 owner / 超级管理员可读（防止服务端凭证被滥用读取私有内容）。
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.core.storage_paths import (
    ACCESS_CONTROLLED_PREFIXES,
    ALBUMS_PREFIX,
    MD_FILES_PREFIX,
)
from app.models.md_file import MDFile
from app.models.user import User


def is_super_user(user: Optional[User]) -> bool:
    """可选登录态下的超级管理员判定"""
    return user is not None and bool(user.is_superuser)


def check_oss_object_access(
    db: Session, object_name: str, user: Optional[User]
) -> bool:
    """
    校验用户是否有权通过代理读取该 OSS 对象。

    仅对 ACCESS_CONTROLLED_PREFIXES 下的对象做记录级校验：
    - md_files/*：按 MDFile.object_name 查记录，公开记录匿名可读
    - albums/*：按 Photo 的对象名/缩略图名查记录，所属相册公开时匿名可读
    - 查不到记录的对象视为私有（仅超级管理员可读）
    其余白名单前缀为设计上的公开资源，直接放行。
    """
    if not object_name.startswith(ACCESS_CONTROLLED_PREFIXES):
        return True

    if is_super_user(user):
        return True

    if object_name.startswith(MD_FILES_PREFIX):
        record = db.query(MDFile).filter(MDFile.object_name == object_name).first()
        if record is None:
            return False
        if record.is_public:
            return True
        return user is not None and record.owner_id == user.id

    if object_name.startswith(ALBUMS_PREFIX):
        from app.models.album import Photo

        photo = (
            db.query(Photo)
            .filter(
                (Photo.minio_object_name == object_name)
                | (Photo.thumbnail_minio_object_name == object_name)
            )
            .first()
        )
        if photo is None:
            return False
        album = photo.album
        if album is not None and album.is_public:
            return True
        return user is not None and album is not None and album.user_id == user.id

    return False

from typing import Any, List, Optional

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException
from app.core.security import get_password_hash
from app.models.about_page import AboutPage
from app.models.album import Album
from app.models.diary import Diary
from app.models.md_file import MDFile
from app.models.md_file_archive import MDFileArchive
from app.models.music import MusicLibrary
from app.models.text import Text
from app.models.timeline import Timeline
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """用户服务"""

    @staticmethod
    def get_user(db: Session, user_id: int) -> User:
        """获取用户"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundException(f"用户 {user_id} 不存在")
        return user

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """获取用户列表"""
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """创建用户"""
        # 检查用户名是否已存在
        if UserService.get_user_by_username(db, user.username):
            raise BadRequestException("用户名已存在")

        # 检查邮箱是否已存在
        if UserService.get_user_by_email(db, user.email):
            raise BadRequestException("邮箱已存在")

        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            hashed_password=hashed_password,
            is_active=user.is_active,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
        """更新用户"""
        db_user = UserService.get_user(db, user_id)

        update_data = user_update.dict(exclude_unset=True)

        # 如果更新密码，需要哈希处理
        # 注意：前端在“不改密码”时可能把 password 字段传成 null/空串，此时跳过。
        password = update_data.pop("password", None)
        if password:
            update_data["hashed_password"] = get_password_hash(password)

        # 检查用户名和邮箱唯一性
        if "username" in update_data:
            existing_user = UserService.get_user_by_username(
                db, update_data["username"]
            )
            if existing_user and existing_user.id != user_id:
                raise BadRequestException("用户名已存在")

        if "email" in update_data:
            existing_user = UserService.get_user_by_email(db, update_data["email"])
            if existing_user and existing_user.id != user_id:
                raise BadRequestException("邮箱已存在")

        for field, value in update_data.items():
            setattr(db_user, field, value)

        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int, transfer_to: int) -> bool:
        """删除用户

        被删用户名下的所有数据（文章、归档、文本、日记、时间线、相册、关于页面、音乐库）
        会先转移给 ``transfer_to``（通常是执行删除操作的超管），避免触发外键置空失败，
        同时不丢失任何内容。

        :param user_id: 要删除的用户 ID
        :param transfer_to: 接收被删用户数据归属的用户 ID
        """
        # 不允许删除自己
        if user_id == transfer_to:
            raise BadRequestException("不能删除当前登录的用户")

        db_user = UserService.get_user(db, user_id)

        # 接收者必须存在
        if not db.query(User).filter(User.id == transfer_to).first():
            raise BadRequestException(f"数据接收用户 {transfer_to} 不存在")

        # 该用户名下数据转移给接收者。用批量 UPDATE 直接改外键，
        # 绕开 ORM 删除父对象时“把子对象外键置为 NULL”的默认行为（owner_id 为 NOT NULL 会失败）。
        # 异构模型列表做动态 update 分发，属性在运行期由各模型保证
        owner_models: List[Any] = [MDFile, MDFileArchive, Text, AboutPage]
        for model in owner_models:
            db.execute(
                update(model)
                .where(model.owner_id == user_id)
                .values(owner_id=transfer_to)
            )

        user_id_models: List[Any] = [Diary, Timeline, Album, MusicLibrary]
        for model in user_id_models:
            db.execute(
                update(model)
                .where(model.user_id == user_id)
                .values(user_id=transfer_to)
            )

        db.delete(db_user)
        db.commit()
        return True

    @staticmethod
    def count_users(db: Session) -> int:
        """统计用户数量"""
        return db.query(User).count()

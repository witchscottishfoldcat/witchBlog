from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.core.unified_logging import get_logger
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.schemas.user import UserCreate

logger = get_logger(__name__)


class AuthService:
    """认证服务"""

    @staticmethod
    def get_valid_refresh_session(
        db: Session, jti: Optional[str], user_id: int
    ) -> Optional[RefreshSession]:
        """取未吊销、未过期且属于该用户的有效刷新会话（行锁防并发轮换）。"""
        from datetime import datetime

        if not jti:
            return None
        return (
            db.query(RefreshSession)
            .filter(
                RefreshSession.jti == jti,
                RefreshSession.user_id == user_id,
                RefreshSession.revoked_at.is_(None),
                RefreshSession.expires_at > datetime.utcnow(),
            )
            .with_for_update()
            .first()
        )

    @staticmethod
    def revoke_refresh_session_by_jti(db: Session, jti: str) -> None:
        """按 jti 吊销刷新会话（登出用）；不存在或已吊销时静默返回。"""
        from datetime import datetime

        refresh_session = (
            db.query(RefreshSession).filter(RefreshSession.jti == jti).first()
        )
        if refresh_session is not None and refresh_session.revoked_at is None:
            refresh_session.revoked_at = datetime.utcnow()
            db.commit()

    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        """
        验证用户身份。

        兼容旧格式哈希：若旧算法验证成功（说明哈希是历史遗留的截断格式），
        自动用新算法（HMAC 预处理）重新哈希并写回数据库，实现透明升级。
        """
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None

        # 透明升级：密码验证成功后，用新算法重新哈希
        new_hash = get_password_hash(password)
        if new_hash != user.hashed_password:
            user.hashed_password = new_hash
            db.commit()
            logger.info(f"用户 {username} 密码哈希已自动升级到新算法")

        return user

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """创建用户"""
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
    def login_user(
        db: Session, username: str, password: str, persistent: bool = False
    ) -> dict:
        """用户登录"""
        user = AuthService.authenticate(db, username, password)
        if not user:
            raise UnauthorizedException("用户名或密码错误")

        if not user.is_active:
            raise UnauthorizedException("用户账户已被禁用")

        access_token = create_access_token(subject=user.username)
        refresh_token = AuthService.issue_refresh_token(db, user, persistent=persistent)

        # 更新最后登录时间
        from datetime import datetime

        user.last_login = datetime.utcnow()
        db.commit()

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token,
            "user": user,
        }

    @staticmethod
    def issue_refresh_token(db: Session, user: User, persistent: bool = False) -> str:
        """Issue and persist a refresh token so it can be rotated or revoked."""
        from datetime import datetime

        token = create_refresh_token(subject=user.username, persistent=persistent)
        payload = decode_token(token)
        if payload is None or not payload.get("jti") or not payload.get("exp"):
            raise RuntimeError("Failed to create refresh token claims")
        db.add(
            RefreshSession(
                jti=payload["jti"],
                user_id=user.id,
                expires_at=datetime.utcfromtimestamp(payload["exp"]),
            )
        )
        return token

    @staticmethod
    def get_current_user(db: Session, token: str) -> User:
        """获取当前用户"""
        from app.core.security import decode_token

        payload = decode_token(token)
        if payload is None:
            raise UnauthorizedException("无效的令牌")

        # 刷新令牌只能用于 /auth/refresh，不能直接访问 API
        if payload.get("type") == "refresh":
            raise UnauthorizedException("无效的令牌")

        username = payload.get("sub")
        if username is None:
            raise UnauthorizedException("无效的令牌")

        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise NotFoundException("用户不存在")

        if not user.is_active:
            raise UnauthorizedException("用户账户已被禁用")

        return user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """通过邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """通过用户名获取用户"""
        return db.query(User).filter(User.username == username).first()

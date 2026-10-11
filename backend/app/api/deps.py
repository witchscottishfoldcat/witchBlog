from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import NotFoundException, UnauthorizedException
from app.models.user import User
from app.services.auth import AuthService

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """获取当前用户依赖。

    token 解码与校验（含 refresh token 拒绝）统一由 AuthService 负责，
    这里不再重复解码，只把认证失败映射为 FastAPI 的 401 语义。
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        return AuthService.get_current_user(db, token)
    except UnauthorizedException:
        raise credentials_exception
    # 用户不存在保持既有语义：交由全局异常处理器返回 404


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前超级用户"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


# 创建一个可选的OAuth2方案
optional_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False
)


def get_current_user_optional(
    db: Session = Depends(get_db), token: str = Depends(optional_oauth2_scheme)
) -> Optional[User]:
    """
    获取当前用户（可选的）
    如果提供了有效token则返回用户，否则返回None
    """
    if not token:
        return None

    try:
        user = AuthService.get_current_user(db, token)
        return user
    except (JWTError, UnauthorizedException, NotFoundException):
        # token 无效或用户不存在/已禁用时，返回 None 而非报错
        # 仅捕获认证相关异常，其他异常（如数据库连接错误）继续向上传播
        return None

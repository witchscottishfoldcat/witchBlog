from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import SlidingWindowRateLimiter, client_ip
from app.core.security import create_access_token, decode_token
from app.core.unified_logging import get_logger
from app.schemas.token import Token, TokenRefreshRequest
from app.schemas.user import User as UserSchema
from app.schemas.user import UserCreate
from app.services.auth import AuthService
from app.services.user import UserService

logger = get_logger(__name__)

router = APIRouter()

# 登录防爆破：同一 IP+用户名 5 分钟内最多 10 次尝试；同一 IP 5 分钟内最多 30 次（防账号枚举式喷洒）
_login_attempt_limiter = SlidingWindowRateLimiter(max_events=10, window_seconds=300)
_login_ip_limiter = SlidingWindowRateLimiter(max_events=30, window_seconds=300)
# 注册防滥用：同一 IP 每小时最多 5 次
_register_limiter = SlidingWindowRateLimiter(max_events=5, window_seconds=3600)
# 刷新令牌防滥用：同一 IP 5 分钟内最多 60 次（正常前端仅在访问令牌过期时刷新）
_refresh_limiter = SlidingWindowRateLimiter(max_events=60, window_seconds=300)

REFRESH_COOKIE_NAME = "witchcat_refresh"
REFRESH_COOKIE_PATH = f"{settings.API_V1_STR}/auth"


def _set_refresh_cookie(
    response: Response, token: str, persistent: bool = False
) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=(
            settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 if persistent else None
        ),
        path=REFRESH_COOKIE_PATH,
        secure=settings.ENVIRONMENT.lower() == "production",
        httponly=True,
        samesite="strict",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        secure=settings.ENVIRONMENT.lower() == "production",
        httponly=True,
        samesite="strict",
    )


@router.post("/login", response_model=Token)
def login_for_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """用户登录获取访问令牌"""
    ip = client_ip(request)
    if not _login_ip_limiter.allow(f"ip:{ip}"):
        logger.warning(f"登录限流触发（IP 维度）: {ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="尝试过于频繁，请稍后再试",
        )
    if not _login_attempt_limiter.allow(f"{ip}:{form_data.username}"):
        logger.warning(f"登录限流触发（账号维度）: {ip}, user={form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="尝试过于频繁，请稍后再试",
        )
    persistent = "remember" in form_data.scopes
    result = AuthService.login_user(
        db, form_data.username, form_data.password, persistent=persistent
    )
    _set_refresh_cookie(response, result["refresh_token"], persistent=persistent)
    return {"access_token": result["access_token"], "token_type": result["token_type"]}


@router.post("/register", response_model=UserSchema)
def register(
    request: Request,
    user: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """用户注册（默认关闭，需通过 ENABLE_OPEN_REGISTRATION 开启）"""
    # 个人博客默认不开放自助注册，防止攻击者自助开户后调用写接口
    if not settings.ENABLE_OPEN_REGISTRATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="注册已关闭",
        )

    ip = client_ip(request)
    if not _register_limiter.allow(f"ip:{ip}"):
        logger.warning(f"注册限流触发: {ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="操作过于频繁，请稍后再试",
        )

    # 检查用户是否已存在（错误信息统一，避免账号/邮箱枚举）
    db_user = AuthService.get_user_by_email(db, email=user.email)
    exists = db_user is not None
    if not exists:
        db_user = AuthService.get_user_by_username(db, username=user.username)
        exists = db_user is not None
    if exists:
        raise HTTPException(status_code=400, detail="注册失败，请检查提交的信息")

    # 创建新用户
    return UserService.create_user(db, user)


@router.post("/refresh", response_model=Token)
def refresh_access_token(
    request: Request,
    response: Response,
    body: Optional[TokenRefreshRequest] = None,
    db: Session = Depends(get_db),
) -> Any:
    """用刷新令牌换取新的访问令牌（同时轮换刷新令牌）"""
    ip = client_ip(request)
    if not _refresh_limiter.allow(f"ip:{ip}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="操作过于频繁，请稍后再试",
        )

    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token and body is not None:
        refresh_token = body.refresh_token
    payload = decode_token(refresh_token) if refresh_token else None
    # 只接受 refresh 类型令牌；访问令牌不能用来刷新
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = AuthService.get_user_by_username(db, username=username)
    # 刷新时重新校验用户状态：被禁用/删除的账号在刷新环节即失效
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jti = payload.get("jti")
    refresh_session = AuthService.get_valid_refresh_session(db, jti, user.id)
    if refresh_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Rotation is one-time-use: revoke the presented token before
    # issuing its replacement.
    refresh_session.revoked_at = datetime.utcnow()
    persistent = bool(payload.get("persistent"))
    new_refresh_token = AuthService.issue_refresh_token(db, user, persistent=persistent)
    db.commit()
    _set_refresh_cookie(response, new_refresh_token, persistent=persistent)

    return {
        "access_token": create_access_token(subject=user.username),
        "token_type": "bearer",
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    """Revoke the current refresh session and expire its httpOnly cookie."""
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    payload = decode_token(token) if token else None
    jti = payload.get("jti") if payload and payload.get("type") == "refresh" else None
    if jti:
        AuthService.revoke_refresh_session_by_jti(db, jti)
    _clear_refresh_cookie(response)


@router.post("/test-token", response_model=dict)
def test_token(current_user: Any = Depends(get_current_active_user)) -> Any:
    """测试令牌有效性"""
    return {
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
    }

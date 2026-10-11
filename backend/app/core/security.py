import hashlib
import hmac
import uuid
from datetime import datetime, timedelta
from typing import Any, Optional, Union

import bcrypt
from jose import jwt

from app.core.config import settings
from app.core.unified_logging import get_logger

logger = get_logger(__name__)

# bcrypt 限制密码最大 72 字节。
# 使用 HMAC-SHA256 预处理：将任意长度密码归约为固定 64 字节的摘要，
# 再交给 bcrypt。这样既绕过 72 字节限制，又不丢失长密码的熵。
_PASSWORD_PREHASH_KEY = b"witchcat-bcrypt-prehash-v1"


def _prehash_password(password: str) -> bytes:
    """对密码做 HMAC-SHA256 预处理，输出 64 字节摘要供 bcrypt 使用。"""
    return (
        hmac.new(_PASSWORD_PREHASH_KEY, password.encode("utf-8"), hashlib.sha256)
        .hexdigest()
        .encode("ascii")
    )


def _prehash_password_binary_compat(password: str) -> bytes:
    """Compatibility for hashes made by the short-lived binary-digest implementation."""
    return hmac.new(
        _PASSWORD_PREHASH_KEY, password.encode("utf-8"), hashlib.sha256
    ).digest()


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """创建访问令牌"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any], jti: Optional[str] = None, persistent: bool = False
) -> str:
    """创建刷新令牌。

    与访问令牌用同一密钥签名，但携带 type=refresh 声明且有效期更长。
    认证依赖会拒绝 refresh 类型的令牌直接访问 API，防止两种令牌混用。
    """
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti or uuid.uuid4().hex,
        "persistent": persistent,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码（兼容旧哈希格式）。

    先用新算法（HMAC 预处理）验证；若失败，再用旧算法（截断到72字节）验证。
    这样既支持新密码，也兼容历史遗留的旧格式哈希。
    """
    prehashed = _prehash_password(plain_password)
    try:
        # bcrypt 在 checkpw 中接受 bytes 类型密码
        if bcrypt.checkpw(prehashed, hashed_password.encode("utf-8")):
            return True
    except (ValueError, TypeError) as e:
        logger.warning(f"密码验证失败（新算法）：哈希格式异常 - {e}")

    # Older releases passed raw digest bytes to bcrypt. Retain compatibility,
    # except when the digest contains NUL (bcrypt 3.x rejected those hashes).
    binary_prehash = _prehash_password_binary_compat(plain_password)
    if b"\x00" not in binary_prehash:
        try:
            if bcrypt.checkpw(binary_prehash, hashed_password.encode("utf-8")):
                return True
        except (ValueError, TypeError):
            pass

    # 兼容旧格式：截断到72字节后直接 bcrypt 校验
    return _verify_password_legacy(plain_password, hashed_password)


def needs_rehash(hashed_password: str) -> bool:
    """
    判断哈希是否需要升级到新算法。

    新算法的 HMAC 摘要始终是 64 字节的二进制输入，bcrypt 哈希结果无法从
    哈希字符串本身区分新旧格式。因此这里返回 True 表示"需要尝试升级"，
    实际升级操作由 AuthService.authenticate 在验证成功后安全执行。

    为避免每次登录都重复升级，哈希前缀标记法不可靠（bcrypt salt 随机），
    所以采用：密码验证成功后总是重新哈希并比较，若相同则跳过写入。
    """
    # 简单启发：旧哈希用截断的 UTF-8 明文，新哈希用 HMAC 摘要。
    # 无法从哈希字符串区分，所以总是返回 True，让上层负责幂等升级。
    return True


def _verify_password_legacy(plain_password: str, hashed_password: str) -> bool:
    """使用旧算法（截断到72字节）验证密码，仅用于兼容历史数据。"""
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        plain_password = password_bytes.decode("utf-8", errors="ignore")
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    """
    获取密码哈希。

    先对密码做 HMAC-SHA256 预处理（支持任意长度密码），再使用 bcrypt 加盐哈希。
    """
    prehashed = _prehash_password(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(prehashed, salt)
    return hashed.decode("utf-8")


def decode_token(token: str) -> Optional[dict]:
    """解码令牌"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.JWTError:
        return None

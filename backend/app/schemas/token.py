from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    """令牌模型"""

    access_token: str
    token_type: str
    refresh_token: Optional[str] = None


class TokenRefreshRequest(BaseModel):
    """刷新令牌请求"""

    # 兼容旧客户端；新管理台使用 httpOnly Cookie，不再让 JavaScript 接触刷新令牌。
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    """令牌数据模型"""

    username: Optional[str] = None

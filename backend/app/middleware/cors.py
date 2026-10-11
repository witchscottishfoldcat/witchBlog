from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# CORS 允许的标准 HTTP 方法（收紧通配符）
_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

# CORS 允许的请求头（收紧通配符，仅放行业务需要的头）
_ALLOWED_HEADERS = [
    "Authorization",
    "Content-Type",
    "Accept",
    "Accept-Language",
    "X-Requested-With",
]


def add_cors_middleware(app):
    """添加CORS中间件"""
    # pydantic 会把来源解析为 Url 对象，str() 带尾斜杠（http://host/），
    # 而浏览器 Origin 头不带尾斜杠，直接比对永远不匹配 —— 统一去掉尾斜杠
    allow_origins = [
        str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS
    ]

    # 生产环境收紧：仅允许配置的确切来源，且允许携带凭证
    # 开发环境若无配置来源，退化为允许所有来源但不携带凭证
    if settings.ENVIRONMENT.lower() == "production":
        # 生产环境必须显式配置允许的来源
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_credentials=True,
            allow_methods=_ALLOWED_METHODS,
            allow_headers=_ALLOWED_HEADERS,
        )
    else:
        # 开发环境：允许所有来源方便调试，但不携带凭证以降低风险
        origins = allow_origins if allow_origins else ["*"]
        allow_credentials = bool(allow_origins)  # 有确切来源才允许凭证
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=allow_credentials,
            allow_methods=_ALLOWED_METHODS,
            allow_headers=_ALLOWED_HEADERS,
        )

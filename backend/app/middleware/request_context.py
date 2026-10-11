"""
请求上下文中间件
自动设置请求ID、用户ID等上下文信息，以便在整个请求生命周期中追踪
"""
import time
import uuid
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.unified_logging import (
    get_logger,
    set_request_id,
    set_session_id,
    set_trace_id,
    set_user_id,
)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """请求上下文中间件"""

    def __init__(self, app):
        super().__init__(app)
        self.logger = get_logger("request_context")
        self.app_version = getattr(settings, "VERSION", "1.0.0")
        self.environment = getattr(settings, "ENVIRONMENT", "production")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 生成请求ID
        request_id = self._get_or_generate_request_id(request)
        set_request_id(request_id)

        # 生成追踪ID
        trace_id = str(uuid.uuid4())
        set_trace_id(trace_id)

        # 获取会话ID
        session_id = self._get_session_id(request)
        if session_id:
            set_session_id(session_id)

        # 设置应用状态，供异常处理器使用
        request.state.request_id = request_id
        request.state.trace_id = trace_id
        request.state.start_time = time.time()

        # 获取用户ID（如果有认证信息）
        user_id = await self._get_user_id(request)
        if user_id:
            set_user_id(user_id)

        # 记录请求开始
        self.logger.info(
            f"请求开始: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_ip": self._get_client_ip(request),
                "user_agent": request.headers.get("user-agent", ""),
                "content_length": request.headers.get("content-length", "0"),
            },
        )

        try:
            # 处理请求
            response = await call_next(request)

            # 计算处理时间
            processing_time = (time.time() - request.state.start_time) * 1000

            # 记录请求完成
            self.logger.info(
                f"请求完成: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "processing_time_ms": processing_time,
                    "response_size": response.headers.get("content-length", "0"),
                },
            )

            # 添加响应头
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Trace-ID"] = trace_id
            response.headers["X-Processing-Time-ms"] = f"{processing_time:.2f}"

            return response

        except Exception as e:
            # 计算处理时间（即使在异常情况下）
            processing_time = (time.time() - request.state.start_time) * 1000

            # 记录异常
            self.logger.error(
                f"请求异常: {request.method} {request.url.path} - {str(e)}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "processing_time_ms": processing_time,
                    "error_type": e.__class__.__name__,
                    "error_message": str(e),
                },
                exception=e,
            )

            # 重新抛出异常，让异常处理器处理
            raise

    def _get_or_generate_request_id(self, request: Request) -> str:
        """
        获取或生成请求ID

        优先从请求头获取，如果没有则生成新的
        """
        # 尝试从各种请求头获取请求ID
        for header_name in [
            "X-Request-ID",
            "X-Request-Id",
            "X-RequestID",
            "Request-ID",
        ]:
            request_id = request.headers.get(header_name)
            if request_id:
                return request_id

        # 如果没有找到，生成新的请求ID
        return str(uuid.uuid4())

    def _get_session_id(self, request: Request) -> Optional[str]:
        """
        获取会话ID

        从cookie或请求头获取
        """
        # 尝试从cookie获取
        session_id = request.cookies.get("session_id")
        if session_id:
            return session_id

        # 尝试从请求头获取
        for header_name in ["X-Session-ID", "X-Session-Id", "Authorization"]:
            session_id = request.headers.get(header_name)
            if session_id and header_name != "Authorization":
                return session_id
            elif header_name == "Authorization" and session_id:
                # 如果是Authorization头，可能是Bearer token，暂时用作会话ID
                return (
                    session_id.split(" ")[-1][:16]
                    if len(session_id.split(" ")) > 1
                    else None
                )

        return None

    async def _get_user_id(self, request: Request) -> Optional[str]:
        """
        获取用户ID

        从认证信息中获取
        """
        try:
            # 在实际应用中，这里会从JWT token或认证中间件中获取用户信息
            # 这里只是一个示例实现

            # 尝试从请求头获取用户ID
            user_id = request.headers.get("X-User-ID")
            if user_id:
                return user_id

            # 尝试从状态获取（可能由认证中间件设置）
            user_id = getattr(request.state, "user_id", None)
            if user_id:
                return user_id

            # 尝试从Authorization token解析（实际应用中会使用JWT解析）
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                # 在实际应用中，这里会解析JWT token获取用户ID
                # 这里只是一个示例
                return "user_from_token"

            return None

        except Exception:
            # 获取用户ID失败不应该影响请求处理
            return None

    def _get_client_ip(self, request: Request) -> str:
        """获取客户端IP地址（与限流统一口径，见 rate_limit.client_ip）"""
        from app.core.rate_limit import client_ip

        return client_ip(request)

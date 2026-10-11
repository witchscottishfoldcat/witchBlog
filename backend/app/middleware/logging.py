import time

from anyio import EndOfStream
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.unified_logging import get_logger

logger = get_logger("middleware")


class LoggingMiddleware(BaseHTTPMiddleware):
    """请求日志中间件"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"

        # 记录请求信息
        logger.info(
            f"Request: {request.method} {request.url} - " f"Client: {client_ip}"
        )

        # 处理请求，捕获客户端断开等异常
        try:
            response = await call_next(request)
        except EndOfStream:
            # 客户端提前断开连接，这是正常情况，不需要记录为错误
            logger.debug(f"客户端断开连接: {client_ip} -> {request.url.path}")
            return Response(status_code=200, content="")  # 返回200状态避免记录错误
        except Exception as e:
            # 其他异常继续抛出
            logger.error(f"请求处理异常: {type(e).__name__}: {e}")
            raise

        # 计算处理时间
        process_time = time.time() - start_time

        # 记录响应信息
        logger.info(
            f"Response: {response.status_code} - "
            f"Time: {process_time:.4f}s - "
            f"URL: {request.url}"
        )

        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)

        return response

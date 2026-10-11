"""
全局异常处理器
统一处理应用中的未捕获异常，提供标准化的错误响应格式
"""
import traceback

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.api_response import ErrorCodes, ResponseBuilder
from app.core.exceptions import CustomException
from app.core.unified_logging import get_logger, get_request_id

# 获取全局日志记录器
logger = get_logger("global_exceptions")

# HTTP 状态码 -> 错误代码（http/starlette 两个处理器共用的唯一映射）
_STATUS_ERROR_CODE = {
    400: ErrorCodes.BAD_REQUEST,
    401: ErrorCodes.UNAUTHORIZED,
    403: ErrorCodes.FORBIDDEN,
    404: ErrorCodes.RESOURCE_NOT_FOUND,
    405: ErrorCodes.METHOD_NOT_ALLOWED,
    422: ErrorCodes.VALIDATION_ERROR,
    429: ErrorCodes.RATE_LIMIT_EXCEEDED,
    500: ErrorCodes.INTERNAL_SERVER_ERROR,
    502: ErrorCodes.BAD_GATEWAY,
    503: ErrorCodes.SERVICE_UNAVAILABLE,
    504: ErrorCodes.GATEWAY_TIMEOUT,
}


def _error_code_for_status(status_code: int) -> str:
    return _STATUS_ERROR_CODE.get(status_code, ErrorCodes.UNKNOWN_ERROR)


async def custom_exception_handler(
    request: Request, exc: CustomException
) -> JSONResponse:
    """
    自定义异常处理器

    Args:
        request: FastAPI请求对象
        exc: 自定义异常对象

    Returns:
        JSONResponse: 格式化的错误响应
    """
    request_id = get_request_id() or getattr(request.state, "request_id", None)

    # 记录异常日志
    logger.error(
        f"自定义异常: {exc.__class__.__name__}: {exc.message}",
        extra={
            "request_id": request_id,
            "path": str(request.url),
            "method": request.method,
            "error_type": exc.__class__.__name__,
            "status_code": exc.status_code,
            "details": exc.details,
        },
    )

    # 使用响应构建器创建标准响应
    response_data = ResponseBuilder.error(
        error=exc,
        request_id=request_id,
        environment=getattr(request.app.state, "environment", None),
    )

    return JSONResponse(status_code=exc.status_code, content=response_data)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    HTTP异常处理器

    Args:
        request: FastAPI请求对象
        exc: HTTPException对象

    Returns:
        JSONResponse: 格式化的错误响应
    """
    request_id = get_request_id() or getattr(request.state, "request_id", None)

    # 记录HTTP异常日志
    logger.warning(
        f"HTTP异常: {exc.status_code}: {exc.detail}",
        extra={
            "request_id": request_id,
            "path": str(request.url),
            "method": request.method,
            "status_code": exc.status_code,
        },
    )

    # 根据状态码确定错误代码
    error_code = _error_code_for_status(exc.status_code)

    # 使用响应构建器创建标准响应
    response_data = ResponseBuilder.error(
        error=error_code,
        message=str(exc.detail),
        request_id=request_id,
        environment=getattr(request.app.state, "environment", None),
    )

    return JSONResponse(status_code=exc.status_code, content=response_data)


async def starlette_http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """
    Starlette HTTP异常处理器

    Args:
        request: FastAPI请求对象
        exc: Starlette HTTPException对象

    Returns:
        JSONResponse: 格式化的错误响应
    """
    request_id = get_request_id() or getattr(request.state, "request_id", None)

    # 记录Starlette HTTP异常日志
    logger.warning(
        f"Starlette HTTP异常: {exc.status_code}: {exc.detail}",
        extra={
            "request_id": request_id,
            "path": str(request.url),
            "method": request.method,
            "status_code": exc.status_code,
        },
    )

    # 使用响应构建器创建标准响应（错误代码按状态码映射，与其他 HTTP 处理器一致）
    response_data = ResponseBuilder.error(
        error=_error_code_for_status(exc.status_code),
        message=str(exc.detail),
        request_id=request_id,
        environment=getattr(request.app.state, "environment", None),
    )

    return JSONResponse(status_code=exc.status_code, content=response_data)


async def validation_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    数据验证异常处理器

    Args:
        request: FastAPI请求对象
        exc: 验证异常对象

    Returns:
        JSONResponse: 格式化的错误响应
    """
    request_id = get_request_id() or getattr(request.state, "request_id", None)

    # 记录验证异常日志
    logger.warning(
        f"数据验证异常: {exc.__class__.__name__}: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": str(request.url),
            "method": request.method,
            "error_type": exc.__class__.__name__,
        },
    )

    # 如果是Pydantic验证错误，提取详细信息
    validation_errors = {}
    if hasattr(exc, "errors"):
        try:
            # 处理Pydantic ValidationError
            errors = exc.errors()
            field_errors = {}

            for error in errors:
                field = ".".join(str(loc) for loc in error["loc"])
                field_errors[field] = error["msg"]

            validation_errors = field_errors
        except Exception:
            # 如果无法提取详细错误，使用原始异常信息
            validation_errors = {"error": str(exc)}

    # 使用响应构建器创建标准响应
    response_data = ResponseBuilder.validation_error(
        errors=validation_errors,
        message="请求参数验证失败",
        request_id=request_id,
        environment=getattr(request.app.state, "environment", None),
    )

    return JSONResponse(status_code=422, content=response_data)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    全局异常处理器 - 捕获所有未处理的异常

    Args:
        request: FastAPI请求对象
        exc: 未处理的异常对象

    Returns:
        JSONResponse: 格式化的错误响应
    """
    request_id = get_request_id() or getattr(request.state, "request_id", None)

    # 记录完整的异常信息和堆栈跟踪
    logger.error(
        f"未处理的异常: {exc.__class__.__name__}: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": str(request.url),
            "method": request.method,
            "error_type": exc.__class__.__name__,
            "error_message": str(exc),
            "traceback": traceback.format_exc(),
        },
    )

    # 在生产环境中不暴露详细错误信息
    is_production = (
        getattr(request.app.state, "environment", "production").lower() == "production"
    )

    if is_production:
        message = "服务器内部错误，请稍后重试"
        details = None
    else:
        message = f"内部服务器错误: {str(exc)}"
        details = {
            "error_type": exc.__class__.__name__,
            "error_message": str(exc),
            "traceback": traceback.format_exc().split("\n"),
        }

    # 使用响应构建器创建标准响应
    response_data = ResponseBuilder.internal_error(
        message=message,
        details=details,
        request_id=request_id,
        environment=getattr(request.app.state, "environment", None),
    )

    return JSONResponse(status_code=500, content=response_data)


# 异常处理器注册函数
def register_exception_handlers(app):
    """
    注册所有异常处理器到FastAPI应用

    Args:
        app: FastAPI应用实例
    """
    # 自定义异常处理器
    app.add_exception_handler(CustomException, custom_exception_handler)

    # FastAPI HTTP异常处理器
    app.add_exception_handler(HTTPException, http_exception_handler)

    # Starlette HTTP异常处理器
    app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)

    # 数据验证异常处理器
    try:
        from pydantic import ValidationError

        app.add_exception_handler(ValidationError, validation_exception_handler)
    except ImportError:
        # 如果没有安装Pydantic，跳过此处理器
        pass

    # 请求参数校验（FastAPI 路由层 422）：同样纳入统一信封，
    # 否则请求校验错误返回裸 {detail: [...]}，与其他错误格式不一致
    from fastapi.exceptions import RequestValidationError

    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # 全局异常处理器 - 必须最后注册，作为兜底
    app.add_exception_handler(Exception, global_exception_handler)

    logger.info("异常处理器注册完成")

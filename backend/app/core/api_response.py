"""
API响应标准化模块
统一API响应格式，包括成功响应和错误响应

本项目的实际约定（唯一权威说明）:
- 错误响应: 由 app/core/global_exceptions.py 的全局异常处理器统一捕获，
  并通过本模块的 ResponseBuilder.error / validation_error / internal_error
  生成统一错误信封 {success, message, metadata, error:{code, message, details}}
  业务代码只需 raise CustomException / HTTPException，不要手工构造错误信封
- 成功响应: 端点直接返回 Pydantic response_model（不包信封）
- ResponseBuilder.success / paginated 仅用于开发/测试用途的端点
  （如 test_exceptions.py），业务端点不要使用
"""
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import status
from pydantic import BaseModel

from app.core.exceptions import CustomException


class ErrorDetail(BaseModel):
    """错误详情模型"""

    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ResponseMetadata(BaseModel):
    """响应元数据"""

    timestamp: str
    request_id: Optional[str] = None
    version: str = "1.0.0"
    environment: Optional[str] = None


class PaginationInfo(BaseModel):
    """分页信息"""

    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class BaseResponse(BaseModel):
    """基础响应模型"""

    success: bool
    message: str
    metadata: ResponseMetadata


class SuccessResponse(BaseResponse):
    """成功响应模型"""

    success: bool = True
    data: Optional[Any] = None

    def __init__(
        self,
        message: str = "操作成功",
        data: Optional[Any] = None,
        request_id: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(
            success=True,
            message=message,
            metadata=ResponseMetadata(
                timestamp=datetime.utcnow().isoformat(), request_id=request_id, **kwargs
            ),
            data=data,
        )


class PaginatedResponse(SuccessResponse):
    """分页响应模型"""

    # 默认 None + __init__ 回填：见 __init__ 内注释
    pagination: Optional[PaginationInfo] = None

    def __init__(
        self,
        message: str = "获取数据成功",
        data: Optional[List[Any]] = None,
        pagination: Optional[PaginationInfo] = None,
        request_id: Optional[str] = None,
        **kwargs,
    ):
        # 分页信息在 super() 校验后回填：BaseResponse 校验链不认识子类字段，
        # 因此字段允许默认 None，真实调用方（ResponseBuilder.paginated）恒传值
        super().__init__(message=message, data=data, request_id=request_id, **kwargs)
        self.pagination = pagination


class ErrorResponse(BaseResponse):
    """错误响应模型"""

    success: bool = False
    error: ErrorDetail

    def __init__(
        self,
        error: Union[str, ErrorDetail, CustomException],
        message: Optional[str] = None,
        request_id: Optional[str] = None,
        **kwargs,
    ):
        # 处理不同类型的错误输入
        if isinstance(error, ErrorDetail):
            error_detail = error
            error_message = message or error.message
        elif isinstance(error, CustomException):
            error_detail = ErrorDetail(
                code=error.error_code or "UNKNOWN_ERROR",
                message=error.message,
                details=error.details,
            )
            error_message = message or error.message
        else:
            # 字符串按错误代码处理（调用方传入 ErrorCodes 常量）。
            # 历史实现把该字符串塞进 message、code 硬编码 UNKNOWN_ERROR，
            # 导致错误信封的 code 永远失真、message 出现 "BAD_REQUEST" 这类码值。
            code = str(error)
            fallback = default_message_for(code)
            error_detail = ErrorDetail(code=code, message=message or fallback)
            error_message = message or fallback

        super().__init__(
            success=False,
            message=error_message,
            metadata=ResponseMetadata(
                timestamp=datetime.utcnow().isoformat(), request_id=request_id, **kwargs
            ),
            error=error_detail,
        )


class ResponseBuilder:
    """响应构建器"""

    @staticmethod
    def success(
        data: Optional[Any] = None,
        message: str = "操作成功",
        request_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        构建成功响应

        Args:
            data: 响应数据
            message: 响应消息
            request_id: 请求ID
            **kwargs: 其他元数据

        Returns:
            Dict: 标准格式的成功响应
        """
        response = SuccessResponse(
            message=message, data=data, request_id=request_id, **kwargs
        )
        return response.dict()

    @staticmethod
    def paginated(
        data: List[Any],
        total: int,
        page: int = 1,
        page_size: int = 10,
        message: str = "获取数据成功",
        request_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        构建分页响应

        Args:
            data: 响应数据列表
            total: 总记录数
            page: 当前页码
            page_size: 每页大小
            message: 响应消息
            request_id: 请求ID
            **kwargs: 其他元数据

        Returns:
            Dict: 标准格式的分页响应
        """
        total_pages = (total + page_size - 1) // page_size
        has_next = page < total_pages
        has_prev = page > 1

        pagination = PaginationInfo(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev,
        )

        response = PaginatedResponse(
            message=message,
            data=data,
            pagination=pagination,
            request_id=request_id,
            **kwargs,
        )
        return response.dict()

    @staticmethod
    def error(
        error: Union[str, ErrorDetail, CustomException],
        message: Optional[str] = None,
        request_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        构建错误响应

        Args:
            error: 错误信息
            message: 响应消息
            request_id: 请求ID
            **kwargs: 其他元数据

        Returns:
            Dict: 标准格式的错误响应
        """
        response = ErrorResponse(
            error=error, message=message, request_id=request_id, **kwargs
        )
        return response.dict()

    @staticmethod
    def validation_error(
        errors: Dict[str, List[str]],
        message: str = "数据验证失败",
        request_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        构建验证错误响应

        Args:
            errors: 字段验证错误列表
            message: 响应消息
            request_id: 请求ID
            **kwargs: 其他元数据

        Returns:
            Dict: 标准格式的验证错误响应
        """
        error_detail = ErrorDetail(
            code="VALIDATION_ERROR",
            message=message,
            details={"validation_errors": errors},
        )

        response = ErrorResponse(error=error_detail, request_id=request_id, **kwargs)
        return response.dict()

    @staticmethod
    def not_found(
        resource: str = "资源", request_id: Optional[str] = None, **kwargs
    ) -> Dict[str, Any]:
        """
        构建资源未找到响应

        Args:
            resource: 资源名称
            request_id: 请求ID
            **kwargs: 其他元数据

        Returns:
            Dict: 标准格式的资源未找到响应
        """
        error_detail = ErrorDetail(code="RESOURCE_NOT_FOUND", message=f"{resource}未找到")

        response = ErrorResponse(error=error_detail, request_id=request_id, **kwargs)
        return response.dict()

    @staticmethod
    def unauthorized(
        message: str = "未授权访问", request_id: Optional[str] = None, **kwargs
    ) -> Dict[str, Any]:
        """
        构建未授权响应

        Args:
            message: 响应消息
            request_id: 请求ID
            **kwargs: 其他元数据

        Returns:
            Dict: 标准格式的未授权响应
        """
        error_detail = ErrorDetail(code="UNAUTHORIZED", message=message)

        response = ErrorResponse(error=error_detail, request_id=request_id, **kwargs)
        return response.dict()

    @staticmethod
    def forbidden(
        message: str = "访问被禁止", request_id: Optional[str] = None, **kwargs
    ) -> Dict[str, Any]:
        """
        构建禁止访问响应

        Args:
            message: 响应消息
            request_id: 请求ID
            **kwargs: 其他元数据

        Returns:
            Dict: 标准格式的禁止访问响应
        """
        error_detail = ErrorDetail(code="FORBIDDEN", message=message)

        response = ErrorResponse(error=error_detail, request_id=request_id, **kwargs)
        return response.dict()

    @staticmethod
    def internal_error(
        message: str = "服务器内部错误",
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        构建内部错误响应

        Args:
            message: 响应消息
            details: 错误详情
            request_id: 请求ID
            **kwargs: 其他元数据

        Returns:
            Dict: 标准格式的内部错误响应
        """
        error_detail = ErrorDetail(
            code="INTERNAL_SERVER_ERROR", message=message, details=details
        )

        response = ErrorResponse(error=error_detail, request_id=request_id, **kwargs)
        return response.dict()


class HTTPStatusHelper:
    """HTTP状态码助手"""

    @staticmethod
    def get_status_for_error(error_code: str) -> int:
        """
        根据错误代码获取HTTP状态码

        Args:
            error_code: 错误代码

        Returns:
            int: HTTP状态码
        """
        status_map = {
            "BAD_REQUEST": status.HTTP_400_BAD_REQUEST,
            "UNAUTHORIZED": status.HTTP_401_UNAUTHORIZED,
            "FORBIDDEN": status.HTTP_403_FORBIDDEN,
            "RESOURCE_NOT_FOUND": status.HTTP_404_NOT_FOUND,
            "METHOD_NOT_ALLOWED": status.HTTP_405_METHOD_NOT_ALLOWED,
            "VALIDATION_ERROR": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "RATE_LIMIT_EXCEEDED": status.HTTP_429_TOO_MANY_REQUESTS,
            "INTERNAL_SERVER_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "BAD_GATEWAY": status.HTTP_502_BAD_GATEWAY,
            "SERVICE_UNAVAILABLE": status.HTTP_503_SERVICE_UNAVAILABLE,
            "GATEWAY_TIMEOUT": status.HTTP_504_GATEWAY_TIMEOUT,
            # 数据库相关
            "DATABASE_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "DATABASE_CONNECTION_ERROR": status.HTTP_503_SERVICE_UNAVAILABLE,
            "INTEGRITY_VIOLATION": status.HTTP_409_CONFLICT,
            "OPTIMISTIC_LOCK_ERROR": status.HTTP_409_CONFLICT,
            # 外部服务相关
            "EXTERNAL_SERVICE_ERROR": status.HTTP_502_BAD_GATEWAY,
            "TIMEOUT_ERROR": status.HTTP_408_REQUEST_TIMEOUT,
            # 文件相关
            "FILE_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "FILE_NOT_FOUND": status.HTTP_404_NOT_FOUND,
            "FILE_SIZE_EXCEEDED": status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            "UNSUPPORTED_FILE_FORMAT": status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            # 认证相关
            "AUTHENTICATION_FAILED": status.HTTP_401_UNAUTHORIZED,
            "TOKEN_EXPIRED": status.HTTP_401_UNAUTHORIZED,
            "INVALID_TOKEN": status.HTTP_401_UNAUTHORIZED,
            # 业务逻辑相关
            "BUSINESS_LOGIC_ERROR": status.HTTP_400_BAD_REQUEST,
            "RESOURCE_CONFLICT": status.HTTP_409_CONFLICT,
            "OPERATION_NOT_ALLOWED": status.HTTP_405_METHOD_NOT_ALLOWED,
            "QUOTA_EXCEEDED": status.HTTP_429_TOO_MANY_REQUESTS,
            # 配置相关
            "CONFIGURATION_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "MISSING_CONFIGURATION": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "INVALID_CONFIGURATION": status.HTTP_500_INTERNAL_SERVER_ERROR,
        }

        return status_map.get(error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


# 常用错误代码常量
class ErrorCodes:
    """错误代码常量"""

    # 通用错误
    UNKNOWN_ERROR = "UNKNOWN_ERROR"

    # HTTP相关
    BAD_REQUEST = "BAD_REQUEST"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    BAD_GATEWAY = "BAD_GATEWAY"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    GATEWAY_TIMEOUT = "GATEWAY_TIMEOUT"

    # 数据库相关
    DATABASE_ERROR = "DATABASE_ERROR"
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR"
    INTEGRITY_VIOLATION = "INTEGRITY_VIOLATION"
    OPTIMISTIC_LOCK_ERROR = "OPTIMISTIC_LOCK_ERROR"

    # 外部服务相关
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    TIMEOUT_ERROR = "TIMEOUT_ERROR"

    # 文件相关
    FILE_ERROR = "FILE_ERROR"
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    FILE_SIZE_EXCEEDED = "FILE_SIZE_EXCEEDED"
    UNSUPPORTED_FILE_FORMAT = "UNSUPPORTED_FILE_FORMAT"

    # 认证相关
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    INVALID_TOKEN = "INVALID_TOKEN"

    # 业务逻辑相关
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR"
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED"
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"

    # 配置相关
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"
    MISSING_CONFIGURATION = "MISSING_CONFIGURATION"
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION"


# 错误代码 -> 默认人类可读文案（配置映射而非 if/else）；
# 未登记的代码回退为码值本身。调用方显式传入 message 时始终优先。
ERROR_CODE_MESSAGES: Dict[str, str] = {
    ErrorCodes.UNKNOWN_ERROR: "未知错误",
    ErrorCodes.BAD_REQUEST: "请求参数错误",
    ErrorCodes.UNAUTHORIZED: "未授权访问",
    ErrorCodes.FORBIDDEN: "禁止访问",
    ErrorCodes.RESOURCE_NOT_FOUND: "资源不存在",
    ErrorCodes.METHOD_NOT_ALLOWED: "请求方法不被允许",
    ErrorCodes.VALIDATION_ERROR: "数据校验失败",
    ErrorCodes.RATE_LIMIT_EXCEEDED: "请求过于频繁",
    ErrorCodes.INTERNAL_SERVER_ERROR: "服务器内部错误",
    ErrorCodes.BAD_GATEWAY: "上游服务错误",
    ErrorCodes.SERVICE_UNAVAILABLE: "服务暂不可用",
    ErrorCodes.GATEWAY_TIMEOUT: "上游服务超时",
    ErrorCodes.DATABASE_ERROR: "数据库操作失败",
    ErrorCodes.DATABASE_CONNECTION_ERROR: "数据库连接失败",
    ErrorCodes.INTEGRITY_VIOLATION: "数据完整性冲突",
    ErrorCodes.OPTIMISTIC_LOCK_ERROR: "数据已被并发修改",
    ErrorCodes.EXTERNAL_SERVICE_ERROR: "外部服务调用失败",
    ErrorCodes.TIMEOUT_ERROR: "请求超时",
    ErrorCodes.FILE_ERROR: "文件操作失败",
    ErrorCodes.FILE_NOT_FOUND: "文件不存在",
    ErrorCodes.FILE_SIZE_EXCEEDED: "文件大小超限",
    ErrorCodes.UNSUPPORTED_FILE_FORMAT: "不支持的文件格式",
    ErrorCodes.AUTHENTICATION_FAILED: "认证失败",
    ErrorCodes.TOKEN_EXPIRED: "令牌已过期",
    ErrorCodes.INVALID_TOKEN: "无效令牌",
    ErrorCodes.BUSINESS_LOGIC_ERROR: "业务规则不允许",
    ErrorCodes.RESOURCE_CONFLICT: "资源冲突",
    ErrorCodes.OPERATION_NOT_ALLOWED: "操作不被允许",
    ErrorCodes.QUOTA_EXCEEDED: "配额已用尽",
    ErrorCodes.CONFIGURATION_ERROR: "配置错误",
    ErrorCodes.MISSING_CONFIGURATION: "缺少必要配置",
    ErrorCodes.INVALID_CONFIGURATION: "配置值无效",
}


def default_message_for(code: str) -> str:
    """错误代码的默认文案；未登记代码回退为码值本身"""
    return ERROR_CODE_MESSAGES.get(code, code)

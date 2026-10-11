from typing import Any, Dict, Optional

from fastapi import status


class CustomException(Exception):
    """自定义异常基类"""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.error_code = error_code
        super().__init__(self.message)


class NotFoundException(CustomException):
    """资源未找到异常"""

    def __init__(
        self,
        message: str = "Resource not found",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
            error_code="RESOURCE_NOT_FOUND",
        )


class BadRequestException(CustomException):
    """请求参数错误异常"""

    def __init__(
        self, message: str = "Bad request", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
            error_code="BAD_REQUEST",
        )


class UnauthorizedException(CustomException):
    """未授权异常"""

    def __init__(
        self, message: str = "Unauthorized", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(CustomException):
    """禁止访问异常"""

    def __init__(
        self, message: str = "Forbidden", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
            error_code="FORBIDDEN",
        )


class ValidationException(CustomException):
    """数据验证异常"""

    def __init__(
        self,
        message: str = "Validation error",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
            error_code="VALIDATION_ERROR",
        )


class RateLimitException(CustomException):
    """限流异常"""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details,
            error_code="RATE_LIMIT_EXCEEDED",
        )


# 数据库相关异常
class DatabaseException(CustomException):
    """数据库操作异常"""

    def __init__(
        self,
        message: str = "Database operation failed",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = "DATABASE_ERROR",
    ):
        super().__init__(
            message=message,
            status_code=status_code,
            details=details,
            error_code=error_code,
        )


class DatabaseConnectionException(DatabaseException):
    """数据库连接异常"""

    def __init__(
        self,
        message: str = "Database connection failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
            error_code="DATABASE_CONNECTION_ERROR",
        )


class IntegrityException(DatabaseException):
    """数据库完整性异常"""

    def __init__(
        self,
        message: str = "Database integrity constraint violation",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
            error_code="INTEGRITY_VIOLATION",
        )


class OptimisticLockException(DatabaseException):
    """乐观锁异常"""

    def __init__(
        self,
        message: str = "Optimistic lock conflict",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
            error_code="OPTIMISTIC_LOCK_ERROR",
        )


# 外部服务相关异常
class ExternalServiceException(CustomException):
    """外部服务异常"""

    def __init__(
        self,
        message: str = "External service error",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_502_BAD_GATEWAY,
        error_code: Optional[str] = "EXTERNAL_SERVICE_ERROR",
    ):
        super().__init__(
            message=message,
            status_code=status_code,
            details=details,
            error_code=error_code,
        )


class ServiceUnavailableException(ExternalServiceException):
    """服务不可用异常"""

    def __init__(
        self,
        message: str = "Service unavailable",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
            error_code="SERVICE_UNAVAILABLE",
        )


class TimeoutException(ExternalServiceException):
    """超时异常"""

    def __init__(
        self, message: str = "Request timeout", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            details=details,
            error_code="TIMEOUT_ERROR",
        )


# 文件相关异常
class FileException(CustomException):
    """文件操作异常"""

    def __init__(
        self,
        message: str = "File operation failed",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = "FILE_ERROR",
    ):
        super().__init__(
            message=message,
            status_code=status_code,
            details=details,
            error_code=error_code,
        )


class FileNotFoundException(FileException):
    """文件未找到异常"""

    def __init__(
        self, message: str = "File not found", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
            error_code="FILE_NOT_FOUND",
        )


class FileSizeException(FileException):
    """文件大小异常"""

    def __init__(
        self,
        message: str = "File size limit exceeded",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            details=details,
            error_code="FILE_SIZE_EXCEEDED",
        )


class FileFormatException(FileException):
    """文件格式异常"""

    def __init__(
        self,
        message: str = "File format not supported",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            details=details,
            error_code="UNSUPPORTED_FILE_FORMAT",
        )


# 认证相关异常
class AuthenticationException(CustomException):
    """认证异常"""

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        error_code: Optional[str] = "AUTHENTICATION_FAILED",
    ):
        super().__init__(
            message=message,
            status_code=status_code,
            details=details,
            error_code=error_code,
        )


class TokenExpiredException(AuthenticationException):
    """令牌过期异常"""

    def __init__(
        self, message: str = "Token expired", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
            error_code="TOKEN_EXPIRED",
        )


class InvalidTokenException(AuthenticationException):
    """无效令牌异常"""

    def __init__(
        self, message: str = "Invalid token", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
            error_code="INVALID_TOKEN",
        )


# 业务逻辑相关异常
class BusinessLogicException(CustomException):
    """业务逻辑异常"""

    def __init__(
        self,
        message: str = "Business logic error",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: Optional[str] = "BUSINESS_LOGIC_ERROR",
    ):
        super().__init__(
            message=message,
            status_code=status_code,
            details=details,
            error_code=error_code,
        )


class ResourceConflictException(BusinessLogicException):
    """资源冲突异常"""

    def __init__(
        self,
        message: str = "Resource conflict",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
            error_code="RESOURCE_CONFLICT",
        )


class OperationNotAllowedException(BusinessLogicException):
    """操作不允许异常"""

    def __init__(
        self,
        message: str = "Operation not allowed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            details=details,
            error_code="OPERATION_NOT_ALLOWED",
        )


class QuotaExceededException(BusinessLogicException):
    """配额超出异常"""

    def __init__(
        self, message: str = "Quota exceeded", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details,
            error_code="QUOTA_EXCEEDED",
        )


# 配置相关异常
class ConfigurationException(CustomException):
    """配置异常"""

    def __init__(
        self,
        message: str = "Configuration error",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = "CONFIGURATION_ERROR",
    ):
        super().__init__(
            message=message,
            status_code=status_code,
            details=details,
            error_code=error_code,
        )


class MissingConfigurationException(ConfigurationException):
    """缺失配置异常"""

    def __init__(
        self,
        message: str = "Missing required configuration",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            error_code="MISSING_CONFIGURATION",
        )


class InvalidConfigurationException(ConfigurationException):
    """无效配置异常"""

    def __init__(
        self,
        message: str = "Invalid configuration value",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            error_code="INVALID_CONFIGURATION",
        )

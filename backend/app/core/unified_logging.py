"""
统一日志管理模块

提供项目中所有日志的统一入口，确保：
1. 日志只初始化一次
2. 所有标准 logging 调用都被拦截并转发到 loguru
3. 统一的日志格式
4. 支持上下文信息（request_id, user_id 等）
"""
import logging
import sys
from contextvars import ContextVar
from pathlib import Path
from typing import Any, Dict, Optional, Union

from loguru import logger

# 标记日志是否已初始化
_logging_initialized = False

# 上下文变量
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)
trace_id_var: ContextVar[Optional[str]] = ContextVar("trace_id", default=None)
session_id_var: ContextVar[Optional[str]] = ContextVar("session_id", default=None)


class InterceptHandler(logging.Handler):
    """
    拦截标准 logging 消息并重定向到 loguru
    确保所有使用 import logging 的代码都通过 loguru 输出
    """

    def emit(self, record: logging.LogRecord) -> None:
        # 获取对应的 loguru 日志级别
        level: Union[str, int]
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # 获取模块名
        module_name = record.name

        # 创建绑定模块名的loguru日志器
        module_logger = logger.bind(module=module_name)

        # 使用模块特定的日志器记录日志，不使用depth参数以避免显示函数和行号
        module_logger.opt(exception=record.exc_info).log(level, record.getMessage())


def init_logging(
    log_level: str = "INFO",
    log_file: str = "logs/app.log",
    service_name: str = "witchcat-api",
    environment: str = "development",
    json_format: bool = False,
) -> None:
    """
    初始化统一日志系统

    Args:
        log_level: 日志级别
        log_file: 日志文件路径
        service_name: 服务名称
        environment: 环境标识
        json_format: 是否使用 JSON 格式输出
    """
    global _logging_initialized

    if _logging_initialized:
        return

    # 移除 loguru 默认处理器
    logger.remove()

    # 创建日志目录
    log_dir = Path(log_file).parent
    log_dir.mkdir(parents=True, exist_ok=True)

    # 定义简洁的控制台格式
    console_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{extra[module]}</cyan> - "
        "<level>{message}</level>"
    )

    # 定义文件格式
    file_format = (
        "{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {extra[module]} - {message}"
    )

    # 过滤函数：添加默认的 module 字段
    def add_module_default(record):
        if "module" not in record["extra"]:
            record["extra"]["module"] = record["name"] or "app"
        return True

    # 添加控制台处理器
    logger.add(
        sink=sys.stdout,
        format=console_format,
        level=log_level,
        colorize=True,
        backtrace=False,
        diagnose=False,
        filter=add_module_default,
    )

    # 添加主日志文件
    logger.add(
        sink=log_file,
        format=file_format,
        level=log_level,
        rotation="10 MB",
        retention="30 days",
        encoding="utf-8",
        backtrace=False,
        diagnose=False,
        filter=add_module_default,
    )

    # 添加错误日志文件
    error_log_file = log_file.replace(".log", "_error.log")
    logger.add(
        sink=error_log_file,
        format=file_format,
        level="ERROR",
        rotation="10 MB",
        retention="30 days",
        encoding="utf-8",
        backtrace=False,
        diagnose=False,
        filter=add_module_default,
    )

    # 拦截所有标准 logging 调用
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    # uvicorn 以 CLI 启动时（部署入口）会预先给 uvicorn.* 配置独立 handler 并关闭
    # 向上传播，使 uvicorn 自身日志绕过统一 sink；清掉后回落到根 InterceptHandler
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(logger_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.propagate = True

    # 设置特定库的日志级别以减少噪音
    for logger_name in [
        "uvicorn.access",
        "watchfiles",
        "watchfiles.main",
        "fastapi",
        "sqlalchemy.engine",
        "httpx",
        "httpcore",
    ]:
        logging.getLogger(logger_name).setLevel(logging.WARNING)

    # 确保 uvicorn 基本启动信息可见（"Started server process" 等挂在 uvicorn.error 上）
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    _logging_initialized = True


def get_logger(name: Optional[str] = None) -> "UnifiedLogger":
    """
    获取统一日志记录器

    Args:
        name: 日志器名称（模块名）

    Returns:
        UnifiedLogger 实例
    """
    return UnifiedLogger(name)


class UnifiedLogger:
    """
    统一日志记录器

    提供简洁的日志接口，支持上下文信息
    """

    def __init__(self, name: Optional[str] = None):
        self.name = name or "app"
        self._logger = logger.bind(module=self.name)

    def _get_context(self) -> Dict[str, Any]:
        """获取当前上下文信息"""
        ctx = {}
        if request_id := request_id_var.get():
            ctx["request_id"] = request_id
        if user_id := user_id_var.get():
            ctx["user_id"] = user_id
        if trace_id := trace_id_var.get():
            ctx["trace_id"] = trace_id
        if session_id := session_id_var.get():
            ctx["session_id"] = session_id
        return ctx

    def _format_message(
        self, message: str, extra: Optional[Dict[str, Any]] = None
    ) -> str:
        """格式化消息，包含上下文和额外信息"""
        # 简单消息直接返回
        if not extra:
            return message

        # 有额外信息时，附加关键信息
        key_info = []
        for key in ["request_id", "status_code", "duration_ms", "path"]:
            if key in extra:
                key_info.append(f"{key}={extra[key]}")

        if key_info:
            return f"{message} [{', '.join(key_info)}]"
        return message

    def debug(
        self,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None,
    ) -> None:
        """调试级别日志"""
        self._logger.opt(depth=1, exception=exception).debug(
            self._format_message(message, extra)
        )

    def info(
        self,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None,
    ) -> None:
        """信息级别日志"""
        self._logger.opt(depth=1, exception=exception).info(
            self._format_message(message, extra)
        )

    def warning(
        self,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None,
    ) -> None:
        """警告级别日志"""
        self._logger.opt(depth=1, exception=exception).warning(
            self._format_message(message, extra)
        )

    def error(
        self,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None,
    ) -> None:
        """错误级别日志"""
        msg = self._format_message(message, extra)
        if exception:
            self._logger.opt(depth=1, exception=exception).error(msg)
        else:
            self._logger.opt(depth=1).error(msg)

    def exception(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """错误级别日志，附带当前活跃异常堆栈（logging 兼容语义）"""
        self._logger.opt(depth=1, exception=True).error(
            self._format_message(message, extra)
        )

    def critical(
        self,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None,
    ) -> None:
        """严重错误级别日志"""
        msg = self._format_message(message, extra)
        if exception:
            self._logger.opt(depth=1, exception=exception).critical(msg)
        else:
            self._logger.opt(depth=1).critical(msg)


# ==================== 上下文管理函数 ====================


def set_request_id(request_id: str) -> None:
    """设置请求ID"""
    request_id_var.set(request_id)


def set_user_id(user_id: str) -> None:
    """设置用户ID"""
    user_id_var.set(user_id)


def set_trace_id(trace_id: str) -> None:
    """设置追踪ID"""
    trace_id_var.set(trace_id)


def set_session_id(session_id: str) -> None:
    """设置会话ID"""
    session_id_var.set(session_id)


def get_request_id() -> Optional[str]:
    """获取当前请求ID"""
    return request_id_var.get()


def get_user_id() -> Optional[str]:
    """获取当前用户ID"""
    return user_id_var.get()


def get_trace_id() -> Optional[str]:
    """获取当前追踪ID"""
    return trace_id_var.get()


def get_session_id() -> Optional[str]:
    """获取当前会话ID"""
    return session_id_var.get()


def clear_context() -> None:
    """清除所有上下文"""
    request_id_var.set(None)
    user_id_var.set(None)
    trace_id_var.set(None)
    session_id_var.set(None)

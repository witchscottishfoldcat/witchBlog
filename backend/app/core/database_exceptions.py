"""
数据库异常处理模块
提供数据库操作的异常分类处理和事务回滚机制
"""
import time
from contextlib import contextmanager
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Type, TypeVar

from sqlalchemy import exc as sqlalchemy_exc
from sqlalchemy.orm import Session

from app.core.exceptions import (
    CustomException,
    DatabaseConnectionException,
    DatabaseException,
    IntegrityException,
    TimeoutException,
)
from app.core.unified_logging import get_logger

# 获取全局日志记录器
logger = get_logger("database_exceptions")

F = TypeVar("F", bound=Callable[..., Any])


class DatabaseErrorClassifier:
    """数据库错误分类器"""

    @staticmethod
    def classify_error(error: Exception) -> CustomException:
        """
        将数据库异常分类为对应的自定义异常

        Args:
            error: 数据库异常对象

        Returns:
            CustomException: 分类后的自定义异常对象（DatabaseException 系或
            TimeoutException 等外部服务系）
        """
        if isinstance(error, DatabaseException):
            # 已经是自定义异常，直接返回
            return error

        # SQLAlchemy异常分类
        if isinstance(error, sqlalchemy_exc.OperationalError):
            logger.error(
                f"数据库操作错误: {str(error)}",
                extra={"error_type": "OperationalError", "error_details": str(error)},
            )
            if "connection" in str(error).lower():
                return DatabaseConnectionException(
                    message="数据库连接失败", details={"original_error": str(error)}
                )
            return DatabaseException(
                message="数据库操作错误", details={"original_error": str(error)}
            )

        elif isinstance(error, sqlalchemy_exc.IntegrityError):
            logger.error(
                f"数据库完整性错误: {str(error)}",
                extra={"error_type": "IntegrityError", "error_details": str(error)},
            )
            error_msg = str(error).lower()

            # 详细分析完整性错误
            if "unique constraint" in error_msg or "duplicate" in error_msg:
                return IntegrityException(
                    message="数据唯一性约束冲突，已存在相同记录",
                    details={"original_error": str(error), "constraint_type": "unique"},
                )
            elif "foreign key" in error_msg:
                return IntegrityException(
                    message="外键约束冲突，关联记录不存在",
                    details={
                        "original_error": str(error),
                        "constraint_type": "foreign_key",
                    },
                )
            elif "not null" in error_msg:
                return IntegrityException(
                    message="数据完整性约束失败，必填字段不能为空",
                    details={
                        "original_error": str(error),
                        "constraint_type": "not_null",
                    },
                )
            else:
                return IntegrityException(
                    message="数据完整性约束冲突", details={"original_error": str(error)}
                )

        elif isinstance(error, sqlalchemy_exc.DataError):
            logger.error(
                f"数据库数据错误: {str(error)}",
                extra={"error_type": "DataError", "error_details": str(error)},
            )
            return DatabaseException(
                message="数据格式或类型错误", details={"original_error": str(error)}
            )

        elif isinstance(error, sqlalchemy_exc.TimeoutError):
            logger.error(
                f"数据库超时错误: {str(error)}",
                extra={"error_type": "TimeoutError", "error_details": str(error)},
            )
            return TimeoutException(
                message="数据库操作超时", details={"original_error": str(error)}
            )

        elif isinstance(error, sqlalchemy_exc.ProgrammingError):
            logger.error(
                f"数据库编程错误: {str(error)}",
                extra={"error_type": "ProgrammingError", "error_details": str(error)},
            )
            return DatabaseException(
                message="数据库查询语法错误", details={"original_error": str(error)}
            )

        elif isinstance(error, sqlalchemy_exc.NoSuchTableError):
            logger.error(
                f"数据库表不存在错误: {str(error)}",
                extra={"error_type": "NoSuchTableError", "error_details": str(error)},
            )
            return DatabaseException(
                message="数据库表不存在", details={"original_error": str(error)}
            )

        else:
            # 其他未知数据库异常
            logger.error(
                f"未知数据库错误: {error.__class__.__name__}: {str(error)}",
                extra={
                    "error_type": error.__class__.__name__,
                    "error_details": str(error),
                },
            )
            return DatabaseException(
                message="未知数据库错误",
                details={
                    "original_error": str(error),
                    "error_type": error.__class__.__name__,
                },
            )


@contextmanager
def transaction_scope(db: Session):
    """
    数据库事务上下文管理器，自动处理提交和回滚

    Args:
        db: 数据库会话对象

    Yields:
        Session: 数据库会话对象

    Raises:
        DatabaseException: 数据库操作异常
    """
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        # 分类异常并重新抛出
        classified_error = DatabaseErrorClassifier.classify_error(e)
        logger.error(
            f"数据库事务回滚: {classified_error.message}",
            extra={
                "error_type": classified_error.__class__.__name__,
                "original_error": str(e),
                "classified_error": classified_error.message,
            },
        )
        raise classified_error
    finally:
        db.close()


def retry_on_database_error(
    max_attempts: int = 3,
    backoff_seconds: float = 1.0,
    backoff_factor: float = 2.0,
    retryable_errors: Optional[List[Type[Exception]]] = None,
):
    """
    数据库操作重试装饰器

    Args:
        max_attempts: 最大重试次数
        backoff_seconds: 初始退避时间(秒)
        backoff_factor: 退避因子
        retryable_errors: 可重试的异常类型列表

    Returns:
        装饰器函数
    """
    if retryable_errors is None:
        # 默认可重试的异常类型
        retryable_errors = [
            sqlalchemy_exc.OperationalError,
            sqlalchemy_exc.TimeoutError,
            sqlalchemy_exc.DisconnectionError,
        ]

    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    # 检查是否是可重试的异常
                    is_retryable = any(
                        isinstance(e, error_type) for error_type in retryable_errors
                    )

                    if not is_retryable or attempt == max_attempts:
                        # 不可重试或已达到最大重试次数，直接抛出
                        classified_error = DatabaseErrorClassifier.classify_error(e)
                        raise classified_error

                    # 计算退避时间
                    sleep_time = backoff_seconds * (backoff_factor ** (attempt - 1))
                    last_error = e

                    logger.warning(
                        f"数据库操作失败，将在{sleep_time}秒后进行第{attempt+1}次重试: {str(e)}",
                        extra={
                            "attempt": attempt,
                            "max_attempts": max_attempts,
                            "error_type": e.__class__.__name__,
                            "error_details": str(e),
                            "next_retry_in": sleep_time,
                        },
                    )

                    time.sleep(sleep_time)

            # 这里不应该到达，但为了安全起见
            if last_error:
                classified_error = DatabaseErrorClassifier.classify_error(last_error)
                raise classified_error

        return wrapper  # type: ignore

    return decorator


def safe_db_execute(
    db: Session,
    operation: Callable[[], Any],
    operation_name: str = "数据库操作",
    max_attempts: int = 1,
) -> Any:
    """
    安全执行数据库操作

    Args:
        db: 数据库会话对象
        operation: 要执行的操作函数
        operation_name: 操作名称，用于日志记录
        max_attempts: 最大尝试次数

    Returns:
        Any: 操作结果

    Raises:
        DatabaseException: 数据库操作异常
    """
    if max_attempts > 1:
        # 使用重试装饰器
        retry_decorator = retry_on_database_error(max_attempts=max_attempts)
        operation_with_retry = retry_decorator(operation)

        try:
            with transaction_scope(db):
                return operation_with_retry()
        except Exception as e:
            logger.error(
                f"{operation_name}失败: {str(e)}",
                extra={
                    "operation_name": operation_name,
                    "max_attempts": max_attempts,
                    "error_type": e.__class__.__name__,
                    "error_details": str(e),
                },
            )
            raise
    else:
        # 单次尝试
        try:
            with transaction_scope(db):
                return operation()
        except Exception as e:
            logger.error(
                f"{operation_name}失败: {str(e)}",
                extra={
                    "operation_name": operation_name,
                    "error_type": e.__class__.__name__,
                    "error_details": str(e),
                },
            )
            raise


class DatabaseOperationHelper:
    """数据库操作辅助类"""

    @staticmethod
    def get_with_fallback(
        db: Session, model_class: Type, id: Any, fallback_id: Optional[Any] = None
    ) -> Any:
        """
        获取记录，支持备用ID

        Args:
            db: 数据库会话
            model_class: 模型类
            id: 主键ID
            fallback_id: 备用ID

        Returns:
            Any: 模型实例

        Raises:
            DatabaseException: 数据库操作异常
        """

        def _get_operation():
            instance = db.query(model_class).filter(model_class.id == id).first()
            if not instance and fallback_id:
                instance = (
                    db.query(model_class).filter(model_class.id == fallback_id).first()
                )
            return instance

        return safe_db_execute(db, _get_operation, f"获取{model_class.__name__}记录")

    @staticmethod
    def create_or_update(
        db: Session,
        model_class: Type,
        data: Dict[str, Any],
        id: Optional[Any] = None,
        create_if_not_exists: bool = True,
    ) -> Any:
        """
        创建或更新记录

        Args:
            db: 数据库会话
            model_class: 模型类
            data: 数据字典
            id: 主键ID
            create_if_not_exists: 如果不存在是否创建

        Returns:
            Any: 模型实例

        Raises:
            DatabaseException: 数据库操作异常
        """

        def _create_or_update_operation():
            if id:
                instance = db.query(model_class).filter(model_class.id == id).first()
                if instance:
                    # 更新
                    for key, value in data.items():
                        if hasattr(instance, key):
                            setattr(instance, key, value)
                    db.flush()
                    return instance
                elif not create_if_not_exists:
                    raise DatabaseException(
                        message=f"记录不存在，ID: {id}",
                        details={"model": model_class.__name__, "id": id},
                    )

            # 创建新记录
            instance = model_class(**data)
            db.add(instance)
            db.flush()
            return instance

        return safe_db_execute(
            db, _create_or_update_operation, f"创建或更新{model_class.__name__}记录"
        )

    @staticmethod
    def batch_create(
        db: Session,
        model_class: Type,
        data_list: List[Dict[str, Any]],
        batch_size: int = 100,
    ) -> List[Any]:
        """
        批量创建记录

        Args:
            db: 数据库会话
            model_class: 模型类
            data_list: 数据字典列表
            batch_size: 批次大小

        Returns:
            List[Any]: 模型实例列表

        Raises:
            DatabaseException: 数据库操作异常
        """
        if not data_list:
            return []

        def _batch_create_operation():
            instances = []
            for i in range(0, len(data_list), batch_size):
                batch_data = data_list[i : i + batch_size]
                batch_instances = [model_class(**data) for data in batch_data]
                db.add_all(batch_instances)
                db.flush()
                instances.extend(batch_instances)
            return instances

        return safe_db_execute(
            db, _batch_create_operation, f"批量创建{model_class.__name__}记录", max_attempts=2
        )

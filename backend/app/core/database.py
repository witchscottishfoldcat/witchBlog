import threading
import time
from typing import Generator

import pymysql
from sqlalchemy import create_engine, event, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import Pool

from app.core.config import settings
from app.core.database_exceptions import transaction_scope
from app.core.exceptions import DatabaseConnectionException
from app.core.unified_logging import get_logger

# 获取全局日志记录器
logger = get_logger("database")

# 注册MySQL驱动
pymysql.install_as_MySQLdb()

# 数据库连接池统计信息
connection_stats = {
    "total_connections": 0,  # 累计创建的连接数
    "current_connections": 0,  # 当前存活的物理连接数
    "checked_out_connections": 0,  # 当前被取出使用的连接数
    "connection_errors": 0,  # 连接错误计数
    "last_stats_time": time.time(),
}

# 连接池监控锁
stats_lock = threading.Lock()


def connection_pool_state_listener():
    """
    连接池状态监控
    监控连接池的状态变化并记录统计信息
    """

    @event.listens_for(Pool, "connect")
    def receive_connect(dbapi_connection, connection_record):
        """连接建立时触发（新的物理连接被创建）"""
        with stats_lock:
            connection_stats["total_connections"] += 1
            connection_stats["current_connections"] += 1
            logger.debug(
                "数据库连接已建立",
                extra={
                    "event": "connect",
                    "total_connections": connection_stats["total_connections"],
                    "current_connections": connection_stats["current_connections"],
                },
            )

    @event.listens_for(Pool, "checkout")
    def receive_checkout(dbapi_connection, connection_record, connection_proxy):
        """从连接池取出连接时触发"""
        with stats_lock:
            connection_stats["checked_out_connections"] += 1
            logger.debug(
                "从连接池取出连接",
                extra={
                    "event": "checkout",
                    "checked_out_connections": connection_stats[
                        "checked_out_connections"
                    ],
                },
            )

    @event.listens_for(Pool, "checkin")
    def receive_checkin(dbapi_connection, connection_record):
        """连接返回连接池时触发"""
        with stats_lock:
            connection_stats["checked_out_connections"] -= 1
            if connection_stats["checked_out_connections"] < 0:
                connection_stats["checked_out_connections"] = 0
            logger.debug(
                "连接返回连接池",
                extra={
                    "event": "checkin",
                    "checked_out_connections": connection_stats[
                        "checked_out_connections"
                    ],
                },
            )

    @event.listens_for(Pool, "close")
    def receive_close(dbapi_connection, connection_record):
        """连接关闭时触发（物理连接被永久关闭）"""
        with stats_lock:
            connection_stats["current_connections"] -= 1
            if connection_stats["current_connections"] < 0:
                connection_stats["current_connections"] = 0
            logger.debug(
                "数据库连接已关闭",
                extra={
                    "event": "close",
                    "current_connections": connection_stats["current_connections"],
                },
            )

    @event.listens_for(Pool, "reset")
    def receive_reset(dbapi_connection, connection_record):
        """连接重置时触发（连接返回池之前的清理操作）"""
        logger.debug("数据库连接已重置", extra={"event": "reset"})

    @event.listens_for(Pool, "invalidate")
    def receive_invalidate(dbapi_connection, connection_record, exception):
        """连接失效时触发"""
        with stats_lock:
            connection_stats["connection_errors"] += 1
            logger.error(
                f"数据库连接失效: {str(exception)}",
                extra={
                    "event": "invalidate",
                    "connection_errors": connection_stats["connection_errors"],
                    "exception": str(exception),
                },
            )


# 注册连接池事件监听器
connection_pool_state_listener()


# 获取数据库连接池配置
def get_pool_config():
    """根据环境获取数据库连接池配置"""
    # 基础配置
    pool_config = {
        "pool_size": 5,  # 连接池大小
        "max_overflow": 10,  # 最大溢出连接数
        "pool_timeout": 30,  # 获取连接超时时间(秒)
        "pool_recycle": 3600,  # 连接回收时间(秒)
        "pool_pre_ping": True,  # 连接预检查
    }

    # 生产环境优化配置
    if settings.ENVIRONMENT == "production":
        pool_config.update(
            {
                "pool_size": 20,  # 增加连接池大小到20（原为10）
                "max_overflow": 40,  # 增加最大溢出连接数到40（原为20）
                "pool_timeout": 60,  # 增加获取连接超时时间
                "pool_recycle": 7200,  # 增加连接回收时间到2小时
                "pool_pre_ping": True,  # 使用连接前检查是否存活
            }
        )
    elif settings.ENVIRONMENT == "development":
        # 开发环境配置，连接检查更频繁
        pool_config.update(
            {
                "pool_size": 10,  # 增加连接池大小（原为3，导致连接池耗尽）
                "max_overflow": 20,  # 增加最大溢出连接数（原为5）
                "pool_timeout": 30,  # 增加获取连接超时时间
                "pool_recycle": 1800,  # 减少连接回收时间
            }
        )

    return pool_config


# 根据数据库类型设置连接参数
engine_kwargs = {}
pool_config = get_pool_config()

# MySQL 连接配置
engine_kwargs.update(
    {
        "connect_args": {
            "charset": "utf8mb4",
            "connect_timeout": 10,  # 连接超时10秒
            "read_timeout": 30,  # 读取超时30秒
            "write_timeout": 30,  # 写入超时30秒
        },
        **pool_config,
    }
)


# 创建数据库引擎
# 创建数据库URL的安全日志版本（隐藏密码）
def mask_password_in_url(db_url: str) -> str:
    """隐藏数据库URL中的密码"""
    try:
        # 简单的密码隐藏，适用于大多数情况
        import re

        # 匹配 pattern like mysql+pymysql://user:password@host/db
        masked_url = re.sub(r"://[^:]+:[^@]+@", "://***:***@", db_url)
        return masked_url
    except Exception:
        # 如果处理失败，返回安全的默认值
        return "***masked***"


# 获取数据库URL的安全版本用于日志
safe_db_url = mask_password_in_url(str(settings.DATABASE_URL))

try:
    engine = create_engine(str(settings.DATABASE_URL), **engine_kwargs)
    # 数据库引擎创建成功（避免重复日志记录）
    # 注意: 日志记录已移至main.py中，避免重复显示
except Exception as e:
    logger.error(
        f"创建数据库引擎失败: {str(e)}",
        extra={
            "database_url": safe_db_url,
            "error_type": e.__class__.__name__,
            "error_details": str(e),
        },
    )
    raise DatabaseConnectionException(
        message="数据库引擎创建失败",
        details={"original_error": str(e), "database_url": safe_db_url},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 唯一声明式注册表：与 app/models/base.py 共享（历史上这里自建过一个空的
# Base，导致依赖它的建表操作（init_service/conftest）实际上是空操作）
# 显式再导出：外部沿用 from app.core.database import Base
from app.models.base import Base as Base  # noqa: E402,F401


def get_db() -> Generator[Session, None, None]:
    """
    数据库依赖注入

    Returns:
        Generator[Session, None, None]: 数据库会话生成器

    Raises:
        DatabaseConnectionException: 数据库连接异常
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        # 仅记录真正的数据库异常
        logger.error(
            f"数据库操作异常: {str(e)}",
            extra={"error_type": e.__class__.__name__, "error_details": str(e)},
        )
        raise
    except Exception:
        # 业务逻辑异常（如 NotFoundException）直接透传，不记录为数据库异常
        raise
    finally:
        # 确保连接被关闭
        try:
            db.close()
        except Exception as e:
            logger.warning(
                f"关闭数据库连接时发生异常: {str(e)}",
                extra={"error_type": e.__class__.__name__, "error_details": str(e)},
            )


def get_db_with_transaction() -> Generator[Session, None, None]:
    """
    带事务管理的数据库依赖注入

    Returns:
        Generator[Session, None, None]: 数据库会话生成器
    """
    db = SessionLocal()
    try:
        with transaction_scope(db):
            yield db
    except Exception:
        # 记录异常但不再处理，transaction_scope已经处理了
        raise
    finally:
        # 确保连接被关闭
        try:
            db.close()
        except Exception as e:
            logger.warning(
                f"关闭数据库连接时发生异常: {str(e)}",
                extra={"error_type": e.__class__.__name__, "error_details": str(e)},
            )


def get_connection_pool_stats() -> dict:
    """
    获取连接池统计信息

    Returns:
        dict: 连接池统计信息
    """
    with stats_lock:
        stats = connection_stats.copy()

        # 尝试从连接池获取实时状态
        try:
            if hasattr(engine.pool, "size"):
                stats.update(
                    {
                        "pool_size": engine.pool.size(),
                        "checked_in": getattr(engine.pool, "checkedin", lambda: 0)(),
                        "checked_out": getattr(engine.pool, "checkedout", lambda: 0)(),
                        "overflow": getattr(engine.pool, "overflow", lambda: 0)(),
                    }
                )
        except Exception as e:
            logger.warning(
                f"获取连接池实时状态失败: {str(e)}",
                extra={"error_type": e.__class__.__name__, "error_details": str(e)},
            )

        return stats


def log_connection_pool_stats():
    """
    记录连接池统计信息到日志
    定期调用此函数以监控连接池状态
    """
    stats = get_connection_pool_stats()
    logger.info("数据库连接池状态", extra={"connection_pool_stats": stats})


def health_check() -> dict:
    """
    数据库健康检查

    Returns:
        dict: 健康检查结果
    """
    try:
        # 尝试执行简单查询
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        # 获取连接池状态
        stats = get_connection_pool_stats()

        return {"status": "healthy", "timestamp": time.time(), "connection_pool": stats}
    except Exception as e:
        logger.error(
            f"数据库健康检查失败: {str(e)}",
            extra={"error_type": e.__class__.__name__, "error_details": str(e)},
        )
        return {"status": "unhealthy", "timestamp": time.time(), "error": str(e)}

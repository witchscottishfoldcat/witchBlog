"""
应用初始化服务层

统一管理所有初始化逻辑，按功能模块分离初始化操作
"""
import platform
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from app.core.config import settings

# 延迟导入，避免循环依赖
logger = None


def _get_logger():
    """延迟获取日志器"""
    global logger
    if logger is None:
        from app.core.unified_logging import get_logger

        logger = get_logger("init_service")
    return logger


class InitPhase(str, Enum):
    """初始化阶段枚举"""

    LOGGING = "logging"
    DATABASE = "database"
    STORAGE = "storage"
    CACHE = "cache"
    EXTERNAL = "external"


@dataclass
class InitResult:
    """初始化结果"""

    success: bool
    phase: InitPhase
    name: str
    message: str = ""
    error: Optional[Exception] = None
    details: Dict[str, Any] = field(default_factory=dict)


class InitService:
    """
    应用初始化服务

    统一管理所有初始化操作，支持：
    - 按阶段分离初始化逻辑
    - 初始化结果收集
    - 错误处理与降级
    - 启动信息展示
    """

    def __init__(self):
        self._results: List[InitResult] = []
        self._initialized = False

    @property
    def results(self) -> List[InitResult]:
        """获取所有初始化结果"""
        return self._results

    @property
    def all_success(self) -> bool:
        """检查是否所有初始化都成功"""
        return all(r.success for r in self._results)

    @property
    def failed_results(self) -> List[InitResult]:
        """获取失败的初始化结果"""
        return [r for r in self._results if not r.success]

    def _add_result(self, result: InitResult) -> None:
        """添加初始化结果"""
        self._results.append(result)
        log = _get_logger()
        if result.success:
            log.info(f"✅ {result.name}: {result.message}", extra=result.details)
        else:
            log.error(f"❌ {result.name}: {result.message}", extra=result.details)

    # ==================== 日志初始化 ====================

    def init_logging(self) -> InitResult:
        """
        初始化统一日志系统

        - 配置 loguru
        - 拦截所有标准 logging 调用
        """
        try:
            from app.core.unified_logging import init_logging

            # 初始化统一日志
            init_logging(
                log_level=getattr(settings, "LOG_LEVEL", "INFO"),
                log_file=getattr(settings, "LOG_FILE", "logs/app.log"),
                service_name=settings.PROJECT_NAME,
                environment=getattr(settings, "ENVIRONMENT", "development"),
            )

            result = InitResult(
                success=True,
                phase=InitPhase.LOGGING,
                name="日志系统",
                message="统一日志系统初始化完成",
            )
        except Exception as e:
            result = InitResult(
                success=False,
                phase=InitPhase.LOGGING,
                name="日志系统",
                message=f"日志系统初始化失败: {e}",
                error=e,
            )

        self._add_result(result)
        return result

    # ==================== 数据库初始化 ====================

    def init_database(self) -> InitResult:
        """
        初始化数据库

        - 检查数据库连接
        - 确保所有表存在
        """
        try:
            from app.core.database import Base, engine
            from app.core.db_manager import ensure_database_tables

            # 确保所有数据库表都存在
            ensure_database_tables(engine)

            result = InitResult(
                success=True,
                phase=InitPhase.DATABASE,
                name="数据库",
                message="数据库表检查完成",
                details={
                    "database_url": "mysql+pymysql://***:***@***/witchcat",
                    "pool_config": {
                        "pool_size": 3,
                        "max_overflow": 5,
                        "pool_timeout": 30,
                        "pool_recycle": 1800,
                        "pool_pre_ping": True,
                    },
                },
            )
        except Exception:
            # 保留原有的创建方式作为后备
            try:
                from app.core.database import Base, engine

                Base.metadata.create_all(bind=engine)
                result = InitResult(
                    success=True,
                    phase=InitPhase.DATABASE,
                    name="数据库",
                    message="数据库表创建完成(后备方式)",
                    details={"fallback": True},
                )
            except Exception as fallback_error:
                result = InitResult(
                    success=False,
                    phase=InitPhase.DATABASE,
                    name="数据库",
                    message=f"数据库初始化失败: {fallback_error}",
                    error=fallback_error,
                )

        self._add_result(result)
        return result

    # ==================== MinIO 存储初始化 ====================

    def init_minio(self) -> InitResult:
        """
        初始化 MinIO 对象存储

        - 设置公共访问策略
        - 确保桶存在
        """
        log = _get_logger()
        try:
            from app.services.minio_policy_service import minio_policy_service

            log.info("使用统一权限管理服务设置MinIO策略...")

            if minio_policy_service.setup_all_policies():
                result = InitResult(
                    success=True,
                    phase=InitPhase.STORAGE,
                    name="MinIO存储",
                    message="MinIO公共访问权限设置成功",
                    details={
                        "endpoint": settings.MINIO_ENDPOINT,
                        "policies_applied": True,
                    },
                )
            else:
                result = InitResult(
                    success=False,
                    phase=InitPhase.STORAGE,
                    name="MinIO存储",
                    message="MinIO公共访问权限设置失败",
                )
        except Exception as e:
            log.exception("设置MinIO公共访问策略时发生错误")
            result = InitResult(
                success=False,
                phase=InitPhase.STORAGE,
                name="MinIO存储",
                message=f"MinIO初始化失败: {e}",
                error=e,
            )

        self._add_result(result)
        return result

    # ==================== 统一初始化入口 ====================

    async def initialize_all(self) -> bool:
        """
        执行所有初始化操作

        按顺序初始化：
        1. 日志系统
        2. 数据库
        3. MinIO 存储

        Returns:
            bool: 所有关键初始化是否成功
        """
        # 1. 首先初始化日志系统
        self.init_logging()

        log = _get_logger()

        if self._initialized:
            log.warning("初始化服务已经执行过，跳过重复初始化")
            return self.all_success

        log.info("开始应用初始化...")

        # 2. 数据库初始化
        self.init_database()

        # 3. MinIO 存储初始化
        self.init_minio()

        self._initialized = True

        # 输出初始化摘要
        self._log_init_summary()

        return self.all_success

    def _log_init_summary(self) -> None:
        """输出初始化摘要"""
        total = len(self._results)
        success_count = sum(1 for r in self._results if r.success)

        log = _get_logger()
        log.info(f"初始化完成: {success_count}/{total} 成功")

    # ==================== 启动信息 ====================

    def get_startup_message(self) -> str:
        """
        生成启动消息

        Returns:
            str: 格式化的启动消息
        """
        host = "127.0.0.1" if settings.HOST == "0.0.0.0" else settings.HOST
        base_url = f"http://{host}:{settings.PORT}"

        # 构建初始化状态指示器
        status_indicators = []
        for result in self._results:
            icon = "✓" if result.success else "✗"
            status_indicators.append(f"  {icon} {result.name}")

        status_section = (
            "\n".join(status_indicators) if status_indicators else "  (无初始化记录)"
        )

        message = f"""
{'='*70}
{settings.PROJECT_NAME} v{settings.VERSION}
{'='*70}
服务地址: {base_url}
API 文档: {base_url}/docs
环境模式: {settings.ENVIRONMENT}
{'='*70}
初始化状态:
{status_section}
{'='*70}
"""
        return message

    def log_startup_info(self) -> None:
        """记录启动信息到日志"""
        host = "127.0.0.1" if settings.HOST == "0.0.0.0" else settings.HOST
        base_url = f"http://{host}:{settings.PORT}"

        log = _get_logger()
        log.info(f"服务启动完成 - {base_url}")

    def get_startup_info(self) -> Dict[str, Any]:
        """
        获取启动信息（用于日志记录）

        Returns:
            Dict: 启动信息字典
        """
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "host": settings.HOST,
            "port": settings.PORT,
            "python_version": platform.python_version(),
            "platform": platform.platform(),
        }

    # ==================== 关闭处理 ====================

    async def shutdown(self) -> None:
        """
        应用关闭时的清理操作
        """
        log = _get_logger()
        log.info("服务正在关闭...")

        # 可以在这里添加资源释放逻辑
        # 例如：关闭数据库连接池、断开 Redis 等

        self._initialized = False
        self._results.clear()

        log.info("服务已关闭")


# 全局初始化服务实例
init_service = InitService()

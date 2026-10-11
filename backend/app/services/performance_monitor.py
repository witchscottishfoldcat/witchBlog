"""
性能监控服务 - 提供系统、应用、数据库和业务性能指标
"""
import threading
import time
from datetime import datetime
from typing import Any, Dict

try:
    import psutil

    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

from app.core.config import settings
from app.core.database import get_connection_pool_stats, health_check
from app.core.unified_logging import get_logger
from app.schemas.admin import (
    ApplicationPerformanceMetrics,
    BusinessMetrics,
    DatabasePerformanceMetrics,
    PerformanceResponse,
    SystemPerformanceMetrics,
)

logger = get_logger(__name__)


class PerformanceMonitor:
    """性能监控器"""

    def __init__(self):
        self.start_time = datetime.now()
        self.request_count = 0
        self.error_count = 0
        self.request_times = []
        self._lock = threading.Lock()
        self._cache = {}
        self._cache_timeout = 5
        self._last_cache_time = 0

    def record_request(self, response_time_ms: float, is_error: bool = False):
        """记录请求"""
        with self._lock:
            self.request_count += 1
            if is_error:
                self.error_count += 1
            self.request_times.append(response_time_ms)

            if len(self.request_times) > 1000:
                self.request_times = self.request_times[-1000:]

    def get_system_metrics(self) -> SystemPerformanceMetrics:
        """获取系统性能指标"""
        if not PSUTIL_AVAILABLE:
            logger.warning("psutil 未安装，无法获取系统性能指标")
            return SystemPerformanceMetrics(
                cpu_percent=0.0,
                cpu_count=0,
                memory_total=0,
                memory_used=0,
                memory_percent=0.0,
                disk_total=0,
                disk_used=0,
                disk_percent=0.0,
                network_sent=0,
                network_recv=0,
                boot_time=datetime.now(),
                uptime=0,
            )

        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()

            memory = psutil.virtual_memory()
            memory_total_mb = memory.total / (1024 * 1024)
            memory_used_mb = memory.used / (1024 * 1024)
            memory_percent = memory.percent

            disk = psutil.disk_usage("/")
            disk_total_mb = disk.total / (1024 * 1024)
            disk_used_mb = disk.used / (1024 * 1024)
            disk_percent = disk.percent

            net_io = psutil.net_io_counters()
            network_sent = net_io.bytes_sent if net_io else 0
            network_recv = net_io.bytes_recv if net_io else 0

            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = int((datetime.now() - boot_time).total_seconds())

            return SystemPerformanceMetrics(
                cpu_percent=cpu_percent,
                cpu_count=cpu_count,
                memory_total=int(memory_total_mb),
                memory_used=int(memory_used_mb),
                memory_percent=memory_percent,
                disk_total=int(disk_total_mb),
                disk_used=int(disk_used_mb),
                disk_percent=disk_percent,
                network_sent=network_sent,
                network_recv=network_recv,
                boot_time=boot_time,
                uptime=uptime,
            )
        except Exception as e:
            logger.error(f"获取系统性能指标失败: {e}")
            return SystemPerformanceMetrics(
                cpu_percent=0.0,
                cpu_count=0,
                memory_total=0,
                memory_used=0,
                memory_percent=0.0,
                disk_total=0,
                disk_used=0,
                disk_percent=0.0,
                network_sent=0,
                network_recv=0,
                boot_time=datetime.now(),
                uptime=0,
            )

    def get_application_metrics(self, db_session) -> ApplicationPerformanceMetrics:
        """获取应用性能指标"""
        with self._lock:
            total_requests = self.request_count

        uptime = int((datetime.now() - self.start_time).total_seconds())

        with self._lock:
            if self.request_times:
                avg_response_time = sum(self.request_times) / len(self.request_times)
            else:
                avg_response_time = 0.0

            error_count = self.error_count
            request_count = self.request_count

        error_rate = (error_count / request_count * 100) if request_count > 0 else 0.0

        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_requests = self._get_today_request_count(db_session, today_start)

        active_connections = self._get_active_connections()

        return ApplicationPerformanceMetrics(
            total_requests=total_requests,
            today_requests=today_requests,
            average_response_time=round(avg_response_time, 2),
            error_rate=round(error_rate, 2),
            active_connections=active_connections,
            uptime=uptime,
            start_time=self.start_time,
        )

    def get_database_metrics(self) -> DatabasePerformanceMetrics:
        """获取数据库性能指标"""
        try:
            pool_stats = get_connection_pool_stats()
            health_result = health_check()

            return DatabasePerformanceMetrics(
                pool_size=pool_stats.get("pool_size", 0),
                checked_out=pool_stats.get("checked_out", 0),
                checked_in=pool_stats.get("checked_in", 0),
                invalid=pool_stats.get("invalid", 0),
                total_connections=pool_stats.get("total_connections", 0),
                connection_errors=pool_stats.get("connection_errors", 0),
                status=health_result.get("status", "unknown"),
            )
        except Exception as e:
            logger.error(f"获取数据库性能指标失败: {e}")
            return DatabasePerformanceMetrics(
                pool_size=0,
                checked_out=0,
                checked_in=0,
                invalid=0,
                total_connections=0,
                connection_errors=0,
                status="error",
            )

    def get_business_metrics(self, db_session) -> BusinessMetrics:
        """获取业务指标"""
        try:
            from app.models.album import Album
            from app.models.diary import Diary
            from app.models.user import User

            total_users = db_session.query(User).count()
            active_users = (
                db_session.query(User).filter(User.is_active.is_(True)).count()
            )

            total_diaries = db_session.query(Diary).count()
            total_albums = db_session.query(Album).count()

            total_photos = 0
            for album in db_session.query(Album).all():
                if hasattr(album, "photos"):
                    total_photos += len(album.photos)

            total_visitors, today_visitors = self._get_visitor_stats(db_session)

            return BusinessMetrics(
                total_users=total_users,
                active_users=active_users,
                total_diaries=total_diaries,
                total_albums=total_albums,
                total_photos=total_photos,
                total_visitors=total_visitors,
                today_visitors=today_visitors,
            )
        except Exception as e:
            logger.error(f"获取业务指标失败: {e}")
            return BusinessMetrics(
                total_users=0,
                active_users=0,
                total_diaries=0,
                total_albums=0,
                total_photos=0,
                total_visitors=0,
                today_visitors=0,
            )

    def _get_today_request_count(self, db_session, today_start: datetime) -> int:
        """获取今日请求数"""
        try:
            from sqlalchemy import text

            result = db_session.execute(
                text(
                    "SELECT COUNT(*) FROM request_logs WHERE created_at >= :today_start"
                ),
                {"today_start": today_start},
            )
            return result.scalar() or 0
        except Exception as e:
            logger.debug(f"获取今日请求数失败: {e}")
            return 0

    def _get_active_connections(self) -> int:
        """获取活跃连接数"""
        try:
            pass

            from app.core.database import engine

            pool = engine.pool

            return pool.checkedout() if hasattr(pool, "checkedout") else 0
        except Exception as e:
            logger.debug(f"获取活跃连接数失败: {e}")
            return 0

    def _get_visitor_stats(self, db_session) -> tuple:
        """获取访问者统计"""
        try:
            from sqlalchemy import text

            today_start = datetime.now().replace(
                hour=0, minute=0, second=0, microsecond=0
            )

            total_visitors = (
                db_session.execute(
                    text("SELECT COUNT(DISTINCT ip_address) FROM request_logs")
                ).scalar()
                or 0
            )

            today_visitors = (
                db_session.execute(
                    text(
                        "SELECT COUNT(DISTINCT ip_address) FROM request_logs "
                        "WHERE created_at >= :today_start"
                    ),
                    {"today_start": today_start},
                ).scalar()
                or 0
            )

            return total_visitors, today_visitors
        except Exception as e:
            logger.debug(f"获取访问者统计失败: {e}")
            return 0, 0

    def get_all_metrics(
        self, db_session, use_cache: bool = True
    ) -> PerformanceResponse:
        """获取所有性能指标"""
        cache_key = f"metrics_{int(time.time() // self._cache_timeout)}"

        if use_cache and self._cache.get("key") == cache_key:
            logger.debug("使用缓存的性能指标")
            return self._cache["data"]

        try:
            system_metrics = self.get_system_metrics()
            application_metrics = self.get_application_metrics(db_session)
            database_metrics = self.get_database_metrics()
            business_metrics = self.get_business_metrics(db_session)

            response = PerformanceResponse(
                timestamp=datetime.now(),
                system=system_metrics,
                application=application_metrics,
                database=database_metrics,
                business=business_metrics,
            )

            self._cache = {"key": cache_key, "data": response, "time": time.time()}

            return response
        except Exception as e:
            logger.error(f"获取性能指标失败: {e}")
            raise

    def get_system_status(self) -> Dict[str, Any]:
        """获取系统状态"""
        try:
            status = "healthy"
            components = {}
            health_checks = {}

            database_health = health_check()
            components["database"] = database_health.get("status", "unknown")
            health_checks["database"] = database_health

            if database_health.get("status") != "healthy":
                status = "degraded"

            system_metrics = self.get_system_metrics()
            if system_metrics.cpu_percent > 90 or system_metrics.memory_percent > 90:
                status = "degraded"

            if system_metrics.cpu_percent > 95 or system_metrics.memory_percent > 95:
                status = "unhealthy"

            uptime = int((datetime.now() - self.start_time).total_seconds())

            return {
                "status": status,
                "timestamp": datetime.now(),
                "uptime": uptime,
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
                "components": components,
                "health_checks": health_checks,
            }
        except Exception as e:
            logger.error(f"获取系统状态失败: {e}")
            return {
                "status": "unhealthy",
                "timestamp": datetime.now(),
                "uptime": 0,
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
                "components": {},
                "health_checks": {},
            }


_performance_monitor = None


def get_performance_monitor() -> PerformanceMonitor:
    """获取性能监控器单例"""
    global _performance_monitor
    if _performance_monitor is None:
        _performance_monitor = PerformanceMonitor()
    return _performance_monitor

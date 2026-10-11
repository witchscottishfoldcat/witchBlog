"""
请求统计中间件
"""
import queue
import threading
import time
from datetime import datetime, timedelta

from anyio import EndOfStream
from fastapi import Request, Response
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.database import SessionLocal
from app.core.unified_logging import get_logger
from app.services.site_stats_service import record_request

logger = get_logger(__name__)

# 请求日志写入队列：有界，防止突发流量下积压过多任务
# 满了直接丢弃当前请求日志（统计非关键路径），避免无限增长压垮 DB
_REQUEST_LOG_QUEUE: "queue.Queue" = queue.Queue(maxsize=10000)
# 消费者批量写入的批大小与等待时长
_LOG_BATCH_SIZE = 50
_LOG_BATCH_TIMEOUT_SECONDS = 2.0
# 消费者线程句柄（单例）
_LOG_CONSUMER_THREAD: threading.Thread | None = None
_LOG_CONSUMER_LOCK = threading.Lock()


def _request_log_consumer():
    """后台消费者：从队列批量取请求日志写入 DB，避免每请求一线程压垮连接池"""
    while True:
        batch = []
        try:
            # 阻塞等待第一条
            first = _REQUEST_LOG_QUEUE.get(timeout=_LOG_BATCH_TIMEOUT_SECONDS)
            batch.append(first)
            # 非阻塞地尽量多取，凑批
            while len(batch) < _LOG_BATCH_SIZE:
                try:
                    batch.append(_REQUEST_LOG_QUEUE.get_nowait())
                except queue.Empty:
                    break
        except queue.Empty:
            continue

        if not batch:
            continue

        db = SessionLocal()
        try:
            now = datetime.now()
            db.execute(
                text(
                    """
                INSERT INTO request_logs
                (ip_address, path, method, referrer, user_agent, created_at)
                VALUES (:ip, :path, :method, :referrer, :user_agent, :created_at)
                """
                ),
                [
                    {
                        "ip": item["ip"],
                        "path": item["path"],
                        "method": item["method"],
                        "referrer": item["referrer"],
                        "user_agent": item.get("user_agent"),
                        "created_at": item["created_at"],
                    }
                    for item in batch
                ],
            )
            db.commit()
            # 顺带清理旧日志（消费者单线程，无需额外锁）
            _cleanup_old_logs(db, now)
        except Exception as e:
            logger.error(f"批量记录请求到数据库失败: {e}")
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            try:
                db.close()
            except Exception as e:
                logger.warning(f"关闭数据库连接时发生异常: {e}")


def _ensure_log_consumer():
    """确保消费者线程已启动（惰性启动，线程安全）"""
    global _LOG_CONSUMER_THREAD
    if _LOG_CONSUMER_THREAD is not None and _LOG_CONSUMER_THREAD.is_alive():
        return
    with _LOG_CONSUMER_LOCK:
        if _LOG_CONSUMER_THREAD is not None and _LOG_CONSUMER_THREAD.is_alive():
            return
        _LOG_CONSUMER_THREAD = threading.Thread(
            target=_request_log_consumer, daemon=True, name="request-log-consumer"
        )
        _LOG_CONSUMER_THREAD.start()


def _cleanup_old_logs(db: Session, now: datetime):
    """清理旧的请求日志（只在每天凌晨执行一次）"""
    try:
        if now.hour == 0 and now.minute < 5:
            cutoff_date = now - timedelta(days=30)
            result = db.execute(
                text("DELETE FROM request_logs WHERE created_at < :cutoff"),
                {"cutoff": cutoff_date},
            )
            rowcount = result.rowcount  # type: ignore[attr-defined]
            if rowcount > 0:
                logger.info(f"清理了 {rowcount} 条旧的请求日志")
            db.commit()
    except Exception as e:
        logger.error(f"清理旧日志失败: {e}")


class RequestStatsMiddleware(BaseHTTPMiddleware):
    """请求统计中间件"""

    def __init__(self, app):
        super().__init__(app)
        self._table_created = False

    async def dispatch(self, request: Request, call_next):
        # 记录请求开始时间
        start_time = time.time()

        # 确保日志表已创建（延迟到第一次请求时）
        if not self._table_created:
            self._create_request_logs_table()
            self._table_created = True

        # 获取客户端IP
        client_ip = self._get_client_ip(request)

        # 获取请求路径
        path = request.url.path

        # 获取来源
        referrer = request.headers.get("referer")

        # 记录请求（用于基本统计）
        record_request(client_ip, path, referrer)

        # 记录到数据库（入队，由单消费者线程批量写入）
        try:
            _ensure_log_consumer()
            _REQUEST_LOG_QUEUE.put_nowait(
                {
                    "ip": client_ip,
                    "path": path,
                    "method": request.method,
                    "referrer": referrer,
                    "user_agent": request.headers.get("user-agent"),
                    "created_at": datetime.now(),
                }
            )
        except queue.Full:
            # 队列满则丢弃，统计非关键路径，不能影响主请求
            logger.debug("请求日志队列已满，丢弃当前请求记录")
        except Exception as e:
            logger.error(f"入队请求统计失败: {e}")

        # 继续处理请求，捕获客户端断开等异常
        is_error = False
        status_code = 200
        try:
            response = await call_next(request)
            status_code = response.status_code
            is_error = status_code >= 400
            return response
        except EndOfStream:
            # 客户端提前断开连接，这是正常情况，不需要记录为错误
            logger.debug(f"客户端断开连接: {client_ip} -> {path}")
            return Response(status_code=200, content="")  # 返回200状态避免记录错误
        except Exception as e:
            # 其他异常继续抛出
            is_error = True
            logger.error(f"请求处理异常: {type(e).__name__}: {e}")
            raise
        finally:
            # 记录请求响应时间到性能监控器
            try:
                from app.services.performance_monitor import get_performance_monitor

                response_time_ms = (time.time() - start_time) * 1000
                performance_monitor = get_performance_monitor()
                performance_monitor.record_request(response_time_ms, is_error)
            except Exception as e:
                logger.debug(f"记录性能指标失败: {e}")

    def _get_client_ip(self, request: Request) -> str:
        """获取客户端IP地址（与限流统一口径，见 rate_limit.client_ip）"""
        from app.core.rate_limit import client_ip

        return client_ip(request)

    def _create_request_logs_table(self):
        """创建请求日志表（如果不存在）"""
        db = None
        try:
            db = SessionLocal()
            # 检查表是否存在
            result = db.execute(text("SHOW TABLES LIKE 'request_logs'")).fetchall()
            if not result:
                # 表不存在，创建表
                db.execute(
                    text(
                        """
                    CREATE TABLE request_logs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        ip_address VARCHAR(45) NOT NULL,
                        path VARCHAR(500) NOT NULL,
                        method VARCHAR(10) NOT NULL,
                        referrer VARCHAR(500),
                        user_agent TEXT,
                        created_at DATETIME NOT NULL,
                        INDEX idx_ip_address (ip_address),
                        INDEX idx_created_at (created_at),
                        INDEX idx_path (path)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """
                    )
                )
                db.commit()
                logger.info("请求日志表创建完成")
        except Exception as e:
            logger.error(f"创建请求日志表失败: {e}")
        finally:
            if db is not None:
                try:
                    db.close()
                except Exception as e:
                    logger.warning(f"关闭数据库连接时发生异常: {e}")

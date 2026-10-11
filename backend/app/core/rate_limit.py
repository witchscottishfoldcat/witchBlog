"""
进程内滑动窗口限流器

适用于单实例部署的轻量限流（登录防爆破、注册防滥用、AI 接口配额）。
多实例部署时应换用 Redis 等共享存储实现。
"""
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from app.core.config import settings
from app.core.unified_logging import get_logger

logger = get_logger(__name__)

# 触发全量清理的键数量阈值，防止长期运行内存无限增长
_MAX_KEYS = 100_000


class SlidingWindowRateLimiter:
    """基于滑动窗口的计数限流器（线程安全）"""

    def __init__(self, max_events: int, window_seconds: float):
        self.max_events = max_events
        self.window_seconds = window_seconds
        self._events: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        """判断 key 在当前窗口内是否还允许一次事件"""
        now = time.monotonic()
        with self._lock:
            if len(self._events) > _MAX_KEYS:
                self._cleanup(now)
            q = self._events[key]
            window_start = now - self.window_seconds
            while q and q[0] <= window_start:
                q.popleft()
            if len(q) >= self.max_events:
                return False
            q.append(now)
            return True

    def remaining(self, key: str) -> int:
        """当前窗口内剩余可用次数（用于日志/调试）"""
        now = time.monotonic()
        with self._lock:
            q = self._events.get(key)
            if not q:
                return self.max_events
            window_start = now - self.window_seconds
            while q and q[0] <= window_start:
                q.popleft()
            return max(0, self.max_events - len(q))

    def _cleanup(self, now: float) -> None:
        stale = [
            k
            for k, q in self._events.items()
            if not q or now - q[-1] > self.window_seconds
        ]
        for k in stale:
            del self._events[k]
        if stale:
            logger.debug(f"限流器清理了 {len(stale)} 个过期键")


def client_ip(request) -> str:
    """获取客户端IP（全项目统一口径：限流、统计、日志共用）。

    默认只信任传输层地址，不读可伪造的 X-Forwarded-For；
    部署在可信反向代理之后时，配置 TRUSTED_PROXY_HOPS=N（N=代理层数），
    取 X-Forwarded-From 右起第 N 跳——即最近一层可信代理记录的来源地址。
    """
    hops = settings.TRUSTED_PROXY_HOPS
    if hops > 0:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            parts = [p.strip() for p in xff.split(",") if p.strip()]
            if len(parts) >= hops:
                return parts[-hops]

    return request.client.host if request.client else "unknown"

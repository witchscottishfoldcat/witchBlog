"""进程内日志环形缓冲：供后台「实时日志-后端日志」查看。

通过 loguru sink 收集 INFO 及以上级别的结构化日志（请求处理、告警、异常），
容量有界，后端重启即清空。单进程设计（uvicorn 单 worker）；
多 worker 部署时各进程各自收集，接口只返回当前进程的日志。
"""
import threading
from collections import deque
from typing import Any, Dict, List, Optional, Tuple

# 单条日志内容的截断上限，防止异常堆栈/超长消息撑爆响应
MAX_MESSAGE_CHARS = 2000
MAX_TRACEBACK_CHARS = 4000


class LogBuffer:
    """线程安全的有界日志缓冲，seq 单调递增作为拉取游标"""

    def __init__(self, maxlen: int = 2000):
        self._entries: deque = deque(maxlen=maxlen)
        self._lock = threading.Lock()
        self._seq = 0

    def append(
        self,
        *,
        time: Any,
        level: str,
        logger_name: str,
        message: str,
        traceback_text: Optional[str] = None,
    ) -> int:
        with self._lock:
            self._seq += 1
            entry: Dict[str, Any] = {
                "seq": self._seq,
                "time": time.isoformat() if hasattr(time, "isoformat") else str(time),
                "level": level,
                "logger": logger_name,
                "message": message[:MAX_MESSAGE_CHARS],
            }
            if traceback_text:
                entry["traceback"] = traceback_text[:MAX_TRACEBACK_CHARS]
            self._entries.append(entry)
            return self._seq

    def read_after(
        self, after_seq: int, limit: int
    ) -> Tuple[List[Dict[str, Any]], int]:
        """返回 seq 大于 after_seq 的最新 limit 条（升序），及最新 seq 游标"""
        with self._lock:
            entries = [e for e in self._entries if e["seq"] > after_seq]
        entries = entries[-limit:]
        last_seq = entries[-1]["seq"] if entries else after_seq
        return entries, last_seq


_log_buffer: Optional[LogBuffer] = None
_sink_installed = False


def get_log_buffer() -> LogBuffer:
    """获取日志缓冲单例"""
    global _log_buffer
    if _log_buffer is None:
        _log_buffer = LogBuffer()
    return _log_buffer


def install_log_buffer_sink() -> None:
    """向 loguru 注册环形缓冲 sink（幂等，重复调用只安装一次）"""
    global _sink_installed
    if _sink_installed:
        return

    from loguru import logger as loguru_logger

    buffer = get_log_buffer()

    def _sink(message) -> None:
        record = message.record
        traceback_text = None
        if record.get("exception"):
            import traceback as traceback_mod

            traceback_text = "".join(
                traceback_mod.format_exception(*record["exception"])
            )
        buffer.append(
            time=record["time"],
            level=record["level"].name,
            logger_name=record.get("name") or "",
            message=str(record["message"]),
            traceback_text=traceback_text,
        )

    loguru_logger.add(_sink, level="INFO")
    _sink_installed = True

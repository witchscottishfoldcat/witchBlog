"""
日志流服务 - 提供实时日志推送功能
使用 Server-Sent Events (SSE) 实现实时日志流
"""
import asyncio
import json
import re
import threading
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, Dict, Optional, Set

from app.core.config import settings
from app.core.unified_logging import get_logger
from app.schemas.admin import LogEntry

logger = get_logger(__name__)


class LogStreamService:
    """日志流服务"""

    def __init__(self):
        self._active_connections: Set[asyncio.Queue] = set()
        self._log_file_path: Optional[Path] = None
        self._last_position: Dict[str, int] = {}
        self._buffer_size = 1000
        self._log_buffer: deque = deque(maxlen=self._buffer_size)
        self._initialized = False
        self._lock = threading.Lock()

    def initialize(self):
        """初始化日志流服务"""
        if self._initialized:
            return

        with self._lock:
            if self._initialized:
                return

            try:
                log_file = getattr(settings, "LOG_FILE", "logs/app.log")
                self._log_file_path = Path(log_file)

                if not self._log_file_path.exists():
                    logger.warning(f"日志文件不存在: {log_file}")
                    self._log_file_path = None
                else:
                    logger.info(f"日志流服务初始化成功，日志文件: {log_file}")

                self._initialized = True
            except Exception as e:
                logger.error(f"日志流服务初始化失败: {e}")
                self._log_file_path = None
                self._initialized = True

    def parse_log_line(self, line: str) -> Optional[LogEntry]:
        """解析日志行"""
        try:
            if not line.strip():
                return None

            # 格式1: 2026-02-09 13:11:24 | INFO | module - message
            pattern1 = (
                r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s*\|\s*"
                r"(\w+)\s*\|\s*(.+?)\s*-\s*(.+)"
            )
            match = re.match(pattern1, line.strip())

            if match:
                timestamp_str, level, module, message = match.groups()
                context = self._parse_context(message)
                if context:
                    message = message[: message.rfind("[")].strip()

                return LogEntry(
                    timestamp=timestamp_str,
                    level=level,
                    module=module,
                    message=message,
                    context=context,
                )

            # 格式2: 2025-11-18 13:15:32,815 - module - INFO - message
            pattern2 = (
                r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?)\s*-\s*"
                r"(.+?)\s*-\s*(\w+)\s*-\s*(.+)"
            )
            match = re.match(pattern2, line.strip())

            if match:
                timestamp_str, module, level, message = match.groups()
                context = self._parse_context(message)
                if context:
                    message = message[: message.rfind("[")].strip()

                return LogEntry(
                    timestamp=timestamp_str,
                    level=level,
                    module=module,
                    message=message,
                    context=context,
                )

            # 无法解析的行，返回原始内容
            return LogEntry(
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                level="RAW",
                module="unknown",
                message=line.strip(),
                context=None,
            )
        except Exception as e:
            logger.debug(f"解析日志行失败: {e}")
            return None

    def _parse_context(self, message: str) -> Optional[Dict[str, str]]:
        """解析日志上下文信息"""
        if "[" in message and "]" in message:
            try:
                context_part = message[message.rfind("[") : message.rfind("]") + 1]
                context_data = context_part.strip("[]")

                context = {}
                for item in context_data.split(", "):
                    if "=" in item:
                        key, value = item.split("=", 1)
                        context[key.strip()] = value.strip()

                return context
            except Exception as e:
                logger.debug(f"解析日志上下文失败: {e}")
        return None

    def _filter_log_entry(
        self, entry: LogEntry, level: Optional[str] = None, module: Optional[str] = None
    ) -> bool:
        """过滤日志条目"""
        if level and entry.level != level:
            return False
        if module and module not in entry.module:
            return False
        return True

    async def stream_logs(
        self,
        level: Optional[str] = None,
        module: Optional[str] = None,
        initial_lines: int = 100,
        follow: bool = True,
    ) -> AsyncGenerator[str, None]:
        """流式推送日志"""
        if not self._initialized:
            self.initialize()

        if not self._log_file_path:
            logger.error("日志文件路径未配置")
            yield f"data: {json.dumps({'error': '日志文件未配置'})}\n\n"
            return

        try:
            async for log_line in self._send_initial_logs(level, module, initial_lines):
                yield log_line

            if follow:
                async for log_line in self._follow_new_logs(level, module):
                    yield log_line
        except Exception as e:
            logger.error(f"日志流推送失败: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    async def _send_initial_logs(
        self, level: Optional[str], module: Optional[str], lines: int
    ):
        """发送初始日志"""
        log_path = self._log_file_path
        if log_path is None:
            return
        try:
            with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                all_lines = f.readlines()

            filtered_lines = []
            for line in all_lines:
                entry = self.parse_log_line(line)
                if entry and self._filter_log_entry(entry, level, module):
                    filtered_lines.append(entry)

            initial_lines = (
                filtered_lines[-lines:]
                if len(filtered_lines) > lines
                else filtered_lines
            )

            for entry in initial_lines:
                yield f"data: {entry.json()}\n\n"
                await asyncio.sleep(0.01)

        except Exception as e:
            logger.error(f"发送初始日志失败: {e}")

    async def _follow_new_logs(self, level: Optional[str], module: Optional[str]):
        """跟踪新日志"""
        log_path = self._log_file_path
        if log_path is None:
            return
        last_size = log_path.stat().st_size

        try:
            while True:
                try:
                    current_size = log_path.stat().st_size

                    if current_size > last_size:
                        with open(
                            log_path, "r", encoding="utf-8", errors="ignore"
                        ) as f:
                            f.seek(last_size)
                            new_lines = f.readlines()

                        for line in new_lines:
                            entry = self.parse_log_line(line)
                            if entry and self._filter_log_entry(entry, level, module):
                                yield f"data: {entry.json()}\n\n"

                        last_size = current_size

                    await asyncio.sleep(0.5)
                except FileNotFoundError:
                    logger.warning("日志文件被删除，等待重新创建")
                    await asyncio.sleep(2)
                    if log_path.exists():
                        last_size = log_path.stat().st_size
                except Exception as e:
                    logger.error(f"跟踪新日志失败: {e}")
                    await asyncio.sleep(1)

        except asyncio.CancelledError:
            logger.info("日志流客户端断开")

    def get_log_files(self) -> list:
        """获取可用的日志文件列表"""
        try:
            log_dir = Path("logs")
            if not log_dir.exists():
                return []

            log_files = []
            for file in log_dir.glob("*.log"):
                stat = file.stat()
                log_files.append(
                    {
                        "name": file.name,
                        "path": str(file),
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    }
                )

            return sorted(log_files, key=lambda x: x["modified"], reverse=True)
        except Exception as e:
            logger.error(f"获取日志文件列表失败: {e}")
            return []

    def get_log_stats(self) -> dict:
        """获取日志统计信息"""
        try:
            if not self._log_file_path or not self._log_file_path.exists():
                return {
                    "total_lines": 0,
                    "error_count": 0,
                    "warning_count": 0,
                    "info_count": 0,
                    "debug_count": 0,
                    "file_size": 0,
                }

            with open(self._log_file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            stats = {
                "total_lines": len(lines),
                "error_count": 0,
                "warning_count": 0,
                "info_count": 0,
                "debug_count": 0,
                "file_size": self._log_file_path.stat().st_size,
            }

            for line in lines:
                if "| ERROR |" in line:
                    stats["error_count"] += 1
                elif "| WARNING |" in line:
                    stats["warning_count"] += 1
                elif "| INFO |" in line:
                    stats["info_count"] += 1
                elif "| DEBUG |" in line:
                    stats["debug_count"] += 1

            return stats
        except Exception as e:
            logger.error(f"获取日志统计信息失败: {e}")
            return {
                "total_lines": 0,
                "error_count": 0,
                "warning_count": 0,
                "info_count": 0,
                "debug_count": 0,
                "file_size": 0,
            }


_log_stream_service = None


def get_log_stream_service() -> LogStreamService:
    """获取日志流服务单例"""
    global _log_stream_service
    if _log_stream_service is None:
        _log_stream_service = LogStreamService()
        _log_stream_service.initialize()
    return _log_stream_service

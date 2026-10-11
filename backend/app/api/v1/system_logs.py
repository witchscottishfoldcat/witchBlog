"""后端运行日志实时查看API（仅超级管理员）

日志由 app.core.log_buffer 的 loguru sink 实时收集到进程内环形缓冲，
前端以 seq 游标增量拉取（类似 tail -f）。
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.api.deps import get_current_active_superuser
from app.core.log_buffer import get_log_buffer
from app.core.unified_logging import get_logger
from app.models.user import User

logger = get_logger(__name__)
router = APIRouter()


class LogEntry(BaseModel):
    """后端日志条目"""

    seq: int = Field(..., description="日志序号（游标）")
    time: str = Field(..., description="记录时间（ISO 格式）")
    level: str = Field(..., description="日志级别")
    logger: str = Field(..., description="日志器名称（模块）")
    message: str = Field(..., description="日志内容")
    traceback: Optional[str] = Field(None, description="异常堆栈（仅错误日志）")


class TailResponse(BaseModel):
    """日志拉取响应"""

    entries: List[LogEntry] = Field(default_factory=list, description="日志条目（升序）")
    last_seq: int = Field(..., description="最新序号，下次拉取作为 after_seq 传入")


@router.get("/tail", response_model=TailResponse)
async def tail_system_logs(
    after_seq: int = Query(0, ge=0, description="游标：只返回 seq 大于该值的日志；0 表示从头读取缓冲区"),
    limit: int = Query(200, ge=1, le=500, description="单次拉取条数"),
    current_user: User = Depends(get_current_active_superuser),
) -> TailResponse:
    """增量拉取后端运行日志。客户端轮询时传入上次响应的 last_seq。"""
    entries, last_seq = get_log_buffer().read_after(after_seq, limit)
    return TailResponse(
        entries=[LogEntry(**entry) for entry in entries], last_seq=last_seq
    )

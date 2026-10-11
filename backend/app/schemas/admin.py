from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class LogStreamRequest(BaseModel):
    """日志流请求参数"""

    level: Optional[str] = Field(
        None, description="日志级别过滤: DEBUG, INFO, WARNING, ERROR"
    )
    module: Optional[str] = Field(None, description="模块名过滤")
    lines: Optional[int] = Field(100, ge=1, le=10000, description="初始返回的日志行数")
    follow: Optional[bool] = Field(True, description="是否持续跟踪新日志")


class SystemPerformanceMetrics(BaseModel):
    """系统性能指标"""

    cpu_percent: float = Field(..., description="CPU使用率(%)")
    cpu_count: int = Field(..., description="CPU核心数")
    memory_total: int = Field(..., description="总内存(MB)")
    memory_used: int = Field(..., description="已用内存(MB)")
    memory_percent: float = Field(..., description="内存使用率(%)")
    disk_total: int = Field(..., description="总磁盘空间(MB)")
    disk_used: int = Field(..., description="已用磁盘空间(MB)")
    disk_percent: float = Field(..., description="磁盘使用率(%)")
    network_sent: int = Field(..., description="网络发送字节数")
    network_recv: int = Field(..., description="网络接收字节数")
    boot_time: datetime = Field(..., description="系统启动时间")
    uptime: int = Field(..., description="系统运行时间(秒)")


class ApplicationPerformanceMetrics(BaseModel):
    """应用性能指标"""

    total_requests: int = Field(..., description="总请求数")
    today_requests: int = Field(..., description="今日请求数")
    average_response_time: float = Field(..., description="平均响应时间(ms)")
    error_rate: float = Field(..., description="错误率(%)")
    active_connections: int = Field(..., description="活跃连接数")
    uptime: int = Field(..., description="应用运行时间(秒)")
    start_time: datetime = Field(..., description="应用启动时间")


class DatabasePerformanceMetrics(BaseModel):
    """数据库性能指标"""

    pool_size: int = Field(..., description="连接池大小")
    checked_out: int = Field(..., description="已取出连接数")
    checked_in: int = Field(..., description="已归还连接数")
    invalid: int = Field(..., description="无效连接数")
    total_connections: int = Field(..., description="总连接数")
    connection_errors: int = Field(..., description="连接错误数")
    status: str = Field(..., description="数据库状态")


class BusinessMetrics(BaseModel):
    """业务指标"""

    total_users: int = Field(..., description="总用户数")
    active_users: int = Field(..., description="活跃用户数")
    total_diaries: int = Field(..., description="总日记数")
    total_albums: int = Field(..., description="总相册数")
    total_photos: int = Field(..., description="总照片数")
    total_visitors: int = Field(..., description="总访问者数")
    today_visitors: int = Field(..., description="今日访问者数")


class PerformanceResponse(BaseModel):
    """性能监控响应"""

    timestamp: datetime = Field(..., description="时间戳")
    system: SystemPerformanceMetrics = Field(..., description="系统性能指标")
    application: ApplicationPerformanceMetrics = Field(..., description="应用性能指标")
    database: DatabasePerformanceMetrics = Field(..., description="数据库性能指标")
    business: BusinessMetrics = Field(..., description="业务指标")


class SystemStatusResponse(BaseModel):
    """系统状态响应"""

    status: str = Field(..., description="系统状态: healthy, degraded, unhealthy")
    timestamp: datetime = Field(..., description="检查时间")
    uptime: int = Field(..., description="运行时间(秒)")
    version: str = Field(..., description="版本号")
    environment: str = Field(..., description="运行环境")
    components: Dict[str, str] = Field(..., description="各组件状态")
    health_checks: Dict[str, Any] = Field(..., description="健康检查详情")


class DatabasePoolStatus(BaseModel):
    """数据库连接池状态"""

    pool_size: int = Field(..., description="连接池大小")
    max_overflow: int = Field(..., description="最大溢出连接数")
    checked_in: int = Field(..., description="已归还连接数")
    checked_out: int = Field(..., description="已取出连接数")
    overflow: int = Field(..., description="溢出连接数")
    invalid: int = Field(..., description="无效连接数")
    total_connections: int = Field(..., description="总连接数")
    connection_errors: int = Field(..., description="连接错误数")
    current_connections: int = Field(..., description="当前物理连接数")
    status: str = Field(..., description="连接池状态")


class LogEntry(BaseModel):
    """日志条目"""

    timestamp: str = Field(..., description="时间戳")
    level: str = Field(..., description="日志级别")
    module: str = Field(..., description="模块名")
    message: str = Field(..., description="日志消息")
    context: Optional[Dict[str, Any]] = Field(None, description="上下文信息")

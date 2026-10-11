# WitchCat 日志系统架构指南

## 概述

WitchCat 项目采用统一的日志系统，确保所有日志输出格式一致，便于监控、分析和调试。日志系统基于 Loguru 构建，并提供了对标准 Python logging 的完全兼容。

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    应用程序代码层                                │
├─────────────────────────────────────────────────────────────┤
│               统一日志层 (unified_logging)                    │
│  ┌─────────────────┐   ┌─────────────────────────────────┐  │
│  │  UnifiedLogger  │   │      InterceptHandler           │  │
│  │                 │   │     (标准logging拦截器)          │  │
│  └─────────────────┘   └─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      Loguru 核心层                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │ 控制台输出  │  │ 文件输出    │  │ 错误日志文件    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. UnifiedLogger

统一日志记录器，提供简洁的日志接口，支持上下文信息。

**特性：**
- 统一的日志格式
- 支持上下文信息（request_id, user_id 等）
- 自动格式化消息
- 异常处理支持

**使用方法：**
```python
from app.core.unified_logging import get_logger

logger = get_logger(__name__)

# 基本使用
logger.info("用户登录成功")
logger.error("数据库连接失败", exception=e)

# 带上下文信息
logger.info("API请求处理完成", extra={
    "request_id": "req-123",
    "duration_ms": 150,
    "status_code": 200
})
```

### 2. InterceptHandler

拦截标准 Python logging 消息并重定向到 Loguru，确保所有使用 `import logging` 的代码都通过统一日志系统输出。

**工作原理：**
1. 捕获所有标准 logging 输出
2. 转换为 Loguru 格式
3. 应用统一的格式和配置

### 3. 日志格式

**统一格式：**
```
{时间} | {级别} | {模块名} - {消息}
```

**示例：**
```
2025-12-15 10:20:29 | INFO     | main - 正在启动 WitchCat Enterprise API v1.0.0
2025-12-15 10:20:30 | INFO     | init_service - ✅ 日志系统: 统一日志系统初始化完成
2025-12-15 10:20:31 | DEBUG    | database - 数据库连接已建立
```

## 上下文管理

日志系统支持上下文信息，便于追踪请求和用户操作。

### 可用上下文变量

- `request_id`: 请求唯一标识
- `user_id`: 用户ID
- `trace_id`: 链路追踪ID
- `session_id`: 会话ID

### 使用方法

```python
from app.core.unified_logging import set_request_id, set_user_id

# 设置上下文
set_request_id("req-123456")
set_user_id("user-789")

# 日志会自动包含上下文信息
logger.info("用户执行了操作")
```

## 初始化流程

### 1. main.py 导入期（唯一初始化点）

`init_logging()` 在 main.py **文件顶部、所有 app 模块导入之前**执行，
保证导入期的模块级日志（如异常处理器注册）也输出统一格式，
而不是 loguru 默认 stderr 处理器的出厂格式：

```python
# main.py 顶部
from app.core.config import settings
from app.core.unified_logging import init_logging

init_logging(
    log_level=settings.LOG_LEVEL,
    log_file=settings.LOG_FILE,
    service_name=settings.PROJECT_NAME,
    environment=settings.ENVIRONMENT,
)

# 之后才导入其余 app 模块
```

### 2. init_service 兜底（幂等）

`init_service.init_logging()` 仍会在启动流程中调用；由于
`unified_logging._logging_initialized` 守卫，重复调用为空操作，
仅作为不经由 main.py 的入口（脚本、测试）的兜底。

## 日志配置

### 日志级别

- `DEBUG`: 调试信息
- `INFO`: 一般信息
- `WARNING`: 警告信息
- `ERROR`: 错误信息
- `CRITICAL`: 严重错误

### 日志文件

1. **主日志文件**: `logs/app.log`
   - 记录所有级别的日志
   - 按大小轮换（10MB）
   - 保留30天

2. **错误日志文件**: `logs/app_error.log`
   - 只记录 ERROR 和 CRITICAL 级别
   - 按大小轮换（10MB）
   - 保留30天

### 第三方库日志管理

```python
# 设置特定库的日志级别以减少噪音
for logger_name in [
    "uvicorn",
    "uvicorn.access", 
    "uvicorn.error",
    "watchfiles",
    "fastapi",
    "sqlalchemy.engine",
    "httpx",
    "httpcore"
]:
    logging.getLogger(logger_name).setLevel(logging.WARNING)
```

## 最佳实践

### 1. 日志级别使用

- **DEBUG**: 详细的调试信息，仅在开发环境使用
- **INFO**: 重要的业务流程和状态变化
- **WARNING**: 可能的问题，但不影响系统运行
- **ERROR**: 错误情况，需要关注
- **CRITICAL**: 严重错误，可能影响系统可用性

### 2. 日志内容建议

- 使用清晰、描述性的消息
- 包含足够的上下文信息
- 避免记录敏感信息（密码、令牌等）
- 结构化关键信息（使用 extra 参数）

### 3. 性能考虑

- 避免在高频代码路径中使用 DEBUG 级别日志
- 使用条件判断或懒加载格式化复杂对象
- 合理设置日志轮换和保留策略

## 常见问题

### Q: 为什么日志格式不统一？

**A**: 可能的原因：
1. 日志系统初始化前已有日志输出
2. 使用了错误的日志记录器
3. 拦截器未正确配置

**解决方案**:
1. 确保在使用日志前初始化系统
2. 使用 `get_logger()` 获取统一日志记录器
3. 检查 InterceptHandler 配置

### Q: 如何添加新的日志输出目标？

**A**: 在 `init_logging()` 函数中添加新的 logger.add() 调用：

```python
logger.add(
    sink="custom.log",
    format=file_format,
    level=log_level,
    rotation="10 MB",
    retention="30 days",
    encoding="utf-8",
    backtrace=False,
    diagnose=False,
    filter=add_module_default
)
```

### Q: 如何在微服务环境中追踪请求？

**A**: 使用上下文变量：

```python
# 在请求开始时
set_request_id(generate_uuid())
set_trace_id(get_from_headers())

# 在整个请求处理过程中，日志会自动包含这些信息
logger.info("处理请求")
```

## 总结

WitchCat 日志系统通过统一的接口、格式和配置，确保了整个应用的日志一致性和可观测性。通过合理使用日志级别、上下文信息和结构化内容，可以有效地监控系统状态、排查问题和分析用户行为。
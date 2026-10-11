# 异常处理机制文档

本文档描述了 witchcat-cn 项目中实现的全面异常处理机制，包括全局异常处理、自定义异常类、数据库操作异常处理、外部服务异常处理、结构化日志记录和统一API响应格式。

## 目录

1. [概述](#概述)
2. [核心组件](#核心组件)
3. [使用指南](#使用指南)
4. [最佳实践](#最佳实践)
5. [故障排除](#故障排除)

## 概述

异常处理机制旨在提供以下功能：

- **统一异常处理**: 捕获和处理所有未处理的异常
- **结构化错误响应**: 提供标准化的API错误响应格式
- **分类异常处理**: 根据异常类型提供不同的处理策略
- **上下文追踪**: 在整个请求生命周期中跟踪异常
- **结构化日志**: 记录详细的异常信息用于调试和监控

## 核心组件

### 1. 自定义异常类 (`app/core/exceptions.py`)

定义了一系列自定义异常类，包括：

- **基础异常**: `CustomException`
- **HTTP异常**: `NotFoundException`, `BadRequestException`, `UnauthorizedException`, 等
- **数据库异常**: `DatabaseException`, `IntegrityException`, `OptimisticLockException`
- **外部服务异常**: `ExternalServiceException`, `ServiceUnavailableException`, `TimeoutException`
- **文件异常**: `FileException`, `FileNotFoundException`, `FileFormatException`
- **认证异常**: `AuthenticationException`, `TokenExpiredException`, `InvalidTokenException`
- **业务逻辑异常**: `BusinessLogicException`, `ResourceConflictException`
- **配置异常**: `ConfigurationException`, `MissingConfigurationException`

### 2. 全局异常处理器 (`app/core/global_exceptions.py`)

提供统一的异常处理机制，包括：

- 自定义异常处理器
- HTTP异常处理器
- 数据验证异常处理器
- 全局异常处理器（兜底）

所有异常处理器都会生成标准格式的错误响应，并记录结构化日志。

### 3. 数据库异常处理 (`app/core/database_exceptions.py`)

提供数据库操作的异常处理和事务管理：

- `transaction_scope`: 事务上下文管理器，自动处理提交和回滚
- `DatabaseErrorClassifier`: 数据库错误分类器
- `Retry`: 数据库操作重试机制
- `DatabaseOperationHelper`: 数据库操作辅助类

### 4. 外部服务异常处理（已移除）

历史版本在 `app/core/external_service_exceptions.py` 提供 CircuitBreaker/Retry/ServiceClient
熔断重试框架，但从未接入任何生产调用方，已于 2026-10 解耦清理时删除。
出站 HTTP 调用现统一经由 `app/core/ssrf_guard.py`（SSRF 防护客户端）等既有封装。

### 5. 统一日志系统 (`app/core/unified_logging.py`)

（历史 `structured_logging.py` 垫片已删除，统一并入本模块）提供：

- `get_logger` / `UnifiedLogger`: 统一日志记录器
- 上下文信息记录（请求ID、用户ID、追踪ID）
- 标准日志到 loguru 的拦截转发

### 6. API响应标准化 (`app/core/api_response.py`)

提供统一的API响应格式：

- `ResponseBuilder`: 响应构建器
- 标准响应模型（成功、错误、分页）
- `ErrorCodes`: 错误代码常量
- `HTTPStatusHelper`: HTTP状态码助手

### 7. 请求上下文中间件 (`app/middleware/request_context.py`)

自动设置请求上下文信息：

- 请求ID生成和传递
- 用户ID和会话ID追踪
- 请求开始和结束日志记录
- 性能指标收集

## 使用指南

### 1. 基本异常处理

```python
from app.core.exceptions import NotFoundException, ValidationException

# 抛出资源未找到异常
if not item:
    raise NotFoundException(
        message=f"找不到ID为{item_id}的资源",
        details={"resource_type": "item", "item_id": item_id}
    )

# 抛出验证异常
if not data.get("required_field"):
    raise ValidationException(
        message="缺少必填字段",
        details={"missing_field": "required_field"}
    )
```

### 2. 数据库操作

```python
from app.core.database_exceptions import transaction_scope, DatabaseOperationHelper

# 使用事务范围
try:
    with transaction_scope(db):
        # 数据库操作
        db.add(item)
        db.commit()
except DatabaseException as e:
    # 处理数据库异常
    logger.error(f"数据库操作失败: {e.message}")

# 使用数据库操作辅助器
result = DatabaseOperationHelper.create_or_update(
    db=db,
    model_class=ItemModel,
    data=item_data,
    id=item_id
)
```

### 3. 外部服务调用（熔断框架已移除）

出站 HTTP 不再有独立的熔断/重试客户端框架（历史上从未接入生产调用）。
当前约定：出站请求通过 `app/core/ssrf_guard.py` 的安全客户端发起；
图片类抓取统一使用 `app/services/image_proxy_service.py`。

### 4. 结构化日志记录

```python
from app.core.unified_logging import get_logger, set_request_id

# 设置请求上下文
set_request_id(request_id)
set_user_id(user_id)

# 获取统一日志记录器
logger = get_logger("my_module")

# 记录日志
logger.info("操作完成", extra={"operation": "create_item", "item_id": item_id})

# 记录审计日志
logger.audit("用户操作", extra={"action": "delete_item", "item_id": item_id})

# 性能监控
@log_performance("复杂计算")
def complex_calculation(data):
    # 执行复杂计算
    return result
```

### 5. API响应构建

```python
from app.core.api_response import ResponseBuilder, ErrorCodes

# 成功响应
return ResponseBuilder.success(
    data=result,
    message="操作成功",
    request_id=request_id
)

# 分页响应
return ResponseBuilder.paginated(
    data=items,
    total=total_items,
    page=page,
    page_size=page_size,
    message="获取数据成功"
)

# 错误响应
return ResponseBuilder.error(
    error=ErrorCodes.RESOURCE_NOT_FOUND,
    message="资源未找到",
    request_id=request_id
)

# 验证错误响应
return ResponseBuilder.validation_error(
    errors={"field1": ["错误信息1", "错误信息2"]},
    message="数据验证失败"
)
```

## 最佳实践

### 1. 异常处理

- 使用自定义异常类代替原生异常
- 提供有意义的错误消息和详细信息
- 根据异常类型选择适当的状态码
- 避免在生产环境中暴露敏感信息

### 2. 数据库操作

- 使用事务上下文管理器确保事务完整性
- 使用数据库操作辅助器简化CRUD操作
- 实现适当的重试机制处理临时性故障
- 监控数据库连接池状态和性能

### 3. 外部服务调用

- 实现熔断器防止级联故障
- 使用指数退避算法进行重试
- 设置合理的超时时间
- 监控服务可用性和性能

### 4. 日志记录

- 使用结构化日志格式便于分析和监控
- 包含足够的上下文信息（请求ID、用户ID等）
- 分类日志（应用日志、审计日志、性能日志）
- 避免记录敏感信息

### 5. 性能监控

- 使用性能监控装饰器跟踪关键操作
- 记录响应时间和资源使用情况
- 分析性能日志识别瓶颈
- 设置性能阈值和告警

## 故障排除

### 1. 常见问题

**问题**: 异常未被正确处理
**解决**: 检查异常处理器的注册顺序，确保全局异常处理器最后注册

**问题**: 日志中缺少请求上下文
**解决**: 确保请求上下文中间件正确注册并设置上下文变量

**问题**: 数据库事务未正确回滚
**解决**: 使用事务上下文管理器而不是手动管理事务

**问题**: 外部服务调用失败导致系统不稳定
**解决**: 实现熔断器和适当的重试机制

### 2. 调试技巧

- 使用请求ID在日志中跟踪完整的请求生命周期
- 检查结构化日志中的上下文信息
- 使用性能日志识别慢操作
- 监控熔断器状态和重试次数

### 3. 监控和告警

- 设置错误率阈值告警
- 监控数据库连接池状态
- 跟踪外部服务可用性和响应时间
- 分析性能趋势识别潜在问题

## 总结

异常处理机制是构建可靠、可维护的Web应用程序的关键组成部分。通过实现全面的异常处理，系统可以：

1. 提高用户体验，即使发生错误也能提供有意义的反馈
2. 简化调试和故障排除过程
3. 增强系统稳定性和可靠性
4. 便于监控和维护

遵循本文档中的指南和最佳实践，可以充分利用异常处理机制的优势，构建高质量的应用程序。
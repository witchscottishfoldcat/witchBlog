"""
异常处理机制使用指南和示例
展示如何在项目中使用新的异常处理系统

注意: 本模块为教学示例。业务端点的实际约定是——错误直接 raise
CustomException / HTTPException（由 global_exceptions.py 统一转成错误信封），
成功直接返回 response_model；ResponseBuilder.success/paginated 包装成功信封
的用法仅限开发/测试端点，参见 app/core/api_response.py 模块说明。
"""

from typing import List

# === 1. 导入必要的模块 ===
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

# 导入API响应工具
from app.core.api_response import ResponseBuilder

# 导入数据库会话
from app.core.database import get_db

# 导入异常处理工具
from app.core.database_exceptions import DatabaseOperationHelper, transaction_scope

# 导入自定义异常
from app.core.exceptions import (
    DatabaseException,
    ExternalServiceException,
    NotFoundException,
    ValidationException,
)

# 导入日志系统
from app.core.unified_logging import (
    get_logger,
    set_request_id,
    set_user_id,
)
from app.models.user import User

# 创建路由器
router = APIRouter()


# === 2. 基本异常处理示例 ===
@router.get("/example/not-found/{item_id}")
async def example_not_found(item_id: int):
    """
    资源未找到异常示例
    """
    # 假设我们查找一个资源但没找到
    if item_id > 100:
        raise NotFoundException(
            message=f"找不到ID为{item_id}的资源",
            details={"resource_type": "example_item", "item_id": item_id},
        )

    return {"item_id": item_id, "name": "示例资源"}


@router.post("/example/validation")
async def example_validation(data: dict):
    """
    数据验证异常示例
    """
    # 假设我们验证输入数据
    if not data.get("required_field"):
        raise ValidationException(
            message="缺少必填字段",
            details={
                "missing_fields": ["required_field"],
                "provided_fields": list(data.keys()),
            },
        )

    return {"status": "success", "validated_data": data}


# === 3. 数据库异常处理示例 ===
@router.post("/example/database")
async def example_database(
    request: Request, item_data: dict, db: Session = Depends(get_db)
):
    """
    数据库操作异常处理示例
    """
    # 设置请求上下文
    request_id = request.headers.get("X-Request-ID", "unknown")
    set_request_id(request_id)
    set_user_id("example_user")  # 在实际应用中从认证信息中获取

    logger = get_logger("database_example")

    # 使用事务范围处理数据库操作
    try:
        with transaction_scope(db):
            # 这里执行数据库操作
            # 示例：使用数据库操作辅助器
            result = DatabaseOperationHelper.create_or_update(
                db=db,
                model_class=User,  # 示例使用 User 模型
                data=item_data,
                create_if_not_exists=True,
            )

            logger.info(
                "数据库操作成功",
                extra={"operation": "create_or_update", "data_id": item_data.get("id")},
            )

            return ResponseBuilder.success(
                data=result, message="创建/更新成功", request_id=request_id
            )

    except DatabaseException as e:
        # 数据库异常会被自动处理并返回标准响应
        logger.error("数据库操作失败", extra={"error": e.message, "details": e.details})
        raise
    except Exception as e:
        # 其他异常
        logger.error("未知错误", exception=e)
        raise


# === 4. 外部服务调用示例（已移除） ===
# 历史版本曾在此演示 CircuitBreaker/Retry/ServiceClient 熔断重试框架。
# 该框架从未接入任何生产调用方，已于 2026-10 解耦清理时删除；
# 出站 HTTP 统一走 app/core/ssrf_guard.py（SSRF 防护）+
# app/services/image_proxy_service.py（大小限制）等既有封装。


# === 5. 性能监控示例 ===
@router.get("/example/performance-monitor")
async def example_performance_monitor():
    """
    性能监控示例：记录操作耗时（结构化日志方式）
    """
    import random
    import time

    logger = get_logger("performance_example")

    # 模拟一些工作
    start = time.perf_counter()
    processing_time = random.uniform(0.1, 0.5)  # 100-500ms
    time.sleep(processing_time)
    elapsed_ms = (time.perf_counter() - start) * 1000

    logger.info(f"操作完成: elapsed_ms={elapsed_ms:.1f}")

    return ResponseBuilder.success(
        data={"processing_time": processing_time}, message="性能监控示例完成"
    )


# === 6. 结构化日志示例 ===
@router.get("/example/structured-logging/{user_id}")
async def example_structured_logging(user_id: str, action: str = "view"):
    """
    结构化日志记录示例
    """
    logger = get_logger("structured_logging_example")

    # 设置用户上下文
    set_user_id(user_id)
    set_request_id("example_request_" + str(hash(user_id + action)))

    # 记录审计日志
    logger.audit(
        f"用户操作: {action}",
        extra={
            "user_id": user_id,
            "action": action,
            "resource": "example_resource",
            "timestamp": "2023-01-01T00:00:00Z",
        },
    )

    # 记录业务日志
    logger.info(
        "业务操作完成",
        extra={
            "operation": "example_operation",
            "status": "completed",
            "duration_ms": 150,
        },
    )

    return ResponseBuilder.success(message="结构化日志示例完成")


# === 7. 分页响应示例 ===
@router.get("/example/pagination")
async def example_pagination(page: int = 1, page_size: int = 10):
    """
    分页响应示例
    """
    # 模拟数据
    total_items = 100
    items = [
        {"id": i, "name": f"项目 {i}"}
        for i in range(
            (page - 1) * page_size + 1, min(page * page_size + 1, total_items + 1)
        )
    ]

    # 使用响应构建器创建分页响应
    return ResponseBuilder.paginated(
        data=items,
        total=total_items,
        page=page,
        page_size=page_size,
        message="获取分页数据成功",
    )


# === 8. 自定义异常示例 ===
class CustomBusinessError(Exception):
    """自定义业务异常"""


@router.get("/example/custom-exception")
async def example_custom_exception(should_fail: bool = False):
    """
    自定义异常处理示例
    """
    if should_fail:
        # 抛出自定义异常
        error = CustomBusinessError("自定义业务逻辑错误")
        raise ExternalServiceException(
            message="自定义业务错误",
            details={"original_error": str(error), "error_type": "CustomBusinessError"},
        )

    return ResponseBuilder.success(message="自定义异常示例成功")


# === 9. 批量操作示例 ===
@router.post("/example/batch-operation")
async def example_batch_operation(
    request: Request, items: List[dict], db: Session = Depends(get_db)
):
    """
    批量数据库操作示例
    """
    logger = get_logger("batch_operation_example")

    # 设置请求上下文
    request_id = request.headers.get("X-Request-ID", "unknown")
    set_request_id(request_id)

    try:
        with transaction_scope(db):
            # 使用批量操作辅助器
            results = DatabaseOperationHelper.batch_create(
                db=db, model_class=User, data_list=items, batch_size=20
            )

            logger.info(
                "批量操作成功",
                extra={
                    "operation": "batch_create",
                    "items_count": len(items),
                    "results_count": len(results),
                },
            )

            return ResponseBuilder.success(
                data={"created_count": len(results), "items": results},
                message=f"成功创建{len(results)}条记录",
                request_id=request_id,
            )

    except DatabaseException as e:
        logger.error("批量操作失败", extra={"error": e.message, "details": e.details})
        raise


# === 使用指南 ===

"""
异常处理机制使用指南

1. 基本原则:
   - 使用自定义异常类代替原生异常
   - 所有异常都应包含有意义的消息和详细信息
   - 使用结构化日志记录异常和处理过程
   - 统一使用 ResponseBuilder 构建 API 响应

2. 数据库操作:
   - 使用 transaction_scope 上下文管理器处理事务
   - 使用 DatabaseOperationHelper 简化 CRUD 操作
   - 所有数据库异常会被自动分类和处理

3. 外部服务调用:
   - 出站 HTTP 调用经由统一的 SSRF 防护客户端封装
   - 配置适当的重试和熔断器策略
   - 捕获和处理外部服务异常

4. 日志记录:
   - 使用结构化日志记录器记录关键操作
   - 设置请求、用户和追踪上下文
   - 使用性能监控装饰器监控关键路径

5. API 响应:
   - 使用 ResponseBuilder 构建统一格式的响应
   - 包含请求 ID 和环境信息
   - 使用标准化的错误代码和消息

6. 异常分类:
   - 业务逻辑异常使用 BusinessLogicException
   - 数据库异常使用 DatabaseException 及其子类
   - 外部服务异常使用 ExternalServiceException 及其子类
   - 认证相关异常使用 AuthenticationException 及其子类

7. 性能监控:
   - 关键操作用 time.perf_counter() 计时并记入结构化日志
   - 记录操作耗时和结果
   - 分析性能日志识别瓶颈

8. 错误响应:
   - 生产环境不暴露内部错误详情
   - 开发环境提供详细错误信息用于调试
   - 所有错误响应包含请求 ID 便于追踪
"""

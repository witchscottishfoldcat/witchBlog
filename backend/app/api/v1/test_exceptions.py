"""
异常处理测试API
演示各种异常处理场景
"""
from fastapi import APIRouter

from app.core.api_response import ResponseBuilder
from app.core.exceptions import (
    BadRequestException,
    DatabaseException,
    ExternalServiceException,
    NotFoundException,
)
from app.core.unified_logging import get_logger, set_request_id

router = APIRouter()


@router.get("/test/not-found")
async def test_not_found():
    """测试资源未找到异常"""
    raise NotFoundException(
        message="测试资源未找到",
        details={"resource_type": "test_resource", "resource_id": 123},
    )


@router.get("/test/bad-request")
async def test_bad_request():
    """测试请求参数错误异常"""
    raise BadRequestException(
        message="测试请求参数错误", details={"invalid_field": "test_field", "reason": "无效值"}
    )


@router.get("/test/validation")
async def test_validation():
    """测试数据验证异常"""
    return ResponseBuilder.validation_error(
        errors={"field1": ["字段1不能为空"], "field2": ["字段2格式不正确", "字段2长度太短"]},
        message="请求数据验证失败",
    )


@router.get("/test/database-error")
async def test_database_error():
    """测试数据库异常"""
    raise DatabaseException(
        message="测试数据库操作失败", details={"operation": "test_query", "table": "test_table"}
    )


@router.get("/test/external-service-error")
async def test_external_service_error():
    """测试外部服务异常"""
    raise ExternalServiceException(
        message="测试外部服务调用失败",
        details={"service": "test_service", "endpoint": "/test/api"},
    )


@router.get("/test/success")
async def test_success():
    """测试成功响应"""
    set_request_id("test-request-123")
    logger = get_logger("test_exceptions")

    logger.info("测试成功响应", extra={"operation": "test_success", "status": "completed"})

    return ResponseBuilder.success(
        data={"message": "测试成功", "data": {"id": 1, "name": "测试数据"}},
        message="操作成功完成",
        request_id="test-request-123",
    )


@router.get("/test/paginated")
async def test_paginated(page: int = 1, page_size: int = 5):
    """测试分页响应"""
    # 模拟数据
    total_items = 23
    items = [
        {"id": i, "name": f"测试项目 {i}"}
        for i in range(
            (page - 1) * page_size + 1, min(page * page_size + 1, total_items + 1)
        )
    ]

    return ResponseBuilder.paginated(
        data=items,
        total=total_items,
        page=page,
        page_size=page_size,
        message="获取测试数据成功",
    )


@router.get("/test/unknown-error")
async def test_unknown_error():
    """测试未知异常（会被全局异常处理器捕获）"""
    # 故意抛出一个未处理的异常
    raise ValueError("这是一个未处理的测试异常")


@router.get("/test/structured-logging")
async def test_structured_logging():
    """测试结构化日志"""
    logger = get_logger("test_exceptions")
    set_request_id("log-test-request-456")

    # 记录不同级别的日志
    logger.info("这是一条信息日志")
    logger.warning("这是一条警告日志")
    logger.error("这是一条错误日志")

    # 记录审计日志（统一日志系统无独立 audit 通道，以 info + extra 上下文表达）
    logger.info(
        "用户操作",
        extra={
            "action": "test_action",
            "resource": "test_resource",
            "user_id": "test_user",
        },
    )

    return ResponseBuilder.success(message="结构化日志测试完成")


@router.get("/test/performance-monitor")
async def test_performance_monitor():
    """测试性能监控（计时演示）"""
    import time

    logger = get_logger("test_exceptions")
    start = time.perf_counter()
    time.sleep(0.1)  # 模拟100ms的工作
    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info(f"性能监控测试: elapsed_ms={elapsed_ms}")

    return ResponseBuilder.success(
        data={"result": "工作完成", "elapsed_ms": elapsed_ms},
        message="性能监控测试完成",
    )

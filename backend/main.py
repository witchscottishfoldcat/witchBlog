# 统一日志必须先于所有 app 模块导入初始化：导入期的模块级日志（如异常处理器注册）
# 才会进入统一格式的 sink，否则会落到 loguru 默认 stderr 处理器的出厂格式
from app.core.config import settings
from app.core.unified_logging import init_logging

init_logging(
    log_level=settings.LOG_LEVEL,
    log_file=settings.LOG_FILE,
    service_name=settings.PROJECT_NAME,
    environment=getattr(settings, "ENVIRONMENT", "development"),
)

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.image_proxy import router as image_proxy_router
from app.api.v1.api import api_router
from app.api.v1.rss import router as rss_router
from app.core.global_exceptions import register_exception_handlers
from app.core.unified_logging import get_logger
from app.middleware.cors import add_cors_middleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.request_context import RequestContextMiddleware
from app.middleware.request_stats import RequestStatsMiddleware
from app.services.init_service import init_service
from app.services.md_startup_service import md_startup_service

# 模块级日志器（UnifiedLogger 内部懒初始化，可安全在导入期创建）
logger = get_logger("main")


# 定义lifespan事件处理器
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动和关闭时的事件处理器"""
    # 使用统一的初始化服务执行所有初始化操作
    await init_service.initialize_all()

    # 现在日志系统已初始化，创建日志记录器
    logger = get_logger("main")

    # 启动MD文件缓存代理服务
    await md_startup_service.start_services()

    # 注册并启动定时任务调度器
    from app.core.scheduler import scheduler
    from app.tasks.scheduled_tasks import register_all_tasks

    register_all_tasks(scheduler)
    await scheduler.start()

    # 安装后台实时日志缓冲 sink（幂等）：收集 INFO 及以上日志供「实时日志」页查看
    from app.core.log_buffer import install_log_buffer_sink

    install_log_buffer_sink()

    # 输出启动消息
    print(init_service.get_startup_message())

    # 记录启动信息到日志
    init_service.log_startup_info()

    # 记录启动前的初始化信息
    logger.info("服务初始化完成", extra=init_service.get_startup_info())

    # 应用启动完成，yield控制权给FastAPI
    yield

    # 应用关闭前的清理工作
    from app.core.scheduler import scheduler

    await scheduler.stop()
    await md_startup_service.stop_services()
    await init_service.shutdown()


# 创建FastAPI应用
# 生产环境关闭交互式文档与 OpenAPI schema，避免向公网暴露完整接口面
_is_production = settings.ENVIRONMENT.lower() == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="你的博客简介",
    openapi_url=None if _is_production else f"{settings.API_V1_STR}/openapi.json",
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    lifespan=lifespan,  # 使用lifespan事件处理器
)

# 添加中间件
add_cors_middleware(app)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(RequestStatsMiddleware)

# 异常处理器必须在应用收到首个请求前注册：
# FastAPI 构建中间件栈时会快照已注册的处理器，放在 lifespan 里注册不会生效
register_exception_handlers(app)

# 设置应用状态
app.state.environment = getattr(settings, "ENVIRONMENT", "production")

# 注册API路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 注册RSS路由（独立于API版本）
app.include_router(rss_router, prefix="/rss", tags=["RSS订阅"])

# 注册全局图片代理路由（独立于API版本，路径固定为 /api/proxy-image）
app.include_router(image_proxy_router, prefix="/api", tags=["图片代理"])

# 在lifespan函数中注册异常处理器（确保在日志系统初始化后）


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "api": f"{settings.API_V1_STR}",
        "stats_api": "/api/v1/site-stats/",
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    from datetime import datetime, timezone

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn

    # 日志系统已在模块顶部随导入初始化，直接使用模块级 logger
    logger.info(f"正在启动 {settings.PROJECT_NAME} v{settings.VERSION}")

    # 使用 uvicorn.run 但关闭其默认日志配置
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config=None,  # 关闭 uvicorn 的默认日志配置
        access_log=False,  # 关闭 access 日志，我们会通过中间件处理
    )

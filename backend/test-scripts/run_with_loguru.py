"""
使用 loguru 日志系统启动服务器
"""
import uvicorn
from app.core.config import settings
from app.core.unified_logging import get_logger
from app.core.unified_logging import init_logging as setup_logging
import logging
import sys

def run_server():
    """启动 FastAPI 服务器，使用 loguru 日志"""
    
    # 设置日志
    setup_logging()
    logger = get_logger()
    
    # 拦截所有标准日志，包括 uvicorn
    logging.basicConfig(handlers=[], level=0, force=True)
    
    # 配置 uvicorn 使用我们的日志系统
    logger.info(f"正在启动 {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"服务器地址: http://{settings.HOST}:{settings.PORT}")
    logger.info(f"调试模式: {'开启' if settings.DEBUG else '关闭'}")
    
    # 使用 uvicorn.run 但关闭其默认日志配置
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config=None,  # 关闭 uvicorn 的默认日志配置
        access_log=False  # 关闭 access 日志，我们会通过中间件处理
    )

if __name__ == "__main__":
    run_server()
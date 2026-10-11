#!/usr/bin/env python3
"""
日记API测试服务器
启动一个简单的FastAPI服务器用于测试日记API
"""

import uvicorn
from fastapi import FastAPI
from app.core.config import settings
from app.core.unified_logging import get_logger
from app.core.unified_logging import init_logging as setup_logging
import logging

if __name__ == "__main__":
    # 设置日志系统
    setup_logging()
    logger = get_logger()
    
    # 拦截所有标准日志，包括 uvicorn
    logging.basicConfig(handlers=[], level=0, force=True)
    
    logger.info(f"正在启动测试服务器 {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"服务器地址: http://0.0.0.0:{settings.PORT}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config=None,  # 关闭 uvicorn 的默认日志配置
        access_log=False  # 关闭 access 日志，我们会通过中间件处理
    )
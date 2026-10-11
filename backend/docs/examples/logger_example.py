"""
使用 loguru 日志系统的示例
"""
from app.core.unified_logging import get_logger

# 获取日志器
logger = get_logger(__name__)


def example_logging():
    """演示不同级别的日志记录"""

    # 基本日志记录
    logger.debug("这是一条调试信息")
    logger.info("这是一条信息")
    logger.warning("这是一条警告")
    logger.error("这是一条错误")

    # 带变量的日志记录
    user_id = 123
    action = "登录"
    logger.info(f"用户 {user_id} 执行了 {action} 操作")

    # 异常记录
    try:
        1 / 0
    except Exception as e:
        logger.exception(f"发生异常: {e}")

    # 通过 extra 传递结构化上下文
    logger.info("处理请求", extra={"request_id": "req-123", "user": "admin"})


if __name__ == "__main__":
    example_logging()

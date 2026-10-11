#!/usr/bin/env python3
"""
定时任务调度器
用于定期执行URL刷新等维护任务
"""

import os
import sys
import time
from datetime import datetime

import schedule

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging

from scripts.update_minio_urls import update_expired_urls

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("logs/scheduler.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


def refresh_urls_task():
    """定时刷新URL的任务"""
    logger.info("开始执行定时URL刷新任务")
    try:
        updated_count = update_expired_urls(batch_size=50)
        logger.info(f"定时任务完成，更新了 {updated_count} 个文件的URL")
    except Exception as e:
        logger.error(f"定时任务执行失败: {str(e)}")


def main():
    """主函数"""
    logger.info("启动定时任务调度器...")

    # 每小时执行一次URL刷新
    schedule.every().hour.do(refresh_urls_task)

    # 每天凌晨2点执行一次全面的URL刷新
    schedule.every().day.at("02:00").do(
        lambda: update_expired_urls(batch_size=200, force_all=True)
    )

    logger.info("定时任务已设置:")
    logger.info("- 每小时刷新部分URL")
    logger.info("- 每天凌晨2点全面刷新所有URL")

    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # 每分钟检查一次
    except KeyboardInterrupt:
        logger.info("定时任务调度器已停止")


if __name__ == "__main__":
    main()

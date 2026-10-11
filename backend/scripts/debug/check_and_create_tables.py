#!/usr/bin/env python3
"""
检查并创建数据库表的命令行工具
"""

import argparse
import os
import sys

from sqlalchemy import create_engine

# 添加项目根目录到 Python 路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from app.core.db_manager import DatabaseManager
from app.core.unified_logging import get_logger
from app.models import Base

# 获取结构化日志记录器
logger = get_logger("check_and_create_tables")


def main():
    parser = argparse.ArgumentParser(description="检查并创建数据库表")
    parser.add_argument("--list-existing", action="store_true", help="列出已存在的表")
    parser.add_argument("--list-models", action="store_true", help="列出所有模型表")
    parser.add_argument("--check-missing", action="store_true", help="检查缺失的表")
    parser.add_argument("--create-missing", action="store_true", help="创建缺失的表")

    args = parser.parse_args()

    # 从环境变量获取数据库配置
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_password = os.getenv("MYSQL_PASSWORD", "momoiairi")
    mysql_server = os.getenv("MYSQL_SERVER", "127.0.0.1")
    mysql_db = os.getenv("MYSQL_DB", "witchcat")

    # 创建数据库连接
    database_url = (
        f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_server}/{mysql_db}"
    )
    engine = create_engine(database_url)

    # 创建数据库管理器
    db_manager = DatabaseManager(engine)

    # 执行命令
    if args.list_existing:
        tables = db_manager.get_existing_tables()
        print("已存在的表:")
        for table in sorted(tables):
            print(f"  - {table}")

    if args.list_models:
        model_tables = {}
        for cls in Base.registry._class_registry.values():
            if hasattr(cls, "__tablename__"):
                table_name = cls.__tablename__
                model_tables[table_name] = cls

        print("所有模型表:")
        for table_name in sorted(model_tables.keys()):
            print(f"  - {table_name} ({model_tables[table_name].__name__})")

    if args.check_missing:
        existing_tables = set(db_manager.get_existing_tables())
        model_tables = set()

        for cls in Base.registry._class_registry.values():
            if hasattr(cls, "__tablename__"):
                model_tables.add(cls.__tablename__)

        missing_tables = model_tables - existing_tables

        if missing_tables:
            print("缺失的表:")
            for table in sorted(missing_tables):
                print(f"  - {table}")
        else:
            print("没有缺失的表")

    if args.create_missing:
        print("检查并创建缺失的表...")
        success = db_manager.ensure_all_tables_exist()

        if success:
            print("所有表都已存在或创建成功")
        else:
            print("部分表创建失败，请查看日志获取详细信息")

    # 如果没有指定任何参数，默认执行检查和创建
    if not any(vars(args).values()):
        print("检查并创建缺失的表...")
        success = db_manager.ensure_all_tables_exist()

        if success:
            print("所有表都已存在或创建成功")
        else:
            print("部分表创建失败，请查看日志获取详细信息")


if __name__ == "__main__":
    main()

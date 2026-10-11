#!/usr/bin/env python3
"""
测试MySQL连接脚本
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text

from app.core.config import settings


def test_mysql_connection():
    """测试MySQL连接"""
    try:
        print(f"正在连接MySQL数据库: {settings.DATABASE_URL}")
        engine = create_engine(
            settings.DATABASE_URL, connect_args={"charset": "utf8mb4"}
        )

        # 测试连接
        with engine.connect() as connection:
            result = connection.execute(text("SELECT VERSION()"))
            version = result.fetchone()
            print(f"✓ MySQL连接成功! 版本: {version[0]}")

            # 检查数据库是否存在
            result = connection.execute(text("SELECT DATABASE()"))
            db_name = result.fetchone()
            print(f"✓ 当前数据库: {db_name[0]}")

        return True
    except Exception as e:
        print(f"✗ MySQL连接失败: {str(e)}")
        return False


if __name__ == "__main__":
    success = test_mysql_connection()
    sys.exit(0 if success else 1)

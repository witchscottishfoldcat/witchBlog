#!/usr/bin/env python3
"""
初始化MySQL数据库脚本
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text

from app.core.config import settings


def create_database():
    """创建数据库"""
    try:
        # 先连接到MySQL服务器（不指定数据库）
        server_url = settings.DATABASE_URL.rsplit("/", 1)[0]  # 移除数据库名

        print(f"正在连接MySQL服务器: {server_url}")
        engine = create_engine(server_url, connect_args={"charset": "utf8mb4"})

        with engine.connect() as connection:
            # 检查数据库是否存在
            result = connection.execute(
                text(f"SHOW DATABASES LIKE '{settings.MYSQL_DB}'")
            )
            db_exists = result.fetchone()

            if not db_exists:
                print(f"创建数据库: {settings.MYSQL_DB}")
                connection.execute(
                    text(
                        f"CREATE DATABASE {settings.MYSQL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                    )
                )
                print(f"✓ 数据库 {settings.MYSQL_DB} 创建成功!")
            else:
                print(f"✓ 数据库 {settings.MYSQL_DB} 已存在")

            # 设置默认字符集
            connection.execute(
                text(
                    f"ALTER DATABASE {settings.MYSQL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            )

        return True
    except Exception as e:
        print(f"✗ 创建数据库失败: {str(e)}")
        return False


if __name__ == "__main__":
    success = create_database()
    sys.exit(0 if success else 1)

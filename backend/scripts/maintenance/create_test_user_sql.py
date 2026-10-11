#!/usr/bin/env python3
"""
使用SQL直接创建测试用户
"""
import hashlib
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.core.database import engine
from app.core.security import get_password_hash


def create_test_user_sql():
    """使用SQL创建测试用户"""
    try:
        # 检查用户是否已存在
        with engine.connect() as connection:
            result = connection.execute(text("SELECT id FROM users WHERE id = 1"))
            existing_user = result.fetchone()

            if existing_user:
                print(f"测试用户已存在: ID {existing_user[0]}")
                return True

        # 创建测试用户
        with engine.connect() as connection:
            # 获取密码哈希
            password_hash = get_password_hash("testpass")

            # 插入用户
            insert_query = text(
                """
                INSERT INTO users (
                    id, username, email, hashed_password, full_name, is_active, is_superuser, created_at, updated_at
                ) VALUES (
                    1, :username, :email, :hashed_password, :full_name, :is_active, :is_superuser, NOW(), NOW()
                )
            """
            )

            connection.execute(
                insert_query,
                {
                    "username": "testuser",
                    "email": "test@example.com",
                    "hashed_password": password_hash,
                    "full_name": "Test User",
                    "is_active": True,
                    "is_superuser": False,
                },
            )

            connection.commit()
            print("✓ 成功创建测试用户")
            return True

    except Exception as e:
        print(f"✗ 创建测试用户失败: {str(e)}")
        return False


if __name__ == "__main__":
    success = create_test_user_sql()
    sys.exit(0 if success else 1)

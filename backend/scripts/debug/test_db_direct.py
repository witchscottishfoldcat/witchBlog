#!/usr/bin/env python3
"""
直接测试MySQL数据库操作
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user import UserService


def test_database_directly():
    """直接测试数据库操作"""
    try:
        # 创建数据库会话
        db = SessionLocal()

        # 检查用户表是否存在记录
        user_count = db.query(User).count()
        print(f"当前用户数: {user_count}")

        # 创建测试用户数据
        test_user_data = UserCreate(
            username="testuser_direct",
            email="test@example.com",
            password="testpass123",
            full_name="Test User Direct",
        )

        # 检查用户是否已存在
        existing_user = (
            db.query(User).filter(User.username == test_user_data.username).first()
        )
        if existing_user:
            print(f"测试用户 '{test_user_data.username}' 已存在")
        else:
            # 创建用户
            try:
                new_user = UserService.create_user(db, test_user_data)
                print(f"✓ 成功创建用户: {new_user.username} (ID: {new_user.id})")
            except Exception as e:
                print(f"✗ 创建用户失败: {str(e)}")

        # 再次检查用户数量
        user_count = db.query(User).count()
        print(f"更新后的用户数: {user_count}")

        # 列出所有用户
        users = db.query(User).all()
        print("用户列表:")
        for user in users:
            print(
                f"  - ID: {user.id}, 用户名: {user.username}, 邮箱: {user.email}, 是否活跃: {user.is_active}"
            )

        db.close()
        return True
    except Exception as e:
        print(f"✗ 数据库操作失败: {str(e)}")
        return False


if __name__ == "__main__":
    success = test_database_directly()
    sys.exit(0 if success else 1)

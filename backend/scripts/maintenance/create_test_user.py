#!/usr/bin/env python3
"""
创建测试用户
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user import UserService


def create_test_user():
    """创建测试用户"""
    try:
        # 创建数据库会话
        db = SessionLocal()

        # 检查用户是否已存在
        test_user = db.query(User).filter(User.id == 1).first()
        if test_user:
            print(f"测试用户已存在: {test_user.username} (ID: {test_user.id})")
            return True

        # 创建测试用户
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpass",  # 使用较短的密码
            full_name="Test User",
            is_active=True,
        )

        new_user = UserService.create_user(db, user_data)
        print(f"✓ 成功创建测试用户: {new_user.username} (ID: {new_user.id})")

        db.close()
        return True
    except Exception as e:
        print(f"✗ 创建测试用户失败: {str(e)}")
        return False


if __name__ == "__main__":
    success = create_test_user()
    sys.exit(0 if success else 1)

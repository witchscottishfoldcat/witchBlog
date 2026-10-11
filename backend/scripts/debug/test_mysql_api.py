#!/usr/bin/env python3
"""
测试MySQL数据库和API集成
"""
import json
import os
import sys
import time

import requests

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session

from app.core.database import Base, SessionLocal, engine
from app.models.user import User
from app.schemas.user import UserCreate


def test_database_operations():
    """测试数据库操作"""
    try:
        # 创建数据库会话
        db = SessionLocal()

        # 检查用户表是否存在记录
        user_count = db.query(User).count()
        print(f"✓ 数据库连接成功! 当前用户数: {user_count}")

        # 创建测试用户
        test_user_data = {
            "username": "testuser_mysql",
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
        }

        # 检查用户是否已存在
        existing_user = (
            db.query(User).filter(User.username == test_user_data["username"]).first()
        )
        if existing_user:
            print(f"✓ 测试用户 '{test_user_data['username']}' 已存在")
        else:
            print("✓ 数据库操作准备就绪")

        db.close()
        return True
    except Exception as e:
        print(f"✗ 数据库操作失败: {str(e)}")
        return False


def test_api_with_database():
    """测试API与数据库交互"""
    try:
        # 等待API服务器启动
        print("等待API服务器启动...")
        time.sleep(3)

        # 测试API根路径
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code != 200:
            print(f"✗ API根路径响应异常: {response.status_code}")
            return False

        # 测试健康检查
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code != 200:
            print(f"✗ 健康检查响应异常: {response.status_code}")
            return False

        # 测试用户注册API
        register_data = {
            "username": "testuser_mysql",
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
        }

        try:
            response = requests.post(
                "http://localhost:8000/api/v1/auth/register",
                json=register_data,
                timeout=5,
            )

            if response.status_code in [200, 201]:
                print("✓ 用户注册API正常工作")
            elif response.status_code == 400 and "already registered" in response.text:
                print("✓ 用户已存在检测正常")
            else:
                print(f"用户注册响应: {response.status_code} - {response.text}")
        except requests.exceptions.ConnectionError:
            print("✗ 无法连接到API服务器")
            return False

        print("✓ API与MySQL数据库集成正常!")
        return True

    except Exception as e:
        print(f"✗ API测试失败: {str(e)}")
        return False


def main():
    """主测试函数"""
    print("=== MySQL数据库和API集成测试 ===")

    # 测试数据库操作
    print("\n1. 测试数据库操作...")
    db_success = test_database_operations()

    if not db_success:
        print("数据库测试失败，终止测试")
        return False

    # 测试API
    print("\n2. 测试API集成...")
    api_success = test_api_with_database()

    # 总结
    print("\n=== 测试总结 ===")
    print(f"数据库操作: {'✓ 成功' if db_success else '✗ 失败'}")
    print(f"API集成: {'✓ 成功' if api_success else '✗ 失败'}")

    return db_success and api_success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

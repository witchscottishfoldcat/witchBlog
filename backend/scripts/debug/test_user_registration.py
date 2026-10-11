#!/usr/bin/env python3
"""
测试用户注册功能
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from main import app


def test_user_registration():
    """测试用户注册"""
    client = TestClient(app)

    # 测试数据
    user_data = {
        "username": "testuser_mysql",
        "email": "test@example.com",
        "password": "testpass123",  # 使用较短的密码
        "full_name": "Test User",
    }

    # 测试注册
    response = client.post("/api/v1/auth/register", json=user_data)
    print(f"用户注册状态码: {response.status_code}")

    if response.status_code == 200:
        user = response.json()
        print(f"✓ 用户注册成功: {user['username']} ({user['email']})")
        print(f"用户ID: {user['id']}")
        print(f"用户全名: {user['full_name']}")
        print(f"用户是否活跃: {user['is_active']}")

        # 测试重复注册
        response = client.post("/api/v1/auth/register", json=user_data)
        print(f"重复注册状态码: {response.status_code}")
        if response.status_code == 400 and "already registered" in response.text:
            print("✓ 重复注册检测正常")

        return True
    else:
        print(f"✗ 用户注册失败: {response.text}")
        return False


def test_user_login():
    """测试用户登录"""
    client = TestClient(app)

    # 测试登录
    login_data = {"username": "testuser_mysql", "password": "testpass123"}  # 使用较短的密码

    response = client.post("/api/v1/auth/login", data=login_data)
    print(f"用户登录状态码: {response.status_code}")

    if response.status_code == 200:
        token_data = response.json()
        print(f"✓ 用户登录成功")
        print(f"令牌类型: {token_data['token_type']}")
        print(f"访问令牌前10位: {token_data['access_token'][:10]}...")

        # 测试令牌验证
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        response = client.get("/api/v1/auth/test-token", headers=headers)
        print(f"令牌验证状态码: {response.status_code}")

        if response.status_code == 200:
            user_data = response.json()
            print(f"✓ 令牌验证成功: {user_data['username']}")

        return True
    else:
        print(f"✗ 用户登录失败: {response.text}")
        return False


def main():
    """主测试函数"""
    print("=== 用户注册和登录测试 ===")

    # 测试注册
    print("\n1. 测试用户注册...")
    reg_success = test_user_registration()

    # 测试登录
    print("\n2. 测试用户登录...")
    login_success = test_user_login()

    # 总结
    print("\n=== 测试总结 ===")
    print(f"用户注册: {'✓ 成功' if reg_success else '✗ 失败'}")
    print(f"用户登录: {'✓ 成功' if login_success else '✗ 失败'}")

    return reg_success and login_success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

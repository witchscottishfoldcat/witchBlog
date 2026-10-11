#!/usr/bin/env python3
"""
测试API路由是否正确注册
"""
import json
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from main import app


def test_routes():
    """测试路由"""
    client = TestClient(app)

    # 测试根路径
    response = client.get("/")
    print(f"根路径 (/): {response.status_code}")

    # 测试健康检查
    response = client.get("/health")
    print(f"健康检查 (/health): {response.status_code}")

    # 测试认证路由
    response = client.get("/api/v1/auth/login")
    print(
        f"登录路由 (/api/v1/auth/login): {response.status_code} (应该是405 Method Not Allowed，因为这是POST端点)"
    )

    # 测试注册路由
    response = client.post("/api/v1/auth/register", json={})
    print(f"注册路由 (/api/v1/auth/register): {response.status_code} (至少应该不是404)")

    # 获取API文档并检查注册端点
    response = client.get("/api/v1/openapi.json")
    if response.status_code == 200:
        openapi = response.json()
        has_register = "/api/v1/auth/register" in str(openapi)
        print(f"注册端点在OpenAPI文档中: {'是' if has_register else '否'}")

    return True


if __name__ == "__main__":
    test_routes()

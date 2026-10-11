#!/usr/bin/env python3
"""
测试API与MySQL连接
"""
import os
import sys
import time

import requests


def test_api_connection():
    """测试API连接"""
    try:
        # 等待服务器启动
        print("等待API服务器启动...")
        time.sleep(3)

        # 测试健康检查端点
        response = requests.get("http://localhost:8000/health", timeout=5)

        if response.status_code == 200:
            print("✓ API服务器正常运行!")
            print(f"响应: {response.json()}")
            return True
        else:
            print(f"✗ API服务器响应异常: {response.status_code}")
            return False

    except Exception as e:
        print(f"✗ 无法连接到API服务器: {str(e)}")
        return False


if __name__ == "__main__":
    success = test_api_connection()
    sys.exit(0 if success else 1)

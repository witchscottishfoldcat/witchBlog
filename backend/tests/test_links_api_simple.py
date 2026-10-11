#!/usr/bin/env python3
"""
简单测试链接API
"""

import requests

# 基础URL
BASE_URL = "http://localhost:8001/api/v1"


def test_api_health():
    """测试API健康状态"""
    try:
        response = requests.get(f"{BASE_URL}/../")
        if response.status_code == 200:
            print("✅ API服务器运行正常")
            return True
        else:
            print(f"❌ API服务器响应异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 无法连接到API服务器: {str(e)}")
        return False


def test_links_endpoint():
    """测试链接端点"""
    try:
        response = requests.get(f"{BASE_URL}/links")
        if response.status_code == 200:
            links = response.json()
            print(f"✅ 获取链接列表成功，共 {len(links)} 个")
            return True
        else:
            print(f"❌ 获取链接列表失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 测试链接端点失败: {str(e)}")
        return False


if __name__ == "__main__":
    print("=== 简单测试链接API ===")

    if test_api_health():
        test_links_endpoint()

    print("\n=== 测试完成 ===")

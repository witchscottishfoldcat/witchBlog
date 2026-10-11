#!/usr/bin/env python3
"""
简单测试MD文件接口
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from main import app


def simple_test():
    """简单测试"""
    client = TestClient(app)

    print("=== 简单MD文件API测试 ===")

    # 测试创建MD文件
    print("\n1. 测试创建MD文件...")
    file_data = {
        "title": "测试MD文件",
        "content": "# 测试标题\n\n这是一个测试的Markdown文件内容。",
        "filename": "test.md",
    }

    response = client.post("/api/v1/md-files/", json=file_data)
    print(f"状态码: {response.status_code}")
    if response.status_code != 200:
        print(f"响应: {response.text}")
        return False

    file_info = response.json()
    print(f"✓ 文件创建成功，ID: {file_info['id']}")

    # 测试获取文件列表
    print("\n2. 测试获取文件列表...")
    response = client.get("/api/v1/md-files/")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        files_list = response.json()
        print(f"✓ 获取文件列表成功，共 {files_list['total']} 个文件")

    # 测试获取文件内容
    print("\n3. 测试获取文件内容...")
    response = client.get(f"/api/v1/md-files/{file_info['id']}/content")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        file_with_content = response.json()
        print(f"✓ 获取文件内容成功")
        print(f"内容预览: {file_with_content['content'][:30]}...")

    return True


if __name__ == "__main__":
    success = simple_test()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
测试MD文件创建和读取
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from main import app


def test_create_and_read():
    """测试创建和读取"""
    client = TestClient(app)

    print("=== MD文件创建和读取测试 ===")

    # 1. 创建文件
    print("\n1. 创建MD文件...")
    file_data = {
        "title": "测试文档",
        "content": "# 测试文档\n\n这是一个简单的测试文档。",
        "filename": "test-doc.md",
        "tags": "测试,文档",
        "is_public": True,
    }

    response = client.post("/api/v1/md-files/", json=file_data)
    print(f"状态码: {response.status_code}")
    if response.status_code != 200:
        print(f"响应: {response.text}")
        return False

    file_info = response.json()
    print(f"✓ 文件创建成功，ID: {file_info['id']}")
    file_id = file_info["id"]

    # 2. 获取文件内容
    print("\n2. 获取文件内容...")
    response = client.get(f"/api/v1/md-files/{file_id}/content")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        file_with_content = response.json()
        print(f"✓ 文件内容获取成功")
        print(f"  标题: {file_with_content['title']}")
        print(f"  内容: {file_with_content['content']}")
        print(f"  对象名: {file_with_content['object_name']}")
        print(f"  文件URL: {file_with_content['file_url']}")

    # 3. 获取文件列表
    print("\n3. 获取文件列表...")
    response = client.get("/api/v1/md-files/")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        files_list = response.json()
        print(f"✓ 文件列表获取成功，共 {files_list['total']} 个文件")
        for file in files_list["files"]:
            print(f"  - ID: {file['id']}, 标题: {file['title']}")

    # 4. 获取公开文件列表
    print("\n4. 获取公开文件列表...")
    response = client.get("/api/v1/md-files/public")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        public_files = response.json()
        print(f"✓ 公开文件列表获取成功，共 {public_files['total']} 个文件")
        for file in public_files["files"]:
            print(f"  - ID: {file['id']}, 标题: {file['title']}")

    return True


if __name__ == "__main__":
    success = test_create_and_read()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
测试MD文件接口
"""
import json
import os
import sys
import time

import requests

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from main import app


def test_md_files_api():
    """测试MD文件API"""
    client = TestClient(app)

    print("=== MD文件API测试 ===\n")

    # 测试创建MD文件
    print("1. 测试创建MD文件...")
    file_data = {
        "title": "测试MD文件",
        "description": "这是一个测试用的Markdown文件",
        "content": "# 测试标题\n\n这是一个测试的Markdown文件内容。\n\n## 子标题\n\n- 列表项1\n- 列表项2\n- 列表项3",
        "filename": "test.md",
        "tags": "测试,Markdown,API",
        "is_public": True,
    }

    response = client.post("/api/v1/md-files/", json=file_data)
    print(f"创建文件状态码: {response.status_code}")

    if response.status_code == 200:
        file_info = response.json()
        print(f"✓ 文件创建成功")
        print(f"文件ID: {file_info['id']}")
        print(f"文件标题: {file_info['title']}")
        print(f"文件名: {file_info['original_filename']}")
        print(f"文件大小: {file_info['file_size']} 字节")
        print(f"字数: {file_info['word_count']}")

        file_id = file_info["id"]

        # 测试获取文件列表
        print("\n2. 测试获取文件列表...")
        response = client.get("/api/v1/md-files/")
        print(f"获取文件列表状态码: {response.status_code}")

        if response.status_code == 200:
            files_list = response.json()
            print(f"✓ 获取文件列表成功，共 {files_list['total']} 个文件")

            # 测试搜索文件
            print("\n3. 测试搜索文件...")
            response = client.get("/api/v1/md-files/?search=测试")
            print(f"搜索文件状态码: {response.status_code}")

            if response.status_code == 200:
                search_result = response.json()
                print(f"✓ 搜索成功，找到 {search_result['total']} 个文件")

            # 测试获取文件信息
            print("\n4. 测试获取文件信息...")
            response = client.get(f"/api/v1/md-files/{file_id}")
            print(f"获取文件信息状态码: {response.status_code}")

            if response.status_code == 200:
                file_info = response.json()
                print(f"✓ 获取文件信息成功")
                print(f"文件标题: {file_info['title']}")

            # 测试获取文件内容
            print("\n5. 测试获取文件内容...")
            response = client.get(f"/api/v1/md-files/{file_id}/content")
            print(f"获取文件内容状态码: {response.status_code}")

            if response.status_code == 200:
                file_with_content = response.json()
                print(f"✓ 获取文件内容成功")
                print(f"内容预览: {file_with_content['content'][:50]}...")

            # 测试更新文件
            print("\n6. 测试更新文件...")
            update_data = {
                "title": "更新后的测试MD文件",
                "description": "这是更新后的描述",
                "content": "# 更新后的测试标题\n\n这是更新后的内容。\n\n## 新增部分\n\n这是新增的内容部分。",
                "tags": "更新,测试,Markdown",
                "is_public": False,
            }

            response = client.put(f"/api/v1/md-files/{file_id}", json=update_data)
            print(f"更新文件状态码: {response.status_code}")

            if response.status_code == 200:
                updated_file = response.json()
                print(f"✓ 更新文件成功")
                print(f"更新后标题: {updated_file['title']}")
                print(f"更新后字数: {updated_file['word_count']}")

            # 测试删除文件
            print("\n7. 测试删除文件...")
            response = client.delete(f"/api/v1/md-files/{file_id}")
            print(f"删除文件状态码: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                print(f"✓ 删除文件成功")
                print(f"消息: {result['message']}")

            # 验证文件已删除
            print("\n8. 验证文件已删除...")
            response = client.get(f"/api/v1/md-files/{file_id}")
            print(f"获取已删除文件状态码: {response.status_code}")

            if response.status_code == 404:
                print("✓ 文件已成功删除")

        return True
    else:
        print(f"✗ 创建文件失败: {response.text}")
        return False


if __name__ == "__main__":
    success = test_md_files_api()
    sys.exit(0 if success else 1)

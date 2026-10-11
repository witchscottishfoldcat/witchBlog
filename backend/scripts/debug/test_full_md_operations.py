#!/usr/bin/env python3
"""
完整测试MD文件操作
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from main import app


def test_full_md_operations():
    """完整测试MD文件操作"""
    client = TestClient(app)

    print("=== 完整MD文件操作测试 ===")

    # 1. 创建文件
    print("\n1. 创建MD文件...")
    file_data = {
        "title": "我的第一个文档",
        "description": "这是一个测试文档，用于演示MD文件管理功能",
        "content": "# 我的第一个文档\n\n这是一个测试文档，用于演示MD文件管理功能。\n\n## 功能特点\n\n1. 支持Markdown格式\n2. 存储在MinIO中\n3. 元数据存储在MySQL中\n4. 支持增删改查操作",
        "filename": "my-first-doc.md",
        "tags": "文档,测试,Markdown",
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

    # 2. 获取文件信息
    print("\n2. 获取文件信息...")
    response = client.get(f"/api/v1/md-files/{file_id}")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        file_info = response.json()
        print(f"✓ 文件信息获取成功")
        print(f"  标题: {file_info['title']}")
        print(f"  描述: {file_info['description']}")
        print(f"  标签: {file_info['tags']}")
        print(f"  是否公开: {file_info['is_public']}")

    # 3. 获取文件内容
    print("\n3. 获取文件内容...")
    response = client.get(f"/api/v1/md-files/{file_id}/content")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        file_with_content = response.json()
        print(f"✓ 文件内容获取成功")
        print(f"  内容: {file_with_content['content'][:100]}...")

    # 4. 更新文件
    print("\n4. 更新文件...")
    update_data = {
        "title": "更新后的文档标题",
        "description": "这是更新后的文档描述",
        "content": "# 更新后的文档\n\n这是更新后的文档内容。\n\n## 更新内容\n\n1. 标题已更新\n2. 描述已更新\n3. 内容已更新\n4. 标签已更新",
        "tags": "更新,文档,测试",
        "is_public": False,
    }

    response = client.put(f"/api/v1/md-files/{file_id}", json=update_data)
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        updated_file = response.json()
        print(f"✓ 文件更新成功")
        print(f"  新标题: {updated_file['title']}")
        print(f"  新字数: {updated_file['word_count']}")
        print(f"  新对象名: {updated_file['object_name']}")

    # 5. 获取更新后的内容
    print("\n5. 获取更新后的文件内容...")
    response = client.get(f"/api/v1/md-files/{file_id}/content")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        file_with_content = response.json()
        print(f"✓ 更新后的文件内容获取成功")
        print(f"  内容: {file_with_content['content'][:100]}...")

    # 6. 创建第二个文件用于列表测试
    print("\n6. 创建第二个文件...")
    second_file_data = {
        "title": "第二个文档",
        "description": "这是第二个测试文档",
        "content": "# 第二个文档\n\n这是第二个测试文档，用于测试列表功能。",
        "filename": "second-doc.md",
        "tags": "文档,测试",
        "is_public": True,
    }

    response = client.post("/api/v1/md-files/", json=second_file_data)
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        second_file = response.json()
        print(f"✓ 第二个文件创建成功，ID: {second_file['id']}")
        second_file_id = second_file["id"]

    # 7. 获取文件列表
    print("\n7. 获取文件列表...")
    response = client.get("/api/v1/md-files/")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        files_list = response.json()
        print(f"✓ 文件列表获取成功，共 {files_list['total']} 个文件")
        for file in files_list["files"]:
            print(f"  - ID: {file['id']}, 标题: {file['title']}, 公开: {file['is_public']}")

    # 8. 搜索文件
    print("\n8. 搜索文件...")
    response = client.get("/api/v1/md-files/?search=更新")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        search_result = response.json()
        print(f"✓ 搜索成功，找到 {search_result['total']} 个文件")
        for file in search_result["files"]:
            print(f"  - ID: {file['id']}, 标题: {file['title']}")

    # 9. 删除文件
    print("\n9. 删除第一个文件...")
    response = client.delete(f"/api/v1/md-files/{file_id}")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✓ 第一个文件删除成功: {result['message']}")

    # 10. 验证文件已删除
    print("\n10. 验证文件已删除...")
    response = client.get(f"/api/v1/md-files/{file_id}")
    print(f"状态码: {response.status_code}")
    if response.status_code == 404:
        print("✓ 文件已成功删除")

    # 11. 再次获取文件列表
    print("\n11. 再次获取文件列表...")
    response = client.get("/api/v1/md-files/")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        files_list = response.json()
        print(f"✓ 文件列表获取成功，共 {files_list['total']} 个文件")
        for file in files_list["files"]:
            print(f"  - ID: {file['id']}, 标题: {file['title']}, 公开: {file['is_public']}")

    return True


if __name__ == "__main__":
    success = test_full_md_operations()
    sys.exit(0 if success else 1)

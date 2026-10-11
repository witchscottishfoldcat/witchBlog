#!/usr/bin/env python3
"""
测试通过JSON创建MD文件
"""

import requests

# 基础URL
BASE_URL = "http://localhost:8001/api/v1"


def test_md_json_create():
    """测试通过JSON创建MD文件"""

    print("=== 测试通过JSON创建MD文件 ===")

    # 准备数据
    md_data = {
        "title": "API创建的测试文档",
        "description": "这是通过API创建的测试Markdown文档",
        "content": """# API创建的测试文档

这是通过API的JSON接口创建的Markdown文档。

## 测试内容

- 使用JSON格式传递内容
- 直接存储到MinIO
- 支持Markdown格式

## 预期结果

文档应该被成功创建并存储到MinIO中。
""",
        "filename": "api-test.md",
        "tags": "API,测试,JSON",
        "is_public": True,
    }

    try:
        response = requests.post(f"{BASE_URL}/md-files/", json=md_data)

        if response.status_code == 200:
            md_file = response.json()
            print(f"✅ MD文件创建成功: {md_file['title']}")
            print(f"   ID: {md_file['id']}")
            print(f"   文件URL: {md_file['file_url']}")
            print(f"   是否公开: {md_file['is_public']}")
            print(f"   字数: {md_file['word_count']}")
            return True
        else:
            print(f"❌ MD文件创建失败: {response.status_code}")
            print(f"   错误信息: {response.text}")
            return False

    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")
        return False


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


if __name__ == "__main__":
    if test_api_health():
        test_md_json_create()

    print("\n=== 测试完成 ===")

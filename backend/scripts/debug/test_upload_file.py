#!/usr/bin/env python3
"""
测试MD文件上传接口
"""
import os
import sys
import tempfile

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from main import app


def test_upload_file():
    """测试文件上传接口"""
    client = TestClient(app)

    print("=== MD文件上传测试 ===")

    # 创建一个临时MD文件
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".md", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(
            "# 上传测试文档\n\n这是一个通过文件上传接口测试的Markdown文档。\n\n## 功能特点\n\n1. 支持直接上传MD文件\n2. 自动提取内容并存储\n3. 同时保存到MinIO和MySQL"
        )
        tmp_path = tmp.name

    try:
        # 测试上传文件
        print("\n1. 测试上传MD文件...")

        with open(tmp_path, "rb") as f:
            response = client.post(
                "/api/v1/md-files/upload",
                data={
                    "title": "上传的测试文档",
                    "description": "这是通过文件上传接口创建的文档",
                    "tags": "上传,测试,Markdown",
                    "is_public": True,
                },
                files={"file": ("test-upload.md", f, "text/markdown")},
            )

        print(f"状态码: {response.status_code}")
        if response.status_code != 200:
            print(f"响应: {response.text}")
            return False

        file_info = response.json()
        print(f"✓ 文件上传成功，ID: {file_info['id']}")
        file_id = file_info["id"]

        # 测试获取文件内容
        print("\n2. 测试获取上传的文件内容...")
        response = client.get(f"/api/v1/md-files/{file_id}/content")
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            file_with_content = response.json()
            print(f"✓ 获取文件内容成功")
            print(f"  标题: {file_with_content['title']}")
            print(f"  原始文件名: {file_with_content['original_filename']}")
            print(f"  内容预览: {file_with_content['content'][:50]}...")

        # 测试上传非MD文件
        print("\n3. 测试上传非MD文件...")
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", delete=False, encoding="utf-8"
        ) as tmp2:
            tmp2.write("这是一个文本文件，不是Markdown文件。")
            tmp2_path = tmp2.name

        with open(tmp2_path, "rb") as f:
            response = client.post(
                "/api/v1/md-files/upload",
                data={
                    "title": "非MD文件测试",
                    "description": "这应该失败",
                },
                files={"file": ("test.txt", f, "text/plain")},
            )

        print(f"状态码: {response.status_code}")
        if response.status_code == 400:
            print("✓ 正确拒绝非MD文件")
            print(f"  错误信息: {response.json()['detail']}")

        return True
    finally:
        # 清理临时文件
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if os.path.exists(tmp2_path):
            os.unlink(tmp2_path)


if __name__ == "__main__":
    success = test_upload_file()
    sys.exit(0 if success else 1)

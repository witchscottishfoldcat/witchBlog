#!/usr/bin/env python3
"""
测试MD文件上传功能
"""
import json
import os
import sys
import tempfile

import httpx

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_upload_md():
    """测试MD文件上传功能"""
    # 创建临时MD文件
    content = """# 测试上传文档

这是一个通过文件上传创建的Markdown文档。

## 功能特点

1. 支持直接上传.md文件
2. 自动提取文件内容
3. 存储在MinIO中
4. 元数据存储在MySQL中

## 代码示例

```python
# 上传文件示例
import requests

files = {'file': open('example.md', 'rb')}
data = {
    'title': '示例文档',
    'description': '这是一个示例文档',
    'tags': '示例,文档,Markdown',
    'is_public': True
}

response = requests.post(
    'http://localhost:8000/api/v1/md-files-upload/upload',
    files=files,
    data=data
)
```
"""

    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
        f.write(content)
        temp_file_path = f.name

    try:
        # 使用httpx发送POST请求
        with open(temp_file_path, "rb") as f:
            files = {"file": (os.path.basename(temp_file_path), f, "text/markdown")}
            data = {
                "title": "上传的测试文档",
                "description": "这是一个通过文件上传创建的Markdown文档",
                "tags": "上传,测试,Markdown",
                "is_public": True,
            }

            response = httpx.post(
                "http://localhost:8000/api/v1/md-files-upload/upload",
                files=files,
                data=data,
                timeout=30,
            )

            print(f"上传状态码: {response.status_code}")
            if response.status_code == 200:
                file_info = response.json()
                print(f"✓ 文件上传成功")
                print(f"  文件ID: {file_info['id']}")
                print(f"  标题: {file_info['title']}")
                print(f"  文件名: {file_info['original_filename']}")
                print(f"  对象名: {file_info['object_name']}")
                file_id = file_info["id"]
            else:
                print(f"✗ 文件上传失败: {response.text}")
                return False

        # 测试获取文件列表
        print("\n获取上传的文件列表...")
        response = httpx.get("http://localhost:8000/api/v1/md-files-upload/")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            files_list = response.json()
            print(f"✓ 获取文件列表成功，共 {len(files_list)} 个文件")
            for file in files_list:
                print(f"  - ID: {file['id']}, 标题: {file['title']}")

        # 测试获取文件内容
        print("\n获取上传的文件内容...")
        response = httpx.get(f"http://localhost:8000/api/v1/md-files-upload/{file_id}")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            file_info = response.json()
            print(f"✓ 获取文件信息成功")
            print(f"  标题: {file_info['title']}")
            print(f"  描述: {file_info['description']}")

        # 测试下载文件
        print("\n下载上传的文件...")
        response = httpx.get(
            f"http://localhost:8000/api/v1/md-files-upload/{file_id}/download"
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            content = response.text
            print(f"✓ 文件下载成功")
            print(f"  内容预览: {content[:100]}...")

        # 测试更新文件
        print("\n更新上传的文件...")

        # 创建新的临时文件
        new_content = """# 更新后的文档

这是更新后的Markdown文档。

## 更新内容

1. 文档已更新
2. 内容已修改
3. 版本号已增加

## 更新时间

文档更新于2025年11月18日
"""

        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(new_content)
            new_temp_file_path = f.name

        try:
            with open(new_temp_file_path, "rb") as f:
                files = {
                    "file": (os.path.basename(new_temp_file_path), f, "text/markdown")
                }
                data = {
                    "title": "更新后的文档标题",
                    "description": "这是更新后的文档描述",
                    "tags": "更新,文档,Markdown",
                    "is_public": False,
                }

                response = httpx.put(
                    f"http://localhost:8000/api/v1/md-files-upload/{file_id}",
                    files=files,
                    data=data,
                    timeout=30,
                )

                print(f"更新状态码: {response.status_code}")
                if response.status_code == 200:
                    updated_file = response.json()
                    print(f"✓ 文件更新成功")
                    print(f"  新标题: {updated_file['title']}")
                    print(f"  新对象名: {updated_file['object_name']}")
                else:
                    print(f"✗ 文件更新失败: {response.text}")
        finally:
            os.unlink(new_temp_file_path)

        # 测试删除文件
        print("\n删除上传的文件...")
        response = httpx.delete(
            f"http://localhost:8000/api/v1/md-files-upload/{file_id}"
        )
        print(f"删除状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✓ 文件删除成功: {result['message']}")

        # 验证文件已删除
        print("\n验证文件已删除...")
        response = httpx.get(f"http://localhost:8000/api/v1/md-files-upload/{file_id}")
        print(f"状态码: {response.status_code}")
        if response.status_code == 404:
            print("✓ 文件已成功删除")

        return True
    finally:
        # 清理临时文件
        os.unlink(temp_file_path)


if __name__ == "__main__":
    success = test_upload_md()
    sys.exit(0 if success else 1)

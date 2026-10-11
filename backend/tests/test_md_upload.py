#!/usr/bin/env python3
"""
测试MD文件上传功能
"""

import os
import tempfile

import requests

# 基础URL
BASE_URL = "http://localhost:8001/api/v1"


def test_md_upload():
    """测试MD文件上传"""

    print("=== 测试MD文件上传功能 ===")

    # 创建一个临时MD文件
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".md", delete=False, encoding="utf-8"
    ) as f:
        f.write(
            """# 测试Markdown文档

这是一个测试用的Markdown文档。

## 功能特性

- 支持Markdown格式
- 可以上传到MinIO存储
- 支持公开和私有访问

## 代码示例

```python
def hello_world():
    print("Hello, World!")
```

## 结论

这是一个简单的测试文档。
"""
        )
        temp_file_path = f.name

    try:
        # 上传文件
        with open(temp_file_path, "rb") as f:
            files = {
                "file": ("test.md", f, "text/markdown"),
                "title": (None, "测试Markdown文档"),
                "description": (None, "这是一个测试用的Markdown文档"),
                "tags": (None, "测试,文档,Markdown"),
                "is_public": (None, "True"),
            }

            response = requests.post(f"{BASE_URL}/md-files/upload", files=files)

            if response.status_code == 200:
                md_file = response.json()
                print(f"✅ MD文件上传成功: {md_file['title']}")
                print(f"   ID: {md_file['id']}")
                print(f"   文件URL: {md_file['file_url']}")
                print(f"   是否公开: {md_file['is_public']}")
                return True
            else:
                print(f"❌ MD文件上传失败: {response.status_code}")
                print(f"   错误信息: {response.text}")
                return False

    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")
        return False

    finally:
        # 清理临时文件
        try:
            os.unlink(temp_file_path)
        except Exception:
            pass


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
        test_md_upload()

    print("\n=== 测试完成 ===")

import os

import pytest

if not os.environ.get("WITCHCAT_LIVE_TESTS"):
    pytest.skip(
        "需要运行中的本地服务：启动服务并设置 WITCHCAT_LIVE_TESTS=1 后运行",
        allow_module_level=True,
    )

import json

import requests

# API 端点
url = "http://localhost:8000/api/v1/resource-links/"

# 请求数据
data = {
    "title": "测试链接",
    "url": "https://example.com/test",
    "description": "这是一个测试链接",
    "tags": "测试,API,示例",
    "category": "other",
    "is_active": True,
    "sort_order": 10,
}

# 发送 POST 请求
response = requests.post(url, json=data)

# 检查响应
if response.status_code == 200:
    print("创建链接成功!")
    print("响应数据:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
else:
    print(f"创建链接失败: {response.status_code}")
    print(f"错误信息: {response.text}")

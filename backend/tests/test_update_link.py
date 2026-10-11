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
url = "http://localhost:8000/api/v1/resource-links/8"

# 更新数据
data = {"title": "测试链接（已更新）", "description": "这是一个已更新的测试链接"}

# 发送 PUT 请求
response = requests.put(url, json=data)

# 检查响应
if response.status_code == 200:
    print("更新链接成功!")
    print("响应数据:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
else:
    print(f"更新链接失败: {response.status_code}")
    print(f"错误信息: {response.text}")

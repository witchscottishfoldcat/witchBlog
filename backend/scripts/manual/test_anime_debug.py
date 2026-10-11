import traceback

import requests

# API 基础URL
base_url = "http://localhost:8000/api/v1/anime-watchlist"

# 测试获取所有追番追剧
print("=== 测试获取所有追番追剧 ===")
try:
    response = requests.get(f"{base_url}/")
    print(f"状态码: {response.status_code}")
    print(f"响应头: {response.headers}")
    print(f"响应内容: {response.text}")
except Exception as e:
    print(f"请求异常: {e}")
    traceback.print_exc()

import json

import requests

# API 基础URL
base_url = "http://localhost:8000/api/v1/anime-watchlist"

# 测试获取所有追番追剧
print("=== 测试获取所有追番追剧 ===")
try:
    response = requests.get(f"{base_url}/")
    if response.status_code == 200:
        data = response.json()
        print(f"成功获取 {len(data)} 条追番追剧")
        if data:
            print(f"第一条数据: {data[0]['title']}")
    else:
        print(f"获取失败: {response.status_code} - {response.text}")
except Exception as e:
    print(f"请求异常: {e}")

import os

import pytest

if not os.environ.get("WITCHCAT_LIVE_TESTS"):
    pytest.skip(
        "需要运行中的本地服务：启动服务并设置 WITCHCAT_LIVE_TESTS=1 后运行",
        allow_module_level=True,
    )

import json

import requests

# API 基础URL
base_url = "http://localhost:8000/api/v1/anime-watchlist"

# 测试获取所有追番追剧
print("=== 测试获取所有追番追剧 ===")
response = requests.get(f"{base_url}/")
if response.status_code == 200:
    data = response.json()
    print(f"成功获取 {len(data)} 条追番追剧")
    print(json.dumps(data[0] if data else {}, indent=2, ensure_ascii=False))
else:
    print(f"获取失败: {response.status_code} - {response.text}")

# 测试获取"想看"的动漫
print("\n=== 测试获取'想看'的动漫 ===")
response = requests.get(f"{base_url}/want-watch")
if response.status_code == 200:
    data = response.json()
    print(f"成功获取 {len(data)} 条'想看'的动漫")
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f"获取失败: {response.status_code} - {response.text}")

# 测试获取"正在看"的动漫
print("\n=== 测试获取'正在看'的动漫 ===")
response = requests.get(f"{base_url}/watching")
if response.status_code == 200:
    data = response.json()
    print(f"成功获取 {len(data)} 条'正在看'的动漫")
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f"获取失败: {response.status_code} - {response.text}")

# 测试获取"已看完"的动漫
print("\n=== 测试获取'已看完'的动漫 ===")
response = requests.get(f"{base_url}/completed")
if response.status_code == 200:
    data = response.json()
    print(f"成功获取 {len(data)} 条'已看完'的动漫")
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f"获取失败: {response.status_code} - {response.text}")

# 测试获取收藏的动漫
print("\n=== 测试获取收藏的动漫 ===")
response = requests.get(f"{base_url}/favorites")
if response.status_code == 200:
    data = response.json()
    print(f"成功获取 {len(data)} 条收藏的动漫")
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f"获取失败: {response.status_code} - {response.text}")

# 测试获取状态统计
print("\n=== 测试获取状态统计 ===")
response = requests.get(f"{base_url}/statuses")
if response.status_code == 200:
    data = response.json()
    print("成功获取状态统计")
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f"获取失败: {response.status_code} - {response.text}")

# 测试创建新的追番追剧项目
print("\n=== 测试创建新的追番追剧项目 ===")
new_anime = {
    "title": "测试动漫",
    "url": "https://example.com/test-anime",
    "cover_image_url": "https://example.com/test-cover.jpg",
    "description": "这是一个测试动漫",
    "category": "anime",
    "tags": "测试,示例",
    "status": "want_watch",
    "progress": 0.0,
    "current_episode": 0,
    "total_episodes": 12,
    "rating": 0.0,
    "is_favorite": False,
    "is_active": True,
    "sort_order": 10,
}

response = requests.post(f"{base_url}/", json=new_anime)
if response.status_code == 200:
    data = response.json()
    print("成功创建追番追剧项目")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    item_id = data.get("id")

    # 测试更新观看进度
    print("\n=== 测试更新观看进度 ===")
    response = requests.patch(
        f"{base_url}/{item_id}/progress?progress=50&current_episode=6"
    )
    if response.status_code == 200:
        data = response.json()
        print("成功更新观看进度")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(f"更新进度失败: {response.status_code} - {response.text}")
else:
    print(f"创建失败: {response.status_code} - {response.text}")

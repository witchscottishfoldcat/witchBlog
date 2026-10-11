#!/usr/bin/env python3
"""测试获取日记ID 20的图片"""
import requests

# 测试获取日记ID 20的图片
diary_id = 20
url = f"http://127.0.0.1:8000/api/v1/diaries/{diary_id}/images"

try:
    response = requests.get(url)
    print(f"状态码: {response.status_code}")

    if response.status_code == 200:
        images = response.json()
        print(f"获取到 {len(images)} 张图片")
        for img in images:
            print(f'  图片ID: {img.get("id")}, 文件名: {img.get("original_filename")}')
            print(f'  URL: {img.get("image_url")}')
    else:
        print(f"请求失败: {response.text}")

except Exception as e:
    print(f"请求出错: {e}")

#!/usr/bin/env python3
"""测试获取日记图片的API"""
import json

import requests

# 先创建一个日记
create_data = {"title": "测试日记", "content": "这是一个测试日记", "is_public": True}

try:
    # 创建日记
    create_url = "http://127.0.0.1:8000/api/v1/diaries/"
    response = requests.post(create_url, json=create_data)

    if response.status_code == 201:
        diary = response.json()
        diary_id = diary.get("id")
        print(f"创建日记成功，ID: {diary_id}")

        # 获取日记图片
        images_url = f"http://127.0.0.1:8000/api/v1/diaries/{diary_id}/images"
        response = requests.get(images_url)

        print(f"获取图片状态码: {response.status_code}")

        if response.status_code == 200:
            images = response.json()
            print(f"获取到 {len(images)} 张图片")
            for img in images:
                print(f'  图片ID: {img.get("id")}, 文件名: {img.get("original_filename")}')
                print(f'  URL: {img.get("url")}')
        else:
            print(f"获取图片失败: {response.text}")
    else:
        print(f"创建日记失败: {response.status_code} - {response.text}")

except Exception as e:
    print(f"请求出错: {e}")

#!/usr/bin/env python3
"""
测试日记图片上传流程的脚本
"""

import io
import json
from datetime import datetime

import requests

BASE_URL = "http://127.0.0.1:8000"


def test_image_upload_flow():
    """测试完整的图片上传流程"""
    print("开始测试日记图片上传流程...")

    # 步骤1: 获取预签名上传URL
    diary_id = 11  # 使用现有的日记ID
    url = f"{BASE_URL}/api/v1/diaries/{diary_id}/images/upload-urls?file_count=1"

    print(f"获取预签名URL: {url}")
    response = requests.post(url)

    if response.status_code != 200:
        print(f"获取预签名URL失败: {response.status_code}")
        print(response.text)
        return False

    upload_data = response.json()
    if not upload_data or len(upload_data) == 0:
        print("返回的预签名URL为空")
        return False

    upload_info = upload_data[0]
    upload_url = upload_info.get("upload_url")
    object_name = upload_info.get("object_name")

    print(f"获取到上传URL: {upload_url}")
    print(f"对象名称: {object_name}")

    # 步骤2: 模拟上传图片
    # 创建一个简单的测试图片
    import os

    from PIL import Image

    # 创建一个简单的测试图片
    img = Image.new("RGB", (100, 100), color="red")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="JPEG")
    img_bytes.seek(0)

    print("上传测试图片...")
    upload_response = requests.put(upload_url, data=img_bytes.getvalue())

    if upload_response.status_code != 200:
        print(f"上传图片失败: {upload_response.status_code}")
        print(upload_response.text)
        return False

    print("图片上传成功")

    # 步骤3: 保存图片信息到数据库
    image_data = {
        "original_filename": "test_image.jpg",
        "file_size": len(img_bytes.getvalue()),
        "mime_type": "image/jpeg",
        "width": 100,
        "height": 100,
        "minio_object_name": object_name,
    }

    save_url = f"{BASE_URL}/api/v1/diaries/{diary_id}/images"
    print(f"保存图片信息: {save_url}")

    save_response = requests.post(save_url, json=image_data)

    if save_response.status_code != 201:
        print(f"保存图片信息失败: {save_response.status_code}")
        print(save_response.text)
        return False

    saved_image = save_response.json()
    print(f"图片信息保存成功: {saved_image}")

    return True


if __name__ == "__main__":
    test_image_upload_flow()

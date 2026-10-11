"""
测试相册API
"""
import requests
import json
import os
import uuid

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"

# 测试数据
test_album = {
    "title": "测试相册",
    "description": "这是一个测试相册",
    "tags": ["测试", "相册"],
    "is_public": True
}

test_photo_update = {
    "title": "测试照片标题",
    "description": "这是测试照片的描述",
    "tags": ["测试", "照片"],
    "is_cover": True,
    "sort_order": 1
}

def test_album_api():
    """测试相册API"""
    print("开始测试相册API...")
    
    # 1. 创建相册
    print("\n1. 创建相册...")
    response = requests.post(
        f"{BASE_URL}/albums/",
        json=test_album
    )
    print(f"状态码: {response.status_code}")
    if response.status_code == 201:
        album = response.json()
        album_id = album["id"]
        print(f"相册创建成功，ID: {album_id}")
        print(f"相册详情: {json.dumps(album, ensure_ascii=False, indent=2)}")
    else:
        print(f"创建失败: {response.text}")
        return
    
    # 2. 获取相册列表
    print("\n2. 获取相册列表...")
    response = requests.get(f"{BASE_URL}/albums/")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        albums = response.json()
        print(f"获取到 {len(albums['albums'])} 个相册")
    
    # 3. 获取相册详情
    print(f"\n3. 获取相册详情 (ID: {album_id})...")
    response = requests.get(f"{BASE_URL}/albums/{album_id}")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        album = response.json()
        print(f"相册详情: {json.dumps(album, ensure_ascii=False, indent=2)}")
    
    # 4. 更新相册
    print(f"\n4. 更新相册 (ID: {album_id})...")
    updated_album = {
        "title": "更新后的相册标题",
        "description": "更新后的相册描述"
    }
    response = requests.put(
        f"{BASE_URL}/albums/{album_id}",
        json=updated_album
    )
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        album = response.json()
        print(f"相册更新成功")
        print(f"更新后的详情: {json.dumps(album, ensure_ascii=False, indent=2)}")
    
    # 5. 测试照片上传URL获取
    print(f"\n5. 获取照片上传URL (相册ID: {album_id})...")
    response = requests.get(
        f"{BASE_URL}/albums/{album_id}/photos/upload-url",
        params={"filename": "test.jpg"}
    )
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        upload_info = response.json()
        print(f"上传URL获取成功")
        print(f"上传信息: {json.dumps(upload_info, ensure_ascii=False, indent=2)}")
    
    # 6. 获取相册中的照片列表
    print(f"\n6. 获取相册照片列表 (相册ID: {album_id})...")
    response = requests.get(f"{BASE_URL}/albums/{album_id}/photos")
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        photos = response.json()
        print(f"获取到 {len(photos['photos'])} 张照片")
    
    print("\n相册API测试完成！")

if __name__ == "__main__":
    test_album_api()
"""
详细测试照片上传
"""
from io import BytesIO

import requests
from PIL import Image

# API 基础URL
BASE_URL = "http://127.0.0.1:8000"


def create_test_image():
    """创建一个测试图片"""
    # 创建一个简单的图片
    img = Image.new("RGB", (50, 50), color="blue")
    img_bytes = BytesIO()
    img.save(img_bytes, format="JPEG")
    img_bytes.seek(0)
    return img_bytes


def test_upload_detailed():
    """详细测试照片上传"""
    print("开始详细测试照片上传...")

    # 1. 先获取现有相册列表
    print("\n1. 获取相册列表...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/albums/")
        if response.status_code == 200:
            data = response.json()
            albums = data.get("albums", [])
            if not albums:
                print("❌ 没有找到相册，请先创建一个相册")
                return

            album_id = albums[0]["id"]
            print(f"✅ 使用相册 ID: {album_id}")
        else:
            print(f"❌ 获取相册列表失败: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return

    # 2. 尝试上传照片
    print("\n2. 尝试上传照片...")
    test_img = create_test_image()

    try:
        files = {"file": ("test_image.jpg", test_img, "image/jpeg")}
        data = {
            "title": "详细测试照片",
            "description": "这是一张详细测试照片",
            "tags": "测试,照片,详细",
            "is_cover": False,  # 不设为封面，避免冲突
            "sort_order": 2,
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/albums/{album_id}/photos", files=files, data=data
        )

        print(f"响应状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")

        if response.status_code == 201:
            photo = response.json()
            print("✅ 照片上传成功")
            print(f"   照片ID: {photo['id']}")
            print(f"   照片URL: {photo.get('image_url', 'N/A')}")
        else:
            print(f"❌ 照片上传失败: {response.status_code}")
            print(f"响应内容: {response.text}")

    except Exception as e:
        print(f"❌ 请求失败: {e}")
        import traceback

        traceback.print_exc()

    print("\n测试完成！")


if __name__ == "__main__":
    test_upload_detailed()

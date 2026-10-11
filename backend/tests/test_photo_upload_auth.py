"""
测试照片上传功能（包含认证）
"""
import os
from io import BytesIO

import requests
from PIL import Image

# API 基础URL
BASE_URL = "http://127.0.0.1:8000"


def create_test_image():
    """创建一个测试图片"""
    # 创建一个简单的图片
    img = Image.new("RGB", (100, 100), color="red")
    img_bytes = BytesIO()
    img.save(img_bytes, format="JPEG")
    img_bytes.seek(0)
    return img_bytes


def login_user(username=None, password=None):
    """用户登录获取token"""
    username = username or os.environ["TEST_ADMIN_USERNAME"]
    password = password or os.environ["TEST_ADMIN_PASSWORD"]
    login_data = {"username": username, "password": password}

    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            data=login_data,  # 使用data而不是json，因为通常是form表单
        )

        if response.status_code == 200:
            auth_data = response.json()
            access_token = auth_data.get("access_token")
            if access_token:
                return {"Authorization": f"Bearer {access_token}"}
        print(f"❌ 登录失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ 登录请求失败: {e}")

    return None


def test_photo_upload():
    """测试照片上传功能"""
    print("开始测试照片上传（包含认证）...")

    # 1. 登录获取token
    print("\n1. 用户登录...")
    headers = login_user()
    if not headers:
        print("无法获取认证token，尝试创建测试用户...")
        # 尝试创建用户
        try:
            user_data = {
                "username": "testuser",
                "email": "test@example.com",
                "password": "test123456",
            }
            response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
            if response.status_code == 201:
                print("✅ 用户创建成功，尝试登录...")
                headers = login_user("testuser", "test123456")

            if not headers:
                print("❌ 仍然无法获取认证token")
                return
        except Exception as e:
            print(f"❌ 创建用户失败: {e}")
            return

    print("✅ 登录成功")

    # 2. 创建一个测试相册
    print("\n2. 创建测试相册...")
    album_data = {
        "title": "照片上传测试相册",
        "description": "用于测试照片上传功能的相册",
        "is_public": True,
    }

    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/albums/", json=album_data, headers=headers
        )

        if response.status_code != 201:
            print(f"❌ 创建相册失败: {response.status_code} - {response.text}")
            return

        album = response.json()
        album_id = album["id"]
        print(f"✅ 成功创建相册，ID: {album_id}")

    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return

    # 3. 上传照片
    print("\n3. 上传照片...")
    test_img = create_test_image()

    try:
        files = {"file": ("test_image.jpg", test_img, "image/jpeg")}
        data = {
            "title": "测试照片",
            "description": "这是一张测试照片",
            "tags": "测试,照片,上传",
            "is_cover": True,
            "sort_order": 1,
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/albums/{album_id}/photos",
            files=files,
            data=data,
            headers=headers,
        )

        if response.status_code == 201:
            photo = response.json()
            print("✅ 照片上传成功")
            print(f"   照片ID: {photo['id']}")
            print(f"   照片URL: {photo.get('image_url', 'N/A')}")
            print(f"   缩略图URL: {photo.get('thumbnail_url', 'N/A')}")

            # 4. 获取相册详情，验证照片是否已添加
            print("\n4. 验证相册中的照片...")
            response = requests.get(f"{BASE_URL}/api/v1/albums/{album_id}")

            if response.status_code == 200:
                album_detail = response.json()
                photo_count = album_detail.get("photo_count", 0)
                print(f"✅ 相册中照片数量: {photo_count}")
                if photo_count > 0:
                    print(f"   封面照片ID: {album_detail.get('cover_photo_id', 'N/A')}")
                    cover_photo = album_detail.get("cover_photo")
                    if cover_photo:
                        print(f"   封面照片标题: {cover_photo.get('title', 'N/A')}")
                else:
                    print("❌ 相册中没有照片")
            else:
                print(f"❌ 获取相册详情失败: {response.status_code} - {response.text}")

            # 5. 获取照片列表
            print("\n5. 获取照片列表...")
            response = requests.get(f"{BASE_URL}/api/v1/albums/{album_id}/photos")

            if response.status_code == 200:
                photos_response = response.json()
                total = photos_response.get("total", 0)
                print(f"✅ 照片列表获取成功，总数: {total}")
                photos = photos_response.get("photos", [])
                if photos:
                    for i, photo in enumerate(photos[:1]):  # 只显示第一个照片的详细信息
                        print(f"   照片{i+1}: {photo.get('title', 'N/A')}")
                        print(f"   ID: {photo.get('id')}")
                        print(f"   文件大小: {photo.get('file_size')} bytes")
                        print(f"   MIME类型: {photo.get('mime_type')}")
                        print(f"   是否为封面: {photo.get('is_cover')}")
            else:
                print(f"❌ 获取照片列表失败: {response.status_code} - {response.text}")

        else:
            print(f"❌ 照片上传失败: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"❌ 请求失败: {e}")

    print("\n测试完成！")


if __name__ == "__main__":
    test_photo_upload()

"""
测试相册API是否已修复
"""

import requests

# API 基础URL
BASE_URL = "http://127.0.0.1:8000"


def test_album_api():
    """测试相册API功能"""
    print("开始测试相册API...")

    # 1. 测试获取相册列表
    print("\n1. 测试获取相册列表...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/albums/")
        if response.status_code == 200:
            print("✅ 获取相册列表成功")
            data = response.json()
            print(f"   当前相册数量: {data['total']}")
        else:
            print(f"❌ 获取相册列表失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ 请求失败: {e}")

    # 2. 测试创建相册
    print("\n2. 测试创建相册...")
    album_data = {
        "title": "测试相册",
        "description": "这是一个测试相册",
        "tags": ["测试", "API"],
        "is_public": True,
    }

    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/albums/",
            json=album_data,
            headers={"Content-Type": "application/json"},
        )
        if response.status_code == 201:
            print("✅ 创建相册成功")
            album = response.json()
            print(f"   相册ID: {album['id']}")
            print(f"   相册标题: {album['title']}")

            # 3. 测试获取单个相册
            print("\n3. 测试获取单个相册...")
            album_id = album["id"]
            response = requests.get(f"{BASE_URL}/api/v1/albums/{album_id}")
            if response.status_code == 200:
                print("✅ 获取单个相册成功")
            else:
                print(f"❌ 获取单个相册失败: {response.status_code} - {response.text}")

        else:
            print(f"❌ 创建相册失败: {response.status_code} - {response.text}")
            print("   可能是因为服务器未启动或仍有错误")
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        print("   可能是因为服务器未启动")

    print("\n测试完成！")
    print("如果看到错误，请确保服务器已启动: python main.py")


if __name__ == "__main__":
    test_album_api()

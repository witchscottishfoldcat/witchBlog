"""
测试带有照片的相册
"""
import requests

# API 基础URL
BASE_URL = "http://127.0.0.1:8000"


def test_album_with_photo():
    """测试带有照片的相册"""
    print("开始测试带有照片的相册...")

    # 1. 获取相册列表
    print("\n1. 获取相册列表...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/albums/")
        if response.status_code == 200:
            data = response.json()
            albums = data.get("albums", [])
            print(f"✅ 找到 {len(albums)} 个相册")

            for album in albums:
                print(f"   - 相册ID: {album['id']}, 标题: {album['title']}")
                print(f"     照片数量: {album['photo_count']}")
                print(f"     封面照片ID: {album.get('cover_photo_id', 'N/A')}")
                if album.get("cover_photo"):
                    print(f"     封面照片标题: {album['cover_photo'].get('title', 'N/A')}")
                print()

            # 2. 获取第一个相册的详细信息
            if albums:
                album_id = albums[0]["id"]
                print(f"\n2. 获取相册 {album_id} 的详细信息...")
                response = requests.get(f"{BASE_URL}/api/v1/albums/{album_id}")
                if response.status_code == 200:
                    album_detail = response.json()
                    photos = album_detail.get("photos", [])
                    print(f"✅ 相册详情获取成功，照片数量: {len(photos)}")

                    for photo in photos:
                        print(
                            f"   - 照片ID: {photo['id']}, 标题: {photo.get('title', 'N/A')}"
                        )
                        print(f"     文件大小: {photo.get('file_size', 'N/A')} bytes")
                        print(f"     MIME类型: {photo.get('mime_type', 'N/A')}")
                        print(f"     是否为封面: {photo.get('is_cover', False)}")
                        print(f"     图片URL: {photo.get('image_url', 'N/A')}")
                        print()
                else:
                    print(f"❌ 获取相册详情失败: {response.status_code}")
        else:
            print(f"❌ 获取相册列表失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 请求失败: {e}")

    # 3. 获取照片列表
    print("\n3. 获取照片列表...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/albums/3/photos")
        if response.status_code == 200:
            data = response.json()
            photos = data.get("photos", [])
            total = data.get("total", 0)
            print(f"✅ 找到 {total} 张照片")

            for photo in photos:
                print(f"   - 照片ID: {photo['id']}, 标题: {photo.get('title', 'N/A')}")
                print(f"     图片URL: {photo.get('image_url', 'N/A')}")
                print()
        else:
            print(f"❌ 获取照片列表失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 请求失败: {e}")


if __name__ == "__main__":
    test_album_with_photo()

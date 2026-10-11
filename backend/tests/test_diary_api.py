import os

import pytest

"""
测试日记API的脚本
"""


import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"


def test_diary_api():
    diary_id = 1
    """测试日记API"""
    print("测试日记API")

    # 首先测试服务器是否可用
    try:
        response = requests.get(f"{BASE_URL}/diaries/?skip=0&limit=1&public_only=true")
        print(f"服务器状态: {response.status_code}")
        if response.status_code == 401:
            print("提示：服务器返回401错误，这是因为我们没有提供认证令牌")
            print("但我们应该能访问公开日记，让我们检查问题...")
    except requests.exceptions.ConnectionError:
        print(f"错误：无法连接到服务器 {BASE_URL}")
        print("请确保服务器正在运行：python start_test_server.py 或 python main.py")
        return None

    # 1. 测试创建日记
    print("\n1. 测试创建日记")
    diary_data = {
        "title": "我的第一篇日记",
        "content": "# 今天天气真好\n\n今天是美好的一天，阳光明媚，适合出去散步。",
        "weather": "晴天",
        "mood": "开心",
        "tags": ["心情", "天气"],
        "is_public": True,
    }

    response = requests.post(f"{BASE_URL}/diaries/", json=diary_data)
    print(f"创建日记响应: {response.status_code}")
    if response.status_code == 201:
        diary = response.json()
        diary_id = diary["id"]
        print(f"成功创建日记，ID: {diary_id}")
        print(f"日记标题: {diary['title']}")

        # 2. 测试获取日记列表
        print("\n2. 测试获取日记列表")
        response = requests.get(f"{BASE_URL}/diaries/")
        print(f"获取日记列表响应: {response.status_code}")
        if response.status_code == 200:
            diaries = response.json()
            print(f"获取到 {diaries['total']} 篇日记")

            # 3. 测试获取单篇日记详情
            print("\n3. 测试获取单篇日记详情")
            response = requests.get(f"{BASE_URL}/diaries/{diary_id}")
            if response.status_code == 200:
                diary_detail = response.json()
                print(f"获取日记详情成功: {diary_detail['title']}")

                # 4. 测试获取图片上传URL
                print("\n4. 测试获取图片上传URL")
                response = requests.post(
                    f"{BASE_URL}/diaries/{diary_id}/images/upload-urls?file_count=2"
                )
                if response.status_code == 200:
                    upload_urls = response.json()
                    print(f"获取到 {len(upload_urls)} 个上传URL")
                    for i, url_info in enumerate(upload_urls):
                        print(f"  URL {i+1}: {url_info['object_name']}")
                else:
                    print(f"获取上传URL失败: {response.status_code} - {response.text}")
            else:
                print(f"获取日记详情失败: {response.status_code} - {response.text}")
        else:
            print(f"获取日记列表失败: {response.status_code} - {response.text}")
    else:
        print(f"创建日记失败: {response.status_code} - {response.text}")
        return None

    return diary_id


@pytest.mark.skipif(
    not os.environ.get("WITCHCAT_LIVE_TESTS"),
    reason="需要运行中的本地服务（WITCHCAT_LIVE_TESTS=1）",
)
def test_image_upload():
    diary_id = 1
    """测试图片上传流程"""
    print("\n测试图片上传流程")

    # 1. 获取上传URL
    response = requests.post(
        f"{BASE_URL}/diaries/{diary_id}/images/upload-urls?file_count=1"
    )
    if response.status_code != 200:
        print(f"获取上传URL失败: {response.status_code} - {response.text}")
        return

    upload_url_info = response.json()[0]
    upload_url = upload_url_info["upload_url"]
    object_name = upload_url_info["object_name"]

    # 2. 上传图片（模拟）
    print(f"准备上传图片到: {object_name}")

    # 创建一个简单的测试图片文件（实际应用中，这里应该是真实的图片文件）
    import base64

    # 1x1像素的红色JPEG图片的base64编码
    red_pixel_base64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="  # noqa: E501

    # 解码base64获取图片数据
    image_data = base64.b64decode(red_pixel_base64)

    # 上传图片
    headers = {"Content-Type": "image/jpeg", "Content-Length": str(len(image_data))}

    response = requests.put(upload_url, data=image_data, headers=headers)
    if response.status_code == 200:
        print("图片上传成功")

        # 3. 保存图片信息
        image_info = {
            "original_filename": "test_image.jpg",
            "file_size": len(image_data),
            "mime_type": "image/jpeg",
            "width": 1,
            "height": 1,
            "minio_object_name": object_name,
        }

        response = requests.post(
            f"{BASE_URL}/diaries/{diary_id}/images", json=image_info
        )
        if response.status_code == 201:
            saved_image = response.json()
            print(f"图片信息保存成功: {saved_image['image_url']}")
        else:
            print(f"保存图片信息失败: {response.status_code} - {response.text}")
    else:
        print(f"图片上传失败: {response.status_code} - {response.text}")


if __name__ == "__main__":
    print("开始测试日记API...")
    diary_id = test_diary_api()

    if diary_id:
        test_image_upload(diary_id)

    print("\n测试完成！")

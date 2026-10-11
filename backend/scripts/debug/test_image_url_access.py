#!/usr/bin/env python3
"""
测试 MinIO 图片 URL 的公共访问权限
"""

import os

import requests

from app.services.diary_service import diary_service


def test_image_url_access():
    """测试图片 URL 的访问权限"""
    # 测试一个已知的图片 URL
    image_url = os.getenv("TEST_IMAGE_URL", "http://127.0.0.1:9000/example.jpg")

    print(f"测试图片 URL 访问: {image_url}")

    try:
        response = requests.head(image_url, timeout=5)
        print(f"响应状态码: {response.status_code}")

        if response.status_code == 200:
            print("✅ 图片 URL 可以公开访问")
            return True
        else:
            print("❌ 图片 URL 访问失败")
            print(f"响应头: {dict(response.headers)}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ 访问图片 URL 时发生异常: {e}")
        return False


def generate_test_image_url():
    """生成一个测试图片 URL"""
    object_name = "diary-images/public/test/sample.jpg"
    image_url = diary_service.get_image_url(object_name)
    print(f"生成的测试图片 URL: {image_url}")
    return image_url


if __name__ == "__main__":
    print("测试 MinIO 图片 URL 访问权限...")

    # 测试已知图片 URL
    test_image_url_access()

    # 生成并显示新的图片 URL 格式
    generate_test_image_url()

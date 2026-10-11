#!/usr/bin/env python3
"""
测试MinIO图片上传功能
"""


import requests

# 基础URL
BASE_URL = "http://localhost:8001/api/v1/links"


def test_minio_upload():
    """测试MinIO图片上传功能"""

    print("=== 测试MinIO图片上传功能 ===")

    # 测试1: 上传单张图片
    print("\n1. 测试上传单张图片")

    # 准备一个测试图片文件（这里使用一个简单的图片URL）
    test_image_url = "https://github.com/fluidicon.png"

    # 下载图片
    try:
        response = requests.get(test_image_url)
        if response.status_code == 200:
            image_data = response.content
            image_name = "github-test.png"

            # 上传图片
            files = {"file": (image_name, image_data, "image/png")}
            upload_response = requests.post(f"{BASE_URL}/upload-image", files=files)

            if upload_response.status_code == 200:
                result = upload_response.json()
                print(f"✅ 图片上传成功: {result['image_url']}")
                print(f"   对象名称: {result['object_name']}")

                # 测试2: 使用上传的图片创建链接
                print("\n2. 测试使用上传的图片创建链接")

                # 使用form-data格式提交
                form_data = {
                    "name": "GitHub (测试上传图片)",
                    "url": "https://github.com",
                    "description": "全球最大的代码托管平台（测试上传图片）",
                    "tags": "代码,开源,Git,测试",
                    "category": "friend",
                    "sort_order": "100",
                    "is_active": "True",
                }

                files_with_image = {"file": (image_name, image_data, "image/png")}
                create_response = requests.post(
                    f"{BASE_URL}/create-with-image",
                    data=form_data,
                    files=files_with_image,
                )

                if create_response.status_code == 200:
                    created_link = create_response.json()
                    print(f"✅ 创建带图片的链接成功: {created_link['name']}")
                    print(f"   图片URL: {created_link['image_url']}")
                    print(f"   图片类型: {created_link['image_type']}")

                    # 测试3: 更新链接图片
                    print("\n3. 测试更新链接图片")
                    link_id = created_link["id"]

                    # 下载另一个图片
                    test_image_url2 = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"  # noqa: E501
                    response2 = requests.get(test_image_url2)
                    if response2.status_code == 200:
                        image_data2 = response2.content
                        image_name2 = "google-test.png"

                        files_update = {"file": (image_name2, image_data2, "image/png")}
                        update_response = requests.post(
                            f"{BASE_URL}/{link_id}/upload-image", files=files_update
                        )

                        if update_response.status_code == 200:
                            updated_link = update_response.json()
                            print(f"✅ 更新链接图片成功: {updated_link['name']}")
                            print(f"   新图片URL: {updated_link['image_url']}")
                            print(f"   图片类型: {updated_link['image_type']}")
                        else:
                            print(
                                f"❌ 更新链接图片失败: {update_response.status_code}, {update_response.text}"  # noqa: E501
                            )
                    else:
                        print(f"❌ 下载第二张测试图片失败: {test_image_url2}")
                else:
                    print(
                        f"❌ 创建带图片的链接失败: {create_response.status_code}, {create_response.text}"  # noqa: E501
                    )
            else:
                print(
                    f"❌ 图片上传失败: {upload_response.status_code}, {upload_response.text}"
                )
        else:
            print(f"❌ 下载测试图片失败: {test_image_url}")
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")

    print("\n=== 测试完成 ===")


if __name__ == "__main__":
    # 确保服务器运行在 http://localhost:8001
    test_minio_upload()

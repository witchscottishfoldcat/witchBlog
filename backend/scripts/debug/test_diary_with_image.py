#!/usr/bin/env python3
"""测试创建日记并添加图片"""
import io
import json

import requests
from PIL import Image

# 1. 创建日记
create_data = {"title": "带图片的测试日记", "content": "这是一个带图片的测试日记", "is_public": True}

try:
    # 创建日记
    create_url = "http://127.0.0.1:8000/api/v1/diaries/"
    response = requests.post(create_url, json=create_data)

    if response.status_code == 201:
        diary = response.json()
        diary_id = diary.get("id")
        print(f"创建日记成功，ID: {diary_id}")

        # 2. 获取上传URL
        upload_urls_url = f"http://127.0.0.1:8000/api/v1/diaries/{diary_id}/images/upload-urls?file_count=1"
        response = requests.post(upload_urls_url)

        if response.status_code == 200:
            upload_urls = response.json()
            upload_url = upload_urls[0]["upload_url"]
            object_name = upload_urls[0]["object_name"]

            print(f"获取上传URL成功: {object_name}")

            # 3. 上传图片
            img = Image.new("RGB", (100, 100), color="blue")
            img_bytes = io.BytesIO()
            img.save(img_bytes, format="JPEG")
            img_bytes.seek(0)

            # 直接上传到MinIO
            response = requests.put(
                upload_url,
                data=img_bytes.read(),
                headers={"Content-Type": "image/jpeg"},
            )

            if response.status_code == 200:
                print("图片上传成功")

                # 4. 保存图片信息
                save_image_url = (
                    f"http://127.0.0.1:8000/api/v1/diaries/{diary_id}/images"
                )
                image_data = {
                    "minio_object_name": object_name,
                    "original_filename": "test.jpg",
                    "file_size": 1024,
                    "mime_type": "image/jpeg",
                    "width": 100,
                    "height": 100,
                }

                response = requests.post(save_image_url, json=image_data)

                if response.status_code == 201:
                    print("图片信息保存成功")

                    # 5. 获取日记图片
                    images_url = (
                        f"http://127.0.0.1:8000/api/v1/diaries/{diary_id}/images"
                    )
                    response = requests.get(images_url)

                    if response.status_code == 200:
                        images = response.json()
                        print(f"获取到 {len(images)} 张图片")
                        for img in images:
                            print(
                                f'  图片ID: {img.get("id")}, 文件名: {img.get("original_filename")}'
                            )
                            print(f'  URL: {img.get("image_url")}')  # 使用正确的字段名

                            # 6. 测试图片访问
                            img_url = img.get("url")
                            if img_url:
                                response = requests.get(img_url)
                                print(f"  图片访问状态: {response.status_code}")
                    else:
                        print(f"获取图片失败: {response.status_code}")
                else:
                    print(f"保存图片信息失败: {response.status_code}")
            else:
                print(f"图片上传失败: {response.status_code}")
        else:
            print(f"获取上传URL失败: {response.status_code}")
    else:
        print(f"创建日记失败: {response.status_code} - {response.text}")

except Exception as e:
    print(f"请求出错: {e}")

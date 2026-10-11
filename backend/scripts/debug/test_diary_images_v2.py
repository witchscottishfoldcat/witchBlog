#!/usr/bin/env python3
"""测试新的 diary-imagesV2 路径"""

from app.services.diary_service import diary_service

# 测试生成新的路径
diary_id = 19
path = diary_service._generate_diary_path(diary_id)
print(f"新的日记图片路径: {path}")
print(f'是否包含 diary-imagesV2: {"diary-imagesV2" in path}')

# 测试生成上传URL
upload_urls = diary_service.generate_upload_urls(diary_id, None, 1)
if upload_urls:
    print(f"对象名称: {upload_urls[0].object_name}")
    print(f"URL: {upload_urls[0].upload_url}")

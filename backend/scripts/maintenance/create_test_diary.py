#!/usr/bin/env python3
"""创建测试日记和图片"""
from app.core.database import get_db
from app.models.diary import Diary, DiaryImage
from app.services.diary_service import diary_service

db = next(get_db())
try:
    # 创建一个公开的测试日记
    diary = Diary(
        title="测试日记", content="这是一个测试日记", is_public=True, user_id=None  # 无用户的公开日记
    )
    db.add(diary)
    db.commit()
    db.refresh(diary)

    print(f"创建了新日记，ID: {diary.id}")

    # 生成上传URL
    upload_urls = diary_service.generate_upload_urls(diary.id, None, 1)
    object_name = upload_urls[0].object_name

    # 创建图片记录（实际上传会在前端进行）
    image = DiaryImage(
        diary_id=diary.id,
        minio_bucket="witchcat-files",
        minio_object_name=object_name,
        original_filename="test.jpg",
        file_size=1024,
        mime_type="image/jpeg",
        width=100,
        height=100,
    )
    db.add(image)
    db.commit()

    print(f"为日记添加了测试图片，对象名: {object_name}")
    print(f"测试日记ID: {diary.id}")

finally:
    db.close()

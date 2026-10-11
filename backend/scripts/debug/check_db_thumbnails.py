#!/usr/bin/env python3
"""
检查数据库中记录的缩略图信息
"""

import os

from sqlalchemy.orm import Session

from app.core.database import engine
from app.models.diary import DiaryImage


def check_db_thumbnails():
    """检查数据库中的缩略图记录"""
    try:
        # 创建数据库会话
        with Session(engine) as session:
            # 查询最近的图片记录
            recent_images = (
                session.query(DiaryImage).order_by(DiaryImage.id.desc()).limit(5).all()
            )

            print("检查数据库中最新的图片记录...")
            for img in recent_images:
                print(f"ID: {img.id}")
                print(f"  日记ID: {img.diary_id}")
                print(f"  原图路径: {img.minio_object_name}")
                print(f"  缩略图路径: {img.thumbnail_minio_object_name}")
                print("---")

            return recent_images

    except Exception as e:
        print(f"发生错误: {e}")
        import traceback

        traceback.print_exc()
        return None


if __name__ == "__main__":
    check_db_thumbnails()

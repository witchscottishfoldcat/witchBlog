#!/usr/bin/env python3
"""
更新葬送的芙莉莲的封面图片
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.anime_watchlist import AnimeWatchlist
from app.services.minio_service import MinIOService


def update_frieren_cover():
    """更新葬送的芙莉莲的封面图片"""
    # 获取数据库会话
    db = next(get_db())

    # 查找葬送的芙莉莲的记录
    item = db.query(AnimeWatchlist).filter(AnimeWatchlist.title == "葬送的芙莉莲").first()

    if item:
        print(f"找到记录: ID={item.id}, 标题={item.title}")
        print(f"当前封面图片URL: {item.cover_image_url}")
        print(f"当前封面图片对象名: {item.cover_image_object_name}")

        # 创建MinIO服务实例
        minio_service = MinIOService()

        try:
            # 提取并上传封面图片
            object_name, public_url = minio_service.extract_and_upload_cover_from_url(
                item.url
            )

            # 更新数据库记录
            item.cover_image_object_name = object_name
            item.cover_image_url = public_url

            # 提交更改
            db.commit()

            print("\n更新成功!")
            print(f"新封面图片对象名: {item.cover_image_object_name}")
            print(f"新封面图片URL: {item.cover_image_url}")

        except Exception as e:
            print(f"\n更新失败: {e}")
            db.rollback()
    else:
        print("未找到葬送的芙莉莲的记录")


if __name__ == "__main__":
    update_frieren_cover()

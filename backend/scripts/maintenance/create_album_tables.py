"""
创建相册和照片相关的数据库表
"""
from sqlalchemy import create_engine, text

from app.core.config import settings
from app.models import Album, Base, Photo


def create_album_tables():
    """创建相册和照片表"""
    engine = create_engine(settings.DATABASE_URL)

    # 创建所有表（仅包含相册和照片表）
    # 这里只创建我们定义的表，避免影响其他表
    print("正在创建相册和照片表...")

    # 直接创建相册表
    Album.__table__.create(engine, checkfirst=True)
    print("相册表(Album)创建完成")

    # 直接创建照片表
    Photo.__table__.create(engine, checkfirst=True)
    print("照片表(Photo)创建完成")

    print("所有相册相关表创建完成！")


if __name__ == "__main__":
    create_album_tables()

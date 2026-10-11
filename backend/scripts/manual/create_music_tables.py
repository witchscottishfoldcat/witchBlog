from app.core.database import engine
from app.models import Base
from app.models.music import MusicLibrary, MusicTrack


def create_music_tables():
    """创建音乐馆相关的数据库表"""
    try:
        Base.metadata.create_all(
            bind=engine, tables=[MusicLibrary.__table__, MusicTrack.__table__]
        )
        print("✅ 音乐馆表创建成功！")
        print(f"   - music_libraries")
        print(f"   - music_tracks")
    except Exception as e:
        print(f"❌ 创建表失败: {e}")
        raise


if __name__ == "__main__":
    create_music_tables()

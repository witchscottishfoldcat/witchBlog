#!/usr/bin/env python3
"""
检查anime_watchlist表中的数据
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def check_anime_data():
    """检查anime_watchlist表中的数据"""
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # 获取所有没有MinIO封面图片的项目，按创建时间降序排序
            result = conn.execute(text("""
                SELECT id, title, cover_image_url, cover_image_object_name, created_at
                FROM anime_watchlist
                WHERE cover_image_object_name IS NULL OR cover_image_object_name = ''
                ORDER BY created_at DESC
                LIMIT 10
            """))
            rows = result.fetchall()
            
            print("没有MinIO封面图片的项目（按创建时间降序）:")
            for row in rows:
                print(f"  ID: {row[0]}, 标题: {row[1]}, 封面URL: {row[2] or 'NULL'}, 创建时间: {row[4]}")
            
            # 检查最新的3个项目是否是我们创建的测试数据
            print("\n最新的3个项目详情:")
            if rows:
                for i, row in enumerate(rows[:3]):
                    print(f"  {i+1}. ID: {row[0]}")
                    print(f"     标题: {row[1]}")
                    print(f"     封面URL: {row[2] or 'NULL'}")
                    print(f"     MinIO对象名: {row[3] or 'NULL'}")
                    print(f"     创建时间: {row[4]}")
    
    except Exception as e:
        print(f"检查数据失败: {e}")
        return False
    
    finally:
        engine.dispose()
    
    return True

if __name__ == "__main__":
    print("检查anime_watchlist表中的数据...\n")
    check_anime_data()
    print("\n检查完成！")
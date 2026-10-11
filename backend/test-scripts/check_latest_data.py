#!/usr/bin/env python3
"""
检查最新的数据
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def check_latest_data():
    """检查最新的数据"""
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # 获取最新的5个项目
            result = conn.execute(text("""
                SELECT id, title, url, cover_image_url, cover_image_object_name, created_at
                FROM anime_watchlist
                ORDER BY created_at DESC
                LIMIT 10
            """))
            rows = result.fetchall()
            
            print("最新的10个项目:")
            for i, row in enumerate(rows, 1):
                print(f"  {i}. ID: {row[0]}")
                print(f"     标题: {row[1]}")
                print(f"     URL: {row[2]}")
                print(f"     封面URL: {row[3] or 'NULL'}")
                print(f"     MinIO对象名: {row[4] or 'NULL'}")
                print(f"     创建时间: {row[5]}")
                print()
            
            # 查询没有MinIO封面图片的最新项目
            result2 = conn.execute(text("""
                SELECT id, title, url, cover_image_url, cover_image_object_name, created_at
                FROM anime_watchlist
                WHERE (cover_image_object_name IS NULL OR cover_image_object_name = '')
                ORDER BY created_at DESC
                LIMIT 10
            """))
            rows2 = result2.fetchall()
            
            print("\n没有MinIO封面图片的最新10个项目:")
            for i, row in enumerate(rows2, 1):
                print(f"  {i}. ID: {row[0]}")
                print(f"     标题: {row[1]}")
                print(f"     URL: {row[2]}")
                print(f"     封面URL: {row[3] or 'NULL'}")
                print(f"     MinIO对象名: {row[4] or 'NULL'}")
                print(f"     创建时间: {row[5]}")
                print()
    
    except Exception as e:
        print(f"检查数据失败: {e}")
        return False
    
    finally:
        engine.dispose()
    
    return True

if __name__ == "__main__":
    print("检查最新的数据...\n")
    check_latest_data()
    print("\n检查完成！")
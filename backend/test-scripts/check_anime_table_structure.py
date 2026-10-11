#!/usr/bin/env python3
"""
检查anime_watchlist表结构
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def check_table_structure():
    """检查表结构"""
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # 获取表结构
            result = conn.execute(text("DESCRIBE anime_watchlist"))
            columns = result.fetchall()
            
            print("anime_watchlist 表结构:")
            for column in columns:
                print(f"  {column[0]}: {column[1]} {'NOT NULL' if column[2] == 'NO' else 'NULL'} {column[3]}")
            
            # 检查是否有 cover_image_object_name 字段
            has_cover_object_name = any(col[0] == 'cover_image_object_name' for col in columns)
            if has_cover_object_name:
                print("\n✅ cover_image_object_name 字段已添加到表中")
            else:
                print("\n❌ cover_image_object_name 字段未找到")
    
    except Exception as e:
        print(f"检查表结构失败: {e}")
        return False
    
    finally:
        engine.dispose()
    
    return True

def check_existing_data():
    """检查现有数据"""
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # 获取现有数据
            result = conn.execute(text("SELECT id, title, cover_image_url, cover_image_object_name FROM anime_watchlist LIMIT 10"))
            rows = result.fetchall()
            
            print("\n现有数据 (前10条):")
            for row in rows:
                print(f"  ID: {row[0]}, 标题: {row[1]}, 封面URL: {row[2] or 'NULL'}, 封面对象名: {row[3] or 'NULL'}")
    
    except Exception as e:
        print(f"检查现有数据失败: {e}")
        return False
    
    finally:
        engine.dispose()
    
    return True

if __name__ == "__main__":
    print("检查 anime_watchlist 表结构和数据...")
    check_table_structure()
    check_existing_data()
    print("\n检查完成！")
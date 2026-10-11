#!/usr/bin/env python3

from app.core.database import engine
from sqlalchemy import text

def check_tables():
    try:
        with engine.connect() as conn:
            # 检查Alembic版本
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = [row[0] for row in result]
            print(f"当前Alembic版本: {version[0] if version else 'None'}")
            
            # 获取所有表
            result = conn.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result]
            print("\n数据库中的所有表:")
            for table in tables:
                print(f"- {table}")
                
            # 检查是否存在resource_links表
            if 'resource_links' in tables:
                print("\n✅ resource_links表已存在")
            else:
                print("\n❌ resource_links表不存在")
                
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    check_tables()
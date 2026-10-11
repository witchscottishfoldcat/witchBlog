#!/usr/bin/env python3
"""
创建项目展示相关数据库表
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.base import Base
from app.models.project_info import ProjectInfo, ProjectLanguage

def create_project_tables():
    """创建项目展示相关的数据库表"""
    
    # 创建数据库引擎
    engine = create_engine(settings.DATABASE_URL)
    
    print("正在创建项目展示相关数据库表...")
    
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    print("项目展示相关数据库表创建成功!")
    
    # 验证表是否创建成功
    with engine.connect() as connection:
        result1 = connection.execute(text("SHOW TABLES LIKE 'project_info'"))
        result2 = connection.execute(text("SHOW TABLES LIKE 'project_language'"))
        tables = [row[0] for row in result1] + [row[0] for row in result2]
        
        print(f"已创建的表: {', '.join(tables)}")
        
        if 'project_info' in tables and 'project_language' in tables:
            print("验证通过: 所有必要表已成功创建")
        else:
            print("警告: 某些表创建失败")
    
    return True

if __name__ == "__main__":
    try:
        create_project_tables()
        print("数据库表创建完成!")
    except Exception as e:
        print(f"创建数据库表失败: {e}")
        sys.exit(1)
#!/usr/bin/env python3

from app.core.database import engine
from sqlalchemy import text

def create_resource_links_table():
    # 手动创建resource_links表
    create_table_sql = '''
    CREATE TABLE IF NOT EXISTS resource_links (
        id INTEGER NOT NULL AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL COMMENT '资源标题',
        url VARCHAR(500) NOT NULL COMMENT '资源链接地址',
        description TEXT COMMENT '资源描述',
        tags VARCHAR(200) COMMENT '标签，多个标签用逗号分隔',
        category VARCHAR(50) NOT NULL DEFAULT 'other' COMMENT '资源分类',
        is_active BOOLEAN NOT NULL DEFAULT True COMMENT '是否启用',
        sort_order INTEGER NOT NULL DEFAULT 0 COMMENT '排序权重',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (id)
    ) COMMENT='资源链接表';
    '''

    try:
        with engine.connect() as conn:
            # 开始事务
            trans = conn.begin()
            try:
                # 执行创建表SQL
                conn.execute(text(create_table_sql))
                # 提交事务
                trans.commit()
                print('✅ resource_links表创建成功')
            except Exception as e:
                # 回滚事务
                trans.rollback()
                print(f'❌ 创建表失败: {e}')
                return False
    except Exception as e:
        print(f'❌ 数据库连接错误: {e}')
        return False
    
    return True

if __name__ == "__main__":
    success = create_resource_links_table()
    if success:
        print("\n现在可以重新运行check_db_tables.py验证表是否创建成功")
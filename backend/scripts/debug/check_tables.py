"""检查数据库中存在但模型中缺失的表结构"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, inspect

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
inspector = inspect(engine)

tables = ["request_logs", "about_files", "about_pages"]

for table_name in tables:
    if table_name in inspector.get_table_names():
        print(f"\n{'='*50}")
        print(f"表名: {table_name}")
        print("=" * 50)

        columns = inspector.get_columns(table_name)
        for col in columns:
            print(
                f"  {col['name']}: {col['type']} nullable={col['nullable']} default={col.get('default')}"
            )

        # 获取主键
        pk = inspector.get_pk_constraint(table_name)
        if pk["constrained_columns"]:
            print(f"  主键: {pk['constrained_columns']}")

        # 获取外键
        fks = inspector.get_foreign_keys(table_name)
        for fk in fks:
            print(
                f"  外键: {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}"
            )

        # 获取索引
        indexes = inspector.get_indexes(table_name)
        for idx in indexes:
            print(
                f"  索引: {idx['name']} columns={idx['column_names']} unique={idx['unique']}"
            )

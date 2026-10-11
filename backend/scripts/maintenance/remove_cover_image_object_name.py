#!/usr/bin/env python3
"""
删除anime_watchlist表中的cover_image_object_name字段
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text

from app.core.database import engine


def remove_cover_image_object_name():
    """删除cover_image_object_name字段"""
    print("开始删除anime_watchlist表中的cover_image_object_name字段...")

    try:
        # 执行SQL语句删除列
        with engine.connect() as conn:
            # 检查列是否存在
            check_column_sql = text(
                """
                SELECT COUNT(*) as count 
                FROM pragma_table_info('anime_watchlist') 
                WHERE name = 'cover_image_object_name'
            """
            )

            result = conn.execute(check_column_sql).fetchone()

            if result.count > 0:
                # 删除列
                delete_column_sql = text(
                    """
                    ALTER TABLE anime_watchlist 
                    DROP COLUMN cover_image_object_name
                """
                )

                conn.execute(delete_column_sql)
                conn.commit()

                print("✓ 成功删除cover_image_object_name字段")
            else:
                print("ℹ cover_image_object_name字段不存在，无需删除")

    except Exception as e:
        print(f"✗ 删除字段失败: {e}")
        return False

    return True


if __name__ == "__main__":
    remove_cover_image_object_name()

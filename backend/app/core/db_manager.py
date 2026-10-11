"""
数据库管理模块
负责检查和自动创建数据库表
"""

from typing import Any, Dict, List

from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from app.core.unified_logging import get_logger

logger = get_logger(__name__)


class DatabaseManager:
    """数据库管理器，负责检查和创建表"""

    def __init__(self, engine: Engine):
        self.engine = engine
        self.inspector = inspect(engine)

    def check_table_exists(self, table_name: str) -> bool:
        """检查表是否存在"""
        try:
            return table_name in self.inspector.get_table_names()
        except Exception as e:
            logger.error(f"检查表 {table_name} 是否存在时出错: {e}")
            return False

    def get_existing_tables(self) -> List[str]:
        """获取数据库中已存在的表列表"""
        try:
            return self.inspector.get_table_names()
        except Exception as e:
            logger.error(f"获取已存在的表列表时出错: {e}")
            return []

    def get_model_tables(self) -> Dict[str, Any]:
        """获取所有模型表的定义"""
        from app.models import Base

        tables: Dict[str, Any] = {
            table_name: table_cls
            for table_name, table_cls in Base.registry._class_registry.items()
            if hasattr(table_cls, "__tablename__") and not table_name.startswith("_")
        }
        return tables

    def create_missing_tables(self) -> Dict[str, bool]:
        """
        检查并创建缺失的表
        返回创建结果: {表名: 是否成功创建}
        """
        results = {}
        existing_tables = self.get_existing_tables()

        # 获取所有模型表的定义（与 get_model_tables 同一过滤逻辑）
        model_tables = self.get_model_tables()

        # 检查每个表是否存在
        for table_name, model_cls in model_tables.items():
            if table_name not in existing_tables:
                try:
                    logger.info(f"表 {table_name} 不存在，开始创建...")

                    # 创建表
                    model_cls.__table__.create(self.engine, checkfirst=True)

                    # 验证表是否创建成功
                    if self.check_table_exists(table_name):
                        results[table_name] = True
                        logger.info(f"表 {table_name} 创建成功")
                    else:
                        results[table_name] = False
                        logger.error(f"表 {table_name} 创建失败")

                except Exception as e:
                    results[table_name] = False
                    logger.error(f"创建表 {table_name} 时出错: {e}")
                    # 打印详细的错误信息，用于调试
                    import traceback

                    logger.error(f"详细错误信息: {traceback.format_exc()}")
            else:
                logger.debug(f"表 {table_name} 已存在")
                results[table_name] = True

        return results

    def ensure_all_tables_exist(self):
        """确保所有表都存在，如果不存在则创建"""
        logger.info("开始检查数据库表是否存在...")

        # 获取所有模型表的定义
        from app.models import Base

        model_table_names = set()

        # 遍历所有已注册的模型类
        for cls in Base.registry._class_registry.values():
            if hasattr(cls, "__tablename__"):
                model_table_names.add(cls.__tablename__)

        # 获取已存在的表
        existing_tables = set(self.get_existing_tables())

        # 找出缺失的表
        missing_tables = model_table_names - existing_tables

        if missing_tables:
            logger.warning(f"发现缺失的表: {', '.join(missing_tables)}")

            # 创建缺失的表
            results = self.create_missing_tables()

            # 统计创建结果
            success_count = sum(1 for success in results.values() if success)
            total_count = len(results)

            if success_count == total_count:
                logger.info(f"成功创建了所有 {total_count} 个缺失的表")
            else:
                failed_tables = [
                    table for table, success in results.items() if not success
                ]
                logger.error(f"创建表失败: {', '.join(failed_tables)}")
        else:
            logger.info("所有表都已存在，无需创建")

        return len(missing_tables) == 0


def ensure_database_tables(engine: Engine):
    """
    确保数据库表存在的便捷函数
    """
    db_manager = DatabaseManager(engine)
    return db_manager.ensure_all_tables_exist()

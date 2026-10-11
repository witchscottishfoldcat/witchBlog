from app.core.database import Base
from app.models.anime_watchlist import AnimeWatchlist

# 检查模型是否正确注册
print("检查模型元数据:")
for table_name, table in Base.metadata.tables.items():
    print(f"表名: {table_name}")

print("\n检查AnimeWatchlist模型:")
print(f"表名: {AnimeWatchlist.__tablename__}")
print(f"表对象: {AnimeWatchlist.__table__}")

# 测试创建表
from app.core.database import engine

print("\n尝试创建表:")
Base.metadata.create_all(bind=engine)
print("表创建完成")

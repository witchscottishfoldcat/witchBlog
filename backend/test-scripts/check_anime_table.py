from app.core.database import engine
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)
session = Session()

# 检查表是否存在
result = session.execute(text('SHOW TABLES LIKE "anime_watchlist"'))
print('anime_watchlist表存在:', [row for row in result])

# 检查表结构
result = session.execute(text('DESCRIBE anime_watchlist'))
print('anime_watchlist表结构:')
for row in result:
    print(row)

# 检查数据数量
result = session.execute(text('SELECT COUNT(*) as count FROM anime_watchlist'))
print('anime_watchlist数据量:', [row for row in result])

session.close()
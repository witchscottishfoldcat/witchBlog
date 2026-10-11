from app.core.database import engine
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)
session = Session()

# 检查表是否存在
result = session.execute(text('SHOW TABLES LIKE "resource_links"'))
print('resource_links表存在:', [row for row in result])

# 检查表结构
result = session.execute(text('DESCRIBE resource_links'))
print('resource_links表结构:')
for row in result:
    print(row)

session.close()
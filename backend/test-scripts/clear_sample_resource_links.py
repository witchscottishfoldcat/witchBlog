from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    db.execute(text('DELETE FROM resource_links WHERE title IN ("GitHub", "Gitee", "Bilibili", "Twitch", "Discord", "GitLab", "VS Code", "Stack Overflow", "MDN Web Docs", "YouTube")'))
    db.commit()
    print('已删除手动添加的资源链接数据')
except Exception as e:
    print(f'删除数据失败: {e}')
finally:
    db.close()
from app.core.database import SessionLocal
from app.services.resource_link import ResourceLinkService

# 创建数据库会话
db = SessionLocal()

# 创建服务实例
service = ResourceLinkService(db)

# 获取标签统计
tag_stats = service.get_tag_stats()

print("标签统计结果:")
print(tag_stats)

# 关闭会话
db.close()

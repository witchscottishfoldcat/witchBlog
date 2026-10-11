from app.core.database import engine
from app.models.resource_link import ResourceLink
from app.models.base import BaseModel

# 直接创建表
BaseModel.metadata.create_all(bind=engine)

print("resource_links 表创建完成")
#!/usr/bin/env python3
"""
检查导入
"""

import sys
sys.path.insert(0, '.')

# 检查模型导入
from app.models.timeline import Timeline
print(f"Timeline模型: {Timeline}")

# 检查服务模块中的导入
import app.services.timeline_service as ts_module
print(f"服务模块: {ts_module}")

# 检查服务模块中的Timeline
timeline_in_service = ts_module.Timeline
print(f"服务模块中的Timeline: {timeline_in_service}")
print(f"两个Timeline是否相同: {Timeline is timeline_in_service}")

# 检查服务模块中的TimelineService
TimelineService = ts_module.TimelineService
print(f"TimelineService类: {TimelineService}")

# 检查服务实例
timeline_service = ts_module.timeline_service
print(f"timeline_service实例: {timeline_service}")

# 尝试直接创建实例并测试
from app.core.database import SessionLocal
db = SessionLocal()
try:
    # 创建新实例
    service = TimelineService()
    print(f"新创建的服务实例: {service}")
    
    # 测试方法
    result = service.get_timelines(db, None, True, 0, 5)
    print(f"新实例查询结果: {result}")
    
finally:
    db.close()
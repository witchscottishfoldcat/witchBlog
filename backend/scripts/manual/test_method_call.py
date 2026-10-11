#!/usr/bin/env python3
"""
测试方法调用
"""

import sys

sys.path.insert(0, "..")

from app.core.database import SessionLocal
from app.services.timeline_service import TimelineService

db = SessionLocal()
try:
    service = TimelineService()

    # 尝试不同的调用方式

    # 1. 按位置传递参数
    print("1. 按位置传递参数:")
    result1 = service.get_timelines(db, 0, 5, None, True, None, None)
    print(f"结果: {result1}")

    # 2. 按关键字传递参数
    print("\n2. 按关键字传递参数:")
    result2 = service.get_timelines(
        db=db, skip=0, limit=5, user_id=None, is_public=True, search=None, tags=None
    )
    print(f"结果: {result2}")

    # 3. 混合方式
    print("\n3. 混合方式:")
    result3 = service.get_timelines(db, 0, 5, is_public=True)
    print(f"结果: {result3}")

finally:
    db.close()

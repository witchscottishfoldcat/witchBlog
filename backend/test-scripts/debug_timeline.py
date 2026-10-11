#!/usr/bin/env python3
"""
调试时间线服务
"""

import sys
sys.path.insert(0, '.')
from app.core.database import SessionLocal
from app.models.timeline import Timeline

class DebugTimelineService:
    def get_timelines(self, db, user_id=None, is_public=None, skip=0, limit=100, search=None, tags=None):
        print(f'DEBUG: get_timelines called with params: user_id={user_id}, is_public={is_public}')
        
        query = db.query(Timeline)
        print(f'DEBUG: initial query count: {query.count()}')
        
        # 按用户筛选
        if user_id is not None:
            query = query.filter(Timeline.user_id == user_id)
            print(f'DEBUG: filtered by user_id, count: {query.count()}')
        
        # 按公开状态筛选
        if is_public is not None:
            query = query.filter(Timeline.is_public == is_public)
            print(f'DEBUG: filtered by is_public={is_public}, count: {query.count()}')
            print(f'DEBUG: SQL query: {query}')
        
        # 获取总数
        total = query.count()
        print(f'DEBUG: total count: {total}')
        
        # 按开始时间降序排序，最新的在前
        timelines = query.order_by(Timeline.start_date.desc()).offset(skip).limit(limit).all()
        print(f'DEBUG: final result count: {len(timelines)}')
        
        return timelines, total

if __name__ == "__main__":
    db = SessionLocal()
    try:
        service = DebugTimelineService()
        result = service.get_timelines(db, None, True, 0, 5)
        print(f'DEBUG: final result: {result}')
    finally:
        db.close()
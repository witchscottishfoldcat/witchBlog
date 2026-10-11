#!/usr/bin/env python3
"""
检查服务代码
"""

import sys
sys.path.insert(0, '.')

# 直接复制服务类代码进行测试
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from app.core.database import SessionLocal
from app.models.timeline import Timeline
from app.schemas.timeline import TimelineCreate, TimelineUpdate
from app.core.exceptions import NotFoundException, BadRequestException
import logging

logger = logging.getLogger(__name__)

class TestTimelineService:
    """测试时间线服务类"""
    
    def get_timelines(
        self,
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Tuple[List[Timeline], int]:
        """获取时间线记录列表"""
        print(f"TestTimelineService.get_timelines called")
        
        query = db.query(Timeline)
        print(f"Initial query count: {query.count()}")
        
        # 按用户筛选
        if user_id is not None:
            query = query.filter(Timeline.user_id == user_id)
            print(f"Filtered by user_id, count: {query.count()}")
        
        # 按公开状态筛选
        if is_public is not None:
            query = query.filter(Timeline.is_public == is_public)
            print(f"Filtered by is_public={is_public}, count: {query.count()}")
        
        # 搜索
        if search:
            query = query.filter(
                or_(
                    Timeline.title.contains(search),
                    Timeline.subtitle.contains(search),
                    Timeline.description.contains(search),
                    Timeline.location.contains(search)
                )
            )
            print(f"Filtered by search, count: {query.count()}")
        
        # 按标签筛选
        if tags:
            for tag in tags:
                query = query.filter(Timeline.tags.contains([tag]))
            print(f"Filtered by tags, count: {query.count()}")
        
        # 获取总数
        total = query.count()
        print(f"Total count: {total}")
        
        # 按开始时间降序排序，最新的在前
        timelines = query.order_by(desc(Timeline.start_date)).offset(skip).limit(limit).all()
        print(f"Final result count: {len(timelines)}")
        
        return timelines, total

if __name__ == "__main__":
    db = SessionLocal()
    try:
        service = TestTimelineService()
        result = service.get_timelines(db, None, True, 0, 5)
        print(f"Test result: {result}")
    finally:
        db.close()
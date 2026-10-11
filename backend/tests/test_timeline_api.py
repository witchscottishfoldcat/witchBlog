#!/usr/bin/env python3
"""
测试时间线API
"""

import os
import sys

# 添加项目根目录到系统路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal  # noqa: E402
from app.services.timeline_service import timeline_service  # noqa: E402


def test_timeline_service():
    """测试时间线服务"""
    db = SessionLocal()
    try:
        print("测试获取时间线列表...")
        timelines, total = timeline_service.get_timelines(db, 0, 5, None, True)
        print(f"获取到 {len(timelines)} 条记录，总共 {total} 条")

        for timeline in timelines:
            print(
                f"- {timeline.title} ({timeline.start_date} 至 {timeline.end_date or '现在'})"  # noqa: E501
            )
            duration = timeline_service.get_duration_description(timeline)
            print(f"  持续时间: {duration}")
            print(f"  地点: {timeline.location}")
            print(f"  标签: {timeline.tags}")
            print()

        print("测试获取单个时间线记录...")
        if timelines:
            single_timeline = timeline_service.get_timeline(db, timelines[0].id, None)
            print(f"标题: {single_timeline.title}")
            print(f"描述: {single_timeline.description}")
            print(f"开始时间: {single_timeline.start_date}")
            print(f"结束时间: {single_timeline.end_date}")

        print("所有测试通过!")
        return True
    except Exception as e:
        print(f"测试失败: {str(e)}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    test_timeline_service()

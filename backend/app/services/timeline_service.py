import logging
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.timeline import Timeline
from app.models.user import User
from app.schemas.timeline import TimelineCreate, TimelineUpdate

logger = logging.getLogger(__name__)


class TimelineService:
    """时间线服务类，处理时间线相关业务逻辑"""

    def get_timeline(
        self, db: Session, timeline_id: int, user_id: Optional[int] = None
    ) -> Timeline:
        """获取单个时间线记录"""
        timeline = db.query(Timeline).filter(Timeline.id == timeline_id).first()
        if not timeline:
            raise NotFoundException(f"时间线记录 {timeline_id} 不存在")

        # 检查权限
        if user_id is not None:
            # 如果是记录所有者或超级用户，可以访问
            if timeline.user_id != user_id:
                # 如果记录是公开的，可以访问
                if not timeline.is_public:
                    raise NotFoundException(f"时间线记录 {timeline_id} 不存在或无权访问")
        else:
            # 未登录用户只能访问公开记录
            if not timeline.is_public:
                raise NotFoundException(f"时间线记录 {timeline_id} 不存在或无权访问")

        return timeline

    def get_timelines(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Tuple[List[Timeline], int]:
        """获取时间线记录列表"""
        query = db.query(Timeline)

        # 按用户筛选
        if user_id is not None:
            query = query.filter(Timeline.user_id == user_id)

        # 按公开状态筛选
        if is_public is not None:
            query = query.filter(Timeline.is_public == is_public)

        # 搜索
        if search:
            query = query.filter(
                or_(
                    Timeline.title.contains(search),
                    Timeline.subtitle.contains(search),
                    Timeline.description.contains(search),
                    Timeline.location.contains(search),
                )
            )

        # 按标签筛选
        if tags:
            for tag in tags:
                query = query.filter(Timeline.tags.contains([tag]))

        # 获取总数（在分页和排序之前）
        total = query.count()

        # 按开始时间降序排序，最新的在前
        timelines = (
            query.order_by(desc(Timeline.start_date)).offset(skip).limit(limit).all()
        )

        return timelines, total

    def create_timeline(
        self, db: Session, timeline_data: TimelineCreate, user_id: Optional[int] = None
    ) -> Timeline:
        """创建时间线记录"""
        try:
            # 检查日期逻辑：开始时间不能晚于结束时间
            if (
                timeline_data.end_date
                and timeline_data.start_date > timeline_data.end_date
            ):
                raise BadRequestException("开始时间不能晚于结束时间")

            # 创建数据库记录
            db_timeline = Timeline(
                title=timeline_data.title,
                subtitle=timeline_data.subtitle,
                description=timeline_data.description,
                start_date=timeline_data.start_date,
                end_date=timeline_data.end_date,
                location=timeline_data.location,
                tags=timeline_data.tags,
                skills=timeline_data.skills,
                is_public=timeline_data.is_public,
                user_id=user_id,
            )

            db.add(db_timeline)
            db.commit()
            db.refresh(db_timeline)

            logger.info(f"创建时间线记录成功: {db_timeline.id}, 标题: {db_timeline.title}")
            return db_timeline
        except Exception as e:
            db.rollback()
            logger.error(f"创建时间线记录失败: {str(e)}")
            raise e

    def update_timeline(
        self,
        db: Session,
        timeline_id: int,
        timeline_update: TimelineUpdate,
        user_id: int,
    ) -> Timeline:
        """更新时间线记录"""
        timeline = self.get_timeline(db, timeline_id, user_id)

        # 检查权限：只有超级用户或记录所有者可以更新
        user = db.query(User).filter(User.id == user_id).first()
        if not user or (not user.is_superuser and timeline.user_id != user_id):
            raise BadRequestException("无权更新此记录")

        update_data = timeline_update.dict(exclude_unset=True)

        # 检查日期逻辑：开始时间不能晚于结束时间
        start_date = update_data.get("start_date", timeline.start_date)
        end_date = update_data.get("end_date", timeline.end_date)

        if end_date and start_date > end_date:
            raise BadRequestException("开始时间不能晚于结束时间")

        # 更新字段
        for field, value in update_data.items():
            setattr(timeline, field, value)

        db.commit()
        db.refresh(timeline)

        logger.info(f"更新时间线记录成功: {timeline.id}, 标题: {timeline.title}")
        return timeline

    def delete_timeline(self, db: Session, timeline_id: int, user_id: int) -> bool:
        """删除时间线记录"""
        timeline = self.get_timeline(db, timeline_id, user_id)

        # 检查权限：只有超级用户或记录所有者可以删除
        user = db.query(User).filter(User.id == user_id).first()
        if not user or (not user.is_superuser and timeline.user_id != user_id):
            raise BadRequestException("无权删除此记录")

        # 从数据库删除记录
        db.delete(timeline)
        db.commit()

        logger.info(f"删除时间线记录成功: {timeline_id}, 标题: {timeline.title}")
        return True

    def count_timelines(
        self,
        db: Session,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
    ) -> int:
        """统计时间线记录数量"""
        query = db.query(Timeline)

        if user_id is not None:
            query = query.filter(Timeline.user_id == user_id)

        if is_public is not None:
            query = query.filter(Timeline.is_public == is_public)

        return query.count()

    def get_duration_description(self, timeline: Timeline) -> Optional[str]:
        """计算持续时间描述"""
        if not timeline.end_date:
            end_date = datetime.now()
        else:
            end_date = timeline.end_date

        start_date = timeline.start_date
        delta = end_date - start_date

        # 计算天数差
        days = delta.days

        if days < 30:
            return f"{days} 天"
        elif days < 365:
            months = days // 30
            remaining_days = days % 30
            if remaining_days > 0:
                return f"{months} 个月 {remaining_days} 天"
            else:
                return f"{months} 个月"
        else:
            years = days // 365
            remaining_days = days % 365
            if remaining_days >= 30:
                months = remaining_days // 30
                remaining_days = remaining_days % 30
                if remaining_days > 0:
                    return f"{years} 年 {months} 个月 {remaining_days} 天"
                else:
                    return f"{years} 年 {months} 个月"
            elif remaining_days > 0:
                return f"{years} 年 {remaining_days} 天"
            else:
                return f"{years} 年"


# 创建时间线服务实例
timeline_service = TimelineService()

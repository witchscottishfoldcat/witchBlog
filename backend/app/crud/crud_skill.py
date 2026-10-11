from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.project_info import ProjectInfo, ProjectLanguage
from app.models.skill import Skill, SkillCategory, SkillLevel
from app.models.skill_period import SkillPeriod
from app.schemas.skill import (
    SkillCreate,
    SkillPeriodCreate,
    SkillPeriodUpdate,
    SkillUpdate,
)


class CRUDSkill:
    """技能CRUD操作类"""

    def get(self, db: Session, id: int) -> Optional[Skill]:
        """获取单个技能"""
        return db.query(Skill).filter(Skill.id == id).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
    ) -> List[Skill]:
        """获取技能列表"""
        query = db.query(Skill)
        if category:
            query = query.filter(Skill.category == category)
        return query.offset(skip).limit(limit).all()

    def get_by_name(self, db: Session, name: str) -> Optional[Skill]:
        """根据名称获取技能"""
        return db.query(Skill).filter(Skill.name == name).first()

    def create(self, db: Session, *, obj_in: SkillCreate) -> Skill:
        """创建技能"""
        db_obj = Skill(
            name=obj_in.name,
            category=SkillCategory(obj_in.category),
            description=obj_in.description,
            current_level=SkillLevel.BEGINNER,  # 新技能默认为入门
            total_learning_days=0,  # 新技能默认学习天数为0
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Skill, obj_in: SkillUpdate) -> Skill:
        """更新技能"""
        update_data = obj_in.dict(exclude_unset=True)

        # 处理类别和等级的特殊情况
        if "category" in update_data:
            update_data["category"] = SkillCategory(update_data["category"])

        if "current_level" in update_data:
            update_data["current_level"] = SkillLevel(update_data["current_level"])

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> Skill:
        """删除技能"""
        obj = db.query(Skill).get(id)
        if obj is None:
            from app.core.exceptions import NotFoundException

            raise NotFoundException("技能不存在")
        db.delete(obj)
        db.commit()
        return obj

    def get_stats(self, db: Session) -> Dict[str, Any]:
        """技能统计：总数、按类别/等级分组、总学习天数"""
        from sqlalchemy import func

        total_skills = db.query(Skill).count()

        skills_by_category = {}
        for category in SkillCategory:
            count = db.query(Skill).filter(Skill.category == category).count()
            skills_by_category[category.value] = count

        skills_by_level = {}
        for level in SkillLevel:
            count = db.query(Skill).filter(Skill.current_level == level).count()
            skills_by_level[level.value] = count

        total_learning_days = (
            db.query(func.sum(Skill.total_learning_days)).scalar() or 0
        )

        return {
            "total_skills": total_skills,
            "skills_by_category": skills_by_category,
            "skills_by_level": skills_by_level,
            "total_learning_days": total_learning_days,
        }

    def calculate_total_days(self, db: Session, skill_id: int) -> int:
        """计算技能总学习天数"""
        periods = db.query(SkillPeriod).filter(SkillPeriod.skill_id == skill_id).all()
        total_days = 0

        for period in periods:
            end_date = period.end_date if period.end_date else datetime.utcnow()
            delta = end_date - period.start_date
            total_days += delta.days + 1  # 包含开始和结束日期

        # 更新技能的总学习天数
        skill = self.get(db, skill_id)
        if skill:
            skill.total_learning_days = total_days
            db.commit()

        return total_days

    def calculate_skill_level(self, total_days: int) -> SkillLevel:
        """根据学习天数计算技能等级"""
        if total_days < 30:
            return SkillLevel.BEGINNER
        elif total_days < 90:
            return SkillLevel.JUNIOR
        elif total_days < 365:
            return SkillLevel.INTERMEDIATE
        else:
            return SkillLevel.SENIOR

    def update_skill_level(self, db: Session, skill_id: int) -> SkillLevel:
        """更新技能等级"""
        total_days = self.calculate_total_days(db, skill_id)
        new_level = self.calculate_skill_level(total_days)

        # 更新技能等级
        skill = self.get(db, skill_id)
        if skill and skill.current_level != new_level:
            skill.current_level = new_level
            db.commit()

        return new_level

    def get_related_projects(self, db: Session, skill_id: int) -> List[ProjectInfo]:
        """获取与技能相关的项目

        基于技能名称与项目语言的匹配关系
        """
        skill = self.get(db, skill_id)
        if not skill:
            return []

        # 通过技能名称匹配项目语言
        # 支持精确匹配和包含匹配
        skill_name = skill.name.lower()

        # 精确匹配项目语言
        exact_match_projects = (
            db.query(ProjectInfo)
            .join(ProjectLanguage)
            .filter(ProjectLanguage.language.ilike(skill_name))
            .all()
        )

        # 包含匹配，检查技能名称是否包含在语言名称中
        # 例如技能名为"Java"，可以匹配"JavaScript", "Java"等
        contains_match_projects = (
            db.query(ProjectInfo)
            .join(ProjectLanguage)
            .filter(
                or_(
                    ProjectLanguage.language.ilike(f"%{skill_name}%"),
                    ProjectLanguage.language.ilike(f"%{skill.name}%"),
                )
            )
            .all()
        )

        # 合并结果，去重
        all_projects = exact_match_projects + contains_match_projects
        unique_projects = []
        project_ids = set()

        for project in all_projects:
            if project.id not in project_ids:
                project_ids.add(project.id)
                unique_projects.append(project)

        return unique_projects

    def get_with_projects(self, db: Session, skill_id: int) -> Optional[Dict[str, Any]]:
        """获取技能及其相关项目"""
        skill = self.get(db, skill_id)
        if not skill:
            return None

        related_projects = self.get_related_projects(db, skill_id)

        return {
            **skill.__dict__,
            "related_projects": [self._project_to_dict(p) for p in related_projects],
            "project_count": len(related_projects),
        }

    def _project_to_dict(self, project: ProjectInfo) -> Dict[str, Any]:
        """将项目对象转换为字典"""
        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "url": project.url,
            "platform": project.platform,
            "tag": project.tag,
            "avatar_url": project.avatar_url,
            "stars_count": project.stars_count,
            "forks_count": project.forks_count,
            "language_stats": project.language_stats,
        }


class CRUDSkillPeriod:
    """技能学习时间段CRUD操作类"""

    def get(self, db: Session, id: int) -> Optional[SkillPeriod]:
        """获取单个学习时间段"""
        return db.query(SkillPeriod).filter(SkillPeriod.id == id).first()

    def get_multi_by_skill(
        self, db: Session, *, skill_id: int, skip: int = 0, limit: int = 100
    ) -> List[SkillPeriod]:
        """获取指定技能的所有学习时间段"""
        return (
            db.query(SkillPeriod)
            .filter(SkillPeriod.skill_id == skill_id)
            .order_by(SkillPeriod.start_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(
        self, db: Session, *, obj_in: SkillPeriodCreate, skill_id: int
    ) -> SkillPeriod:
        """创建学习时间段"""
        db_obj = SkillPeriod(
            skill_id=skill_id,
            start_date=obj_in.start_date,
            end_date=obj_in.end_date,
            notes=obj_in.notes,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # 更新技能的总学习天数和等级
        skill_crud = CRUDSkill()
        skill_crud.update_skill_level(db, skill_id)

        return db_obj

    def update(
        self, db: Session, *, db_obj: SkillPeriod, obj_in: SkillPeriodUpdate
    ) -> SkillPeriod:
        """更新学习时间段"""
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # 更新技能的总学习天数和等级
        skill_crud = CRUDSkill()
        skill_crud.update_skill_level(db, db_obj.skill_id)

        return db_obj

    def remove(self, db: Session, *, id: int) -> SkillPeriod:
        """删除学习时间段"""
        obj = db.query(SkillPeriod).get(id)
        if obj is None:
            from app.core.exceptions import NotFoundException

            raise NotFoundException("学习时间段不存在")
        skill_id = obj.skill_id
        db.delete(obj)
        db.commit()

        # 更新技能的总学习天数和等级
        skill_crud = CRUDSkill()
        skill_crud.update_skill_level(db, skill_id)

        return obj

    def add_current_period(
        self,
        db: Session,
        *,
        skill_id: int,
        start_date: datetime,
        notes: Optional[str] = None,
    ) -> SkillPeriod:
        """添加从指定日期到当前时间的学习时间段"""
        return self.create(
            db,
            obj_in=SkillPeriodCreate(
                start_date=start_date, end_date=datetime.utcnow(), notes=notes
            ),
            skill_id=skill_id,
        )


# 创建CRUD实例
skill = CRUDSkill()
skill_period = CRUDSkillPeriod()

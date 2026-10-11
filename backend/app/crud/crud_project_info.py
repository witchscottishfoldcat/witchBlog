from typing import Any, Dict, List, Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.unified_logging import get_logger
from app.models.project_info import ProjectInfo, ProjectLanguage

logger = get_logger(__name__)


class CRUDProjectInfo:
    """项目信息CRUD操作"""

    def get(self, db: Session, id: int) -> Optional[ProjectInfo]:
        """根据ID获取项目信息"""
        return db.query(ProjectInfo).filter(ProjectInfo.id == id).first()

    def get_by_url(self, db: Session, url: str) -> Optional[ProjectInfo]:
        """根据URL获取项目信息"""
        return db.query(ProjectInfo).filter(ProjectInfo.url == url).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        platform: Optional[str] = None,
        tag: Optional[str] = None,
        language: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ProjectInfo]:
        """获取多个项目信息，支持筛选"""
        query = db.query(ProjectInfo)

        if platform:
            query = query.filter(ProjectInfo.platform == platform)

        if tag:
            query = query.filter(ProjectInfo.tag == tag)

        if language:
            # 通过语言筛选项目
            query = query.join(ProjectLanguage).filter(
                ProjectLanguage.language.ilike(f"%{language}%")
            )

        if search:
            # 搜索项目名称、描述或所有者
            query = query.filter(
                or_(
                    ProjectInfo.name.ilike(f"%{search}%"),
                    ProjectInfo.description.ilike(f"%{search}%"),
                    ProjectInfo.owner.ilike(f"%{search}%"),
                )
            )

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: Dict[str, Any]) -> ProjectInfo:
        """创建新项目记录"""
        # 提取语言信息
        languages = obj_in.pop("languages", [])

        # 创建项目基本信息
        db_obj = ProjectInfo(**obj_in)
        db.add(db_obj)
        db.flush()  # 获取项目ID

        # 创建语言统计记录
        for lang_data in languages:
            lang_obj = ProjectLanguage(
                project_id=db_obj.id,
                language=lang_data.get("language"),
                percentage=lang_data.get("percentage", 0.0),
                bytes_count=lang_data.get("bytes_count", 0),
            )
            db.add(lang_obj)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: ProjectInfo, obj_in: Dict[str, Any]
    ) -> ProjectInfo:
        """更新项目信息"""
        # 提取语言信息
        languages = obj_in.pop("languages", None)

        # 更新项目基本信息
        for field in obj_in:
            if hasattr(db_obj, field):
                setattr(db_obj, field, obj_in[field])

        # 如果提供了新的语言信息，更新语言统计
        if languages is not None:
            # 删除旧的语言记录
            db.query(ProjectLanguage).filter(
                ProjectLanguage.project_id == db_obj.id
            ).delete()

            # 创建新的语言记录
            for lang_data in languages:
                lang_obj = ProjectLanguage(
                    project_id=db_obj.id,
                    language=lang_data.get("language"),
                    percentage=lang_data.get("percentage", 0.0),
                    bytes_count=lang_data.get("bytes_count", 0),
                )
                db.add(lang_obj)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> ProjectInfo:
        """删除项目"""
        obj = db.query(ProjectInfo).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def count(
        self, db: Session, platform: Optional[str] = None, tag: Optional[str] = None
    ) -> int:
        """统计项目数量"""
        query = db.query(ProjectInfo)

        if platform:
            query = query.filter(ProjectInfo.platform == platform)

        if tag:
            query = query.filter(ProjectInfo.tag == tag)

        return query.count()

    def get_platform_stats(self, db: Session) -> List[Dict]:
        """获取各平台项目数量统计"""
        from sqlalchemy import func

        result = (
            db.query(ProjectInfo.platform, func.count(ProjectInfo.id).label("count"))
            .group_by(ProjectInfo.platform)
            .all()
        )

        return [{"platform": platform, "count": count} for platform, count in result]

    def get_tag_stats(self, db: Session) -> List[Dict]:
        """获取各标签项目数量统计"""
        from sqlalchemy import func

        result = (
            db.query(ProjectInfo.tag, func.count(ProjectInfo.id).label("count"))
            .group_by(ProjectInfo.tag)
            .all()
        )

        return [{"tag": tag, "count": count} for tag, count in result]

    def get_language_stats(self, db: Session, limit: int = 10) -> List[Dict]:
        """获取使用最多的编程语言统计"""
        from sqlalchemy import func

        result = (
            db.query(
                ProjectLanguage.language,
                func.sum(ProjectLanguage.percentage).label("total_percentage"),
                func.count(ProjectLanguage.language).label("project_count"),
            )
            .group_by(ProjectLanguage.language)
            .order_by(func.sum(ProjectLanguage.percentage).desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "language": language,
                "total_percentage": round(total_percentage, 2),
                "project_count": project_count,
            }
            for language, total_percentage, project_count in result
        ]


class CRUDProjectLanguage:
    """项目语言统计CRUD操作"""

    def get_by_project_id(
        self, db: Session, *, project_id: int
    ) -> List[ProjectLanguage]:
        """获取指定项目的所有语言统计"""
        return (
            db.query(ProjectLanguage)
            .filter(ProjectLanguage.project_id == project_id)
            .all()
        )

    def get_language_projects(
        self, db: Session, *, language: str, skip: int = 0, limit: int = 100
    ) -> List[ProjectInfo]:
        """获取使用指定语言的所有项目"""
        return (
            db.query(ProjectInfo)
            .join(ProjectLanguage)
            .filter(
                and_(
                    ProjectLanguage.language.ilike(f"%{language}%"),
                    ProjectLanguage.project_id == ProjectInfo.id,
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )


# 创建CRUD实例
crud_project_info = CRUDProjectInfo()
crud_project_language = CRUDProjectLanguage()

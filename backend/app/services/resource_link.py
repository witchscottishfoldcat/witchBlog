import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.resource_link import ResourceLink
from app.schemas.resource_link import ResourceLinkCreate, ResourceLinkUpdate

logger = logging.getLogger(__name__)


class ResourceLinkService:
    """资源链接服务类"""

    def __init__(self, db: Session):
        """初始化服务"""
        self.db = db

    def get_resource_link(self, link_id: int) -> Optional[ResourceLink]:
        """获取单个资源链接"""
        return self.db.query(ResourceLink).filter(ResourceLink.id == link_id).first()

    def get_resource_links(
        self,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> List[ResourceLink]:
        """获取资源链接列表"""
        query = self.db.query(ResourceLink)

        # 按分类筛选
        if category is not None:
            query = query.filter(ResourceLink.category == category)

        # 按状态筛选
        if is_active is not None:
            query = query.filter(ResourceLink.is_active == is_active)

        # 按标签筛选
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            # 使用LIKE操作符匹配包含任一标签的记录
            tag_conditions = []
            for tag in tag_list:
                tag_conditions.append(ResourceLink.tags.like(f"%{tag}%"))
            if tag_conditions:
                query = query.filter(or_(*tag_conditions))

        # 排序
        if sort_by == "sort_order":
            query = query.order_by(
                desc(ResourceLink.sort_order), desc(ResourceLink.created_at)
            )
        elif sort_by == "created_at":
            query = query.order_by(desc(ResourceLink.created_at))
        elif sort_by == "title":
            query = query.order_by(ResourceLink.title)
        else:
            query = query.order_by(
                desc(ResourceLink.sort_order), desc(ResourceLink.created_at)
            )

        # 分页
        return query.offset(skip).limit(limit).all()

    def count_resource_links(
        self,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """统计资源链接数量"""
        query = self.db.query(func.count(ResourceLink.id))

        # 按分类筛选
        if category is not None:
            query = query.filter(ResourceLink.category == category)

        # 按状态筛选
        if is_active is not None:
            query = query.filter(ResourceLink.is_active == is_active)

        # 按标签筛选
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            # 使用LIKE操作符匹配包含任一标签的记录
            tag_conditions = []
            for tag in tag_list:
                tag_conditions.append(ResourceLink.tags.like(f"%{tag}%"))
            if tag_conditions:
                query = query.filter(or_(*tag_conditions))

        return query.scalar() or 0

    def get_resource_links_paginated(
        self,
        page: int = 1,
        size: int = 20,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> Tuple[List[ResourceLink], int]:
        """分页获取资源链接列表"""
        skip = (page - 1) * size
        links = self.get_resource_links(
            skip=skip,
            limit=size,
            category=category,
            tags=tags,
            is_active=is_active,
            sort_by=sort_by,
        )
        total = self.count_resource_links(
            category=category, tags=tags, is_active=is_active
        )
        return links, total

    def create_resource_link(self, link: ResourceLinkCreate) -> ResourceLink:
        """创建资源链接"""
        try:
            db_link = ResourceLink(**link.dict())
            self.db.add(db_link)
            self.db.commit()
            self.db.refresh(db_link)

            logger.info(f"创建资源链接成功: {db_link.title}")
            return db_link
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建资源链接失败: {e}")
            raise e

    def update_resource_link(
        self, link_id: int, link_update: ResourceLinkUpdate
    ) -> ResourceLink:
        """更新资源链接"""
        db_link = self.get_resource_link(link_id)
        if not db_link:
            raise NotFoundException(f"资源链接 {link_id} 不存在")

        try:
            update_data = link_update.dict(exclude_unset=True)

            for field, value in update_data.items():
                setattr(db_link, field, value)

            self.db.commit()
            self.db.refresh(db_link)

            logger.info(f"更新资源链接成功: {db_link.title}")
            return db_link
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新资源链接失败: {e}")
            raise e

    def delete_resource_link(self, link_id: int) -> bool:
        """删除资源链接"""
        db_link = self.get_resource_link(link_id)
        if not db_link:
            raise NotFoundException(f"资源链接 {link_id} 不存在")

        try:
            self.db.delete(db_link)
            self.db.commit()

            logger.info(f"删除资源链接成功: {db_link.title}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除资源链接失败: {e}")
            return False

    def get_category_stats(self, is_active: Optional[bool] = None) -> List[Any]:
        """获取资源链接分类统计"""
        query = self.db.query(
            ResourceLink.category, func.count(ResourceLink.id).label("count")
        )

        if is_active is not None:
            query = query.filter(ResourceLink.is_active == is_active)

        return query.group_by(ResourceLink.category).all()

    def get_tag_stats(self, is_active: Optional[bool] = None) -> List[Any]:
        """获取资源链接标签统计"""
        # 使用 Python 处理标签统计，避免 SQL 复杂性和字符集问题
        try:
            # 获取所有记录
            query = self.db.query(ResourceLink)
            if is_active is not None:
                query = query.filter(ResourceLink.is_active == is_active)

            links = query.all()

            # 收集所有标签
            tag_counts: Dict[str, int] = {}
            for link in links:
                if link.tags and link.tags.strip():
                    # 分割标签
                    tags = [tag.strip() for tag in link.tags.split(",")]
                    for tag in tags:
                        if tag:  # 忽略空标签
                            tag_counts[tag] = tag_counts.get(tag, 0) + 1

            # 转换为字典列表并按计数降序、标签升序排序
            result = [
                {"tag": tag, "count": count}
                for tag, count in sorted(
                    tag_counts.items(), key=lambda x: (-x[1], x[0])
                )
            ]

            return result
        except Exception as e:
            logger.error(f"获取标签统计失败: {e}")
            return []


# 创建服务实例
def create_resource_link_service(db: Session):
    """创建资源链接服务实例"""
    return ResourceLinkService(db)

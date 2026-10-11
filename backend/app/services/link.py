import logging
from typing import BinaryIO, List, Optional, Tuple

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from app.models.link import Link as LinkModel
from app.schemas.link import LinkCategoryStats, LinkCreate, LinkUpdate
from app.services.minio_service import minio_service as _minio_singleton
from app.services.minio_service import to_proxy_url

logger = logging.getLogger(__name__)


def _rewrite_link_image_url(link: Optional[LinkModel]) -> Optional[LinkModel]:
    """
    将链接的 OSS 直链改写为代理 URL（DB 数据保持不变，仅改返回值）。
    外部链接（image_type=external）原样返回。
    """
    if link is None:
        return None
    # 仅当标记为 minio 图片或属于 OSS 直链时改写；外部链接保持原样
    if link.image_url and getattr(link, "image_type", None) != "external":
        link.image_url = to_proxy_url(link.image_url)
    return link


class LinkService:
    """链接服务类"""

    def __init__(self, db: Session):
        self.db = db
        self.minio_service = _minio_singleton

    def get_link(self, link_id: int) -> Optional[LinkModel]:
        """获取单个链接"""
        return self.db.query(LinkModel).filter(LinkModel.id == link_id).first()

    def get_links(
        self,
        category: Optional[str] = None,
        is_active: Optional[bool] = True,
        tags: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "sort_order",
    ) -> List[LinkModel]:
        """获取链接列表"""
        query = self.db.query(LinkModel)

        # 添加过滤条件
        if is_active is not None:
            query = query.filter(LinkModel.is_active == is_active)

        if category:
            query = query.filter(LinkModel.category == category)

        if tags:
            # 支持多个标签搜索
            tag_list = [tag.strip() for tag in tags.split(",")]
            conditions = [LinkModel.tags.like(f"%{tag}%") for tag in tag_list]
            query = query.filter(or_(*conditions))

        # 排序
        if sort_by == "sort_order":
            query = query.order_by(desc(LinkModel.sort_order), LinkModel.id)
        elif sort_by == "created_at":
            query = query.order_by(desc(LinkModel.created_at))
        elif sort_by == "name":
            query = query.order_by(LinkModel.name)

        return query.offset(skip).limit(limit).all()

    def count_links(
        self,
        category: Optional[str] = None,
        is_active: Optional[bool] = True,
        tags: Optional[str] = None,
    ) -> int:
        """统计链接数量"""
        query = self.db.query(LinkModel)

        # 添加过滤条件
        if is_active is not None:
            query = query.filter(LinkModel.is_active == is_active)

        if category:
            query = query.filter(LinkModel.category == category)

        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            conditions = [LinkModel.tags.like(f"%{tag}%") for tag in tag_list]
            query = query.filter(or_(*conditions))

        return query.count()

    def get_links_by_tags(self, tags: List[str]) -> List[LinkModel]:
        """根据标签获取链接"""
        if not tags:
            return []

        conditions = [LinkModel.tags.like(f"%{tag}%") for tag in tags]
        return (
            self.db.query(LinkModel)
            .filter(and_(LinkModel.is_active.is_(True), or_(*conditions)))
            .order_by(desc(LinkModel.sort_order))
            .all()
        )

    def get_category_stats(self) -> List[LinkCategoryStats]:
        """获取各分类链接统计"""
        result = (
            self.db.query(LinkModel.category, func.count(LinkModel.id).label("count"))
            .filter(LinkModel.is_active.is_(True))
            .group_by(LinkModel.category)
            .all()
        )

        return [
            LinkCategoryStats(category=row.category, count=row.count) for row in result
        ]

    def create_link(self, link: LinkCreate) -> LinkModel:
        """创建链接"""
        db_link = LinkModel(
            name=link.name,
            url=link.url,
            description=link.description,
            image_url=link.image_url,
            tags=link.tags,
            category=link.category,
            is_active=link.is_active,
            sort_order=link.sort_order,
        )
        self.db.add(db_link)
        self.db.commit()
        self.db.refresh(db_link)
        return db_link

    def update_link(self, link_id: int, link: LinkUpdate) -> Optional[LinkModel]:
        """更新链接"""
        db_link = self.get_link(link_id)
        if not db_link:
            return None

        update_data = link.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_link, field, value)

        self.db.commit()
        self.db.refresh(db_link)
        return db_link

    def delete_link(self, link_id: int) -> bool:
        """删除链接"""
        db_link = self.get_link(link_id)
        if not db_link:
            return False

        self.db.delete(db_link)
        self.db.commit()
        return True

    def get_all_tags(self) -> List[str]:
        """获取所有标签"""
        links = self.db.query(LinkModel).filter(LinkModel.tags.isnot(None)).all()
        all_tags = set()

        for link in links:
            if link.tags:
                tags = [tag.strip() for tag in link.tags.split(",")]
                all_tags.update(tags)

        return sorted(list(all_tags))

    def get_random_links(
        self, category: Optional[str] = None, limit: int = 5
    ) -> List[LinkModel]:
        """随机获取链接"""
        query = self.db.query(LinkModel).filter(LinkModel.is_active.is_(True))

        if category:
            query = query.filter(LinkModel.category == category)

        return query.order_by(func.random()).limit(limit).all()

    def upload_link_image(
        self, file_data: BinaryIO, file_name: str, content_type: str
    ) -> Tuple[str, str]:
        """
        上传链接图片到MinIO

        Args:
            file_data: 文件数据
            file_name: 原始文件名
            content_type: 文件MIME类型

        Returns:
            Tuple[object_name, public_url]: 对象名称和公开访问URL
        """
        try:
            return self.minio_service.upload_link_image(
                file_data, file_name, content_type
            )
        except Exception as e:
            logger.error(f"上传链接图片失败: {str(e)}")
            raise

    def delete_link_image(self, image_url: str, image_type: str) -> bool:
        """
        删除链接图片

        Args:
            image_url: 图片URL或对象名称
            image_type: 图片类型（external或minio）

        Returns:
            bool: 删除是否成功
        """
        # 如果是外部链接，不需要删除
        if image_type == "external":
            return True

        # 如果是MinIO存储，提取对象名称并删除
        if image_type == "minio" and image_url:
            # 从完整URL中提取对象名称
            # 格式: http://endpoint/bucket/object_name
            parts = image_url.split("/")
            if len(parts) >= 4:
                object_name = "/".join(parts[3:])  # 从第4部分开始是对象名称
                return self.minio_service.delete_link_image(object_name)

        return False

    def update_link_with_image(
        self,
        link_id: int,
        image_data: BinaryIO,
        image_name: str,
        content_type: str,
        link_update: LinkUpdate,
    ) -> Optional[LinkModel]:
        """
        更新链接并上传新图片

        Args:
            link_id: 链接ID
            image_data: 图片文件数据
            image_name: 图片文件名
            content_type: 文件MIME类型
            link_update: 链接更新数据

        Returns:
            更新后的链接模型
        """
        # 获取现有链接
        db_link = self.get_link(link_id)
        if not db_link:
            return None

        # 删除旧图片（如果是MinIO存储）
        if db_link.image_url and db_link.image_type == "minio":
            self.delete_link_image(db_link.image_url, db_link.image_type)

        # 上传新图片
        object_name, public_url = self.upload_link_image(
            image_data, image_name, content_type
        )

        # 更新链接信息
        link_update.image_url = public_url
        link_update.image_type = "minio"

        return self.update_link(link_id, link_update)

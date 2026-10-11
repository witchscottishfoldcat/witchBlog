import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.anime_watchlist import AnimeWatchlist
from app.schemas.anime_watchlist import AnimeWatchlistCreate, AnimeWatchlistUpdate
from app.services.minio_service import minio_service as _minio_singleton

logger = logging.getLogger(__name__)


class AnimeWatchlistService:
    """追番追剧服务类"""

    def __init__(self, db: Session):
        """初始化服务"""
        self.db = db
        self.minio_service = _minio_singleton

    def get_anime_watchlist(self, item_id: int) -> Optional[AnimeWatchlist]:
        """获取单个追番追剧项目"""
        return (
            self.db.query(AnimeWatchlist).filter(AnimeWatchlist.id == item_id).first()
        )

    def get_anime_watchlist_items(
        self,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        status: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> List[AnimeWatchlist]:
        """获取追番追剧列表"""
        try:
            query = self.db.query(AnimeWatchlist)

            # 按分类筛选
            if category is not None:
                query = query.filter(AnimeWatchlist.category == category)

            # 按状态筛选
            if status is not None:
                query = query.filter(AnimeWatchlist.status == status)

            # 按收藏筛选
            if is_favorite is not None:
                query = query.filter(AnimeWatchlist.is_favorite == is_favorite)

            # 按启用状态筛选
            if is_active is not None:
                query = query.filter(AnimeWatchlist.is_active == is_active)

            # 按标签筛选
            if tags:
                tag_list = [tag.strip() for tag in tags.split(",")]
                # 使用LIKE操作符匹配包含任一标签的记录
                tag_conditions = []
                for tag in tag_list:
                    tag_conditions.append(AnimeWatchlist.tags.like(f"%{tag}%"))
                if tag_conditions:
                    query = query.filter(or_(*tag_conditions))

            # 排序
            if sort_by == "sort_order":
                query = query.order_by(
                    desc(AnimeWatchlist.sort_order), desc(AnimeWatchlist.created_at)
                )
            elif sort_by == "created_at":
                query = query.order_by(desc(AnimeWatchlist.created_at))
            elif sort_by == "title":
                query = query.order_by(AnimeWatchlist.title)
            elif sort_by == "progress":
                query = query.order_by(
                    desc(AnimeWatchlist.progress), AnimeWatchlist.title
                )
            elif sort_by == "rating":
                query = query.order_by(
                    desc(AnimeWatchlist.rating), AnimeWatchlist.title
                )
            else:
                query = query.order_by(
                    desc(AnimeWatchlist.sort_order), desc(AnimeWatchlist.created_at)
                )

            # 分页
            return query.offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"获取追番追剧列表失败: {e}")
            raise e

    def count_anime_watchlist_items(
        self,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        status: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """统计追番追剧数量"""
        query = self.db.query(func.count(AnimeWatchlist.id))

        # 按分类筛选
        if category is not None:
            query = query.filter(AnimeWatchlist.category == category)

        # 按状态筛选
        if status is not None:
            query = query.filter(AnimeWatchlist.status == status)

        # 按收藏筛选
        if is_favorite is not None:
            query = query.filter(AnimeWatchlist.is_favorite == is_favorite)

        # 按启用状态筛选
        if is_active is not None:
            query = query.filter(AnimeWatchlist.is_active == is_active)

        # 按标签筛选
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            # 使用LIKE操作符匹配包含任一标签的记录
            tag_conditions = []
            for tag in tag_list:
                tag_conditions.append(AnimeWatchlist.tags.like(f"%{tag}%"))
            if tag_conditions:
                query = query.filter(or_(*tag_conditions))

        return query.scalar() or 0

    def get_anime_watchlist_paginated(
        self,
        page: int = 1,
        size: int = 20,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        status: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> Tuple[List[AnimeWatchlist], int]:
        """分页获取追番追剧列表"""
        skip = (page - 1) * size
        items = self.get_anime_watchlist_items(
            skip=skip,
            limit=size,
            category=category,
            tags=tags,
            status=status,
            is_favorite=is_favorite,
            is_active=is_active,
            sort_by=sort_by,
        )
        total = self.count_anime_watchlist_items(
            category=category,
            tags=tags,
            status=status,
            is_favorite=is_favorite,
            is_active=is_active,
        )
        return items, total

    def create_anime_watchlist(self, item: AnimeWatchlistCreate) -> AnimeWatchlist:
        """创建追番追剧项目"""
        try:
            # 将Pydantic模型转换为字典
            item_dict = item.dict()

            # 如果提供了URL，尝试从B站页面提取元数据
            if item_dict.get("url"):
                try:
                    metadata = self.minio_service.extract_metadata_from_bilibili_url(
                        item_dict["url"]
                    )
                    logger.info(f"成功从URL提取元数据: {item_dict['url']}")

                    # 使用提取的元数据更新项目信息，覆盖默认值或空值
                    title = item_dict.get("title")
                    if (
                        not title or title == "string" or not title.strip()
                    ) and metadata.get("title"):
                        item_dict["title"] = metadata["title"]

                    cover_image_url = item_dict.get("cover_image_url")
                    if (
                        not cover_image_url
                        or cover_image_url == "string"
                        or not cover_image_url.strip()
                    ) and metadata.get("image_url"):
                        item_dict["cover_image_url"] = metadata["image_url"]

                    description = item_dict.get("description")
                    if (
                        not description
                        or description == "string"
                        or not description.strip()
                    ) and metadata.get("description"):
                        item_dict["description"] = metadata["description"]

                    # 处理标签 - 如果提取到了styles标签且当前标签为空或为默认值
                    tags = item_dict.get("tags")
                    extracted_styles = metadata.get("styles")
                    if extracted_styles and (
                        not tags or tags == "string" or not tags.strip()
                    ):
                        item_dict["tags"] = extracted_styles

                    # 添加额外的元数据信息到description字段
                    extra_info = []
                    total_episodes = item_dict.get("total_episodes")
                    if metadata.get("total_episodes") and (
                        not total_episodes or total_episodes == 0
                    ):
                        item_dict["total_episodes"] = metadata["total_episodes"]

                    if metadata.get("areas") and metadata.get("areas") not in (
                        item_dict.get("tags") or ""
                    ):
                        extra_info.append(f"地区: {metadata['areas']}")

                    if metadata.get("styles") and metadata.get("styles") not in (
                        item_dict.get("tags") or ""
                    ):
                        extra_info.append(f"类型: {metadata['styles']}")

                    if metadata.get("rating_score"):
                        extra_info.append(
                            f"评分: {metadata['rating_score']} "
                            f"({metadata.get('rating_count', 0)}人评价)"
                        )

                    # 如果有额外信息且description不为空，则追加到description
                    if extra_info and item_dict.get("description"):
                        item_dict["description"] += "\n\n" + "; ".join(extra_info)
                    elif extra_info:
                        item_dict["description"] = "; ".join(extra_info)

                except Exception as extract_error:
                    logger.warning(f"从URL提取元数据失败，继续创建追番项目: {extract_error}")
                    # 元数据提取失败不影响追番项目创建，继续使用用户提供的信息

            # 创建数据库记录
            db_item = AnimeWatchlist(**item_dict)
            self.db.add(db_item)
            self.db.commit()
            self.db.refresh(db_item)

            logger.info(f"创建追番追剧项目成功: {db_item.title}")
            return db_item
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建追番追剧项目失败: {e}")
            raise e

    def update_anime_watchlist(
        self, item_id: int, item_update: AnimeWatchlistUpdate
    ) -> AnimeWatchlist:
        """更新追番追剧项目"""
        db_item = self.get_anime_watchlist(item_id)
        if not db_item:
            raise NotFoundException(f"追番追剧项目 {item_id} 不存在")

        try:
            update_data = item_update.dict(exclude_unset=True)

            # 更新封面图片URL（不再上传到MinIO，直接使用B站的链接）
            if update_data.get("cover_image_url"):
                logger.info(f"更新封面图片URL: {update_data['cover_image_url']}")
                # 不再需要上传到MinIO，直接使用提供的URL

            for field, value in update_data.items():
                setattr(db_item, field, value)

            self.db.commit()
            self.db.refresh(db_item)

            logger.info(f"更新追番追剧项目成功: {db_item.title}")
            return db_item
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新追番追剧项目失败: {e}")
            raise e

    def delete_anime_watchlist(self, item_id: int) -> bool:
        """删除追番追剧项目"""
        db_item = self.get_anime_watchlist(item_id)
        if not db_item:
            raise NotFoundException(f"追番追剧项目 {item_id} 不存在")

        try:
            self.db.delete(db_item)
            self.db.commit()

            logger.info(f"删除追番追剧项目成功: {db_item.title}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除追番追剧项目失败: {e}")
            return False

    def update_progress(
        self, item_id: int, progress: float, current_episode: Optional[int] = None
    ) -> AnimeWatchlist:
        """更新观看进度"""
        db_item = self.get_anime_watchlist(item_id)
        if not db_item:
            raise NotFoundException(f"追番追剧项目 {item_id} 不存在")

        try:
            db_item.progress = min(100, max(0, progress))  # 确保进度在0-100之间

            if current_episode is not None:
                db_item.current_episode = current_episode

            # 如果进度达到100%，自动更新状态为已完成
            if db_item.progress >= 100 and db_item.status != "completed":
                db_item.status = "completed"

            self.db.commit()
            self.db.refresh(db_item)

            logger.info(f"更新观看进度成功: {db_item.title} - {db_item.progress}%")
            return db_item
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新观看进度失败: {e}")
            raise e

    def get_status_stats(self, is_active: Optional[bool] = None) -> List[Any]:
        """获取追番追剧状态统计"""
        query = self.db.query(
            AnimeWatchlist.status, func.count(AnimeWatchlist.id).label("count")
        )

        if is_active is not None:
            query = query.filter(AnimeWatchlist.is_active == is_active)

        return query.group_by(AnimeWatchlist.status).all()

    def get_category_stats(self, is_active: Optional[bool] = None) -> List[Any]:
        """获取追番追剧分类统计"""
        query = self.db.query(
            AnimeWatchlist.category, func.count(AnimeWatchlist.id).label("count")
        )

        if is_active is not None:
            query = query.filter(AnimeWatchlist.is_active == is_active)

        return query.group_by(AnimeWatchlist.category).all()

    def get_tag_stats(self, is_active: Optional[bool] = None) -> List[Any]:
        """获取追番追剧标签统计"""
        # 使用 Python 处理标签统计，避免 SQL 复杂性和字符集问题
        try:
            # 获取所有记录
            query = self.db.query(AnimeWatchlist)
            if is_active is not None:
                query = query.filter(AnimeWatchlist.is_active == is_active)

            items = query.all()

            # 收集所有标签
            tag_counts: Dict[str, int] = {}
            for item in items:
                if item.tags and item.tags.strip():
                    # 分割标签
                    tags = [tag.strip() for tag in item.tags.split(",")]
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

    def get_anime_cover_url(self, item_id: int) -> Optional[str]:
        """获取动漫封面图片的URL

        现在直接使用数据库中存储的封面图片URL

        Args:
            item_id: 追番项目ID

        Returns:
            str: 图片URL
        """
        try:
            db_item = self.get_anime_watchlist(item_id)
            if not db_item:
                return None

            # 直接返回数据库中存储的封面图片URL
            return db_item.cover_image_url

        except Exception as e:
            logger.error(f"获取动漫封面URL失败: {e}")
            return None

    def _apply_metadata_to_item(
        self, item: AnimeWatchlist, metadata: dict
    ) -> List[str]:
        """把抓取到的元数据套用到条目上，返回被更新的字段名列表（不负责 commit）"""
        updated_fields = []

        # 更新标题（如果原标题为空或与提取的不同）
        if metadata.get("title") and (
            not item.title or item.title != metadata["title"]
        ):
            item.title = metadata["title"]
            updated_fields.append("标题")

        # 更新封面图片URL（如果原URL为空或与提取的不同）
        if metadata.get("image_url") and (
            not item.cover_image_url or item.cover_image_url != metadata["image_url"]
        ):
            item.cover_image_url = metadata["image_url"]
            updated_fields.append("封面图片URL")

        # 更新总集数（如果原集数为0或与提取的不同）
        if metadata.get("total_episodes") and (
            not item.total_episodes or item.total_episodes != metadata["total_episodes"]
        ):
            item.total_episodes = metadata["total_episodes"]
            updated_fields.append("总集数")

        # 更新标签（如果原标签为空或与提取的不同）
        if metadata.get("styles") and (
            not item.tags or item.tags != metadata["styles"]
        ):
            item.tags = metadata["styles"]
            updated_fields.append("标签")

        # 更新描述（添加额外信息）
        extra_info = []
        if metadata.get("areas"):
            extra_info.append(f"地区: {metadata['areas']}")

        if metadata.get("styles"):
            extra_info.append(f"类型: {metadata['styles']}")

        if metadata.get("rating_score"):
            extra_info.append(
                f"评分: {metadata['rating_score']} ({metadata.get('rating_count', 0)}人评价)"
            )

        if extra_info:
            extra_text = "\n\n" + "; ".join(extra_info)
            if item.description:
                # 检查是否已包含这些信息
                if not any(info in item.description for info in extra_info):
                    item.description += extra_text
                    updated_fields.append("额外信息")
            else:
                item.description = "; ".join(extra_info)
                updated_fields.append("额外信息")

        return updated_fields

    def refresh_anime_metadata(self, item_id: int) -> dict:
        """根据条目的观看链接即时抓取元数据（B 站），更新封面/标题/集数等

        供后台「获取封面URL」按钮调用：不走批量任务，保存后立刻可取。
        """
        item = self.get_anime_watchlist(item_id)
        if not item:
            raise NotFoundException("追番追剧项目不存在")
        if not item.url:
            return {
                "status": "failed",
                "message": "该条目没有填写观看链接",
                "cover_url": item.cover_image_url,
            }

        try:
            metadata = self.minio_service.extract_metadata_from_bilibili_url(item.url)
        except Exception as e:
            logger.error(f"即时抓取动漫元数据失败: {item.title}, 错误: {e}")
            return {
                "status": "failed",
                "message": f"从B站抓取失败: {str(e)}",
                "cover_url": item.cover_image_url,
            }

        updated_fields = self._apply_metadata_to_item(item, metadata)
        if updated_fields:
            self.db.commit()
            logger.info(f"即时更新动漫元数据: {item.title} - {', '.join(updated_fields)}")

        return {
            "status": "success",
            "message": f"已更新: {', '.join(updated_fields)}"
            if updated_fields
            else "元数据已是最新",
            "updated_fields": updated_fields,
            "cover_url": item.cover_image_url,
        }

    def batch_update_anime_metadata(self, limit: int = 50) -> dict:
        """批量更新动漫元数据

        为所有有URL但缺少详细信息的追番项目提取元数据

        Args:
            limit: 批量处理的数量限制，默认为50

        Returns:
            dict: 包含处理结果的字典
        """
        try:
            # 获取所有有URL但缺少详细信息的追番项目，按创建时间降序排序
            query = (
                self.db.query(AnimeWatchlist)
                .filter(AnimeWatchlist.url.isnot(None) & (AnimeWatchlist.url != ""))
                .order_by(AnimeWatchlist.created_at.desc())
                .limit(limit)
            )

            items = query.all()
            total_count = len(items)
            success_count = 0
            failed_count = 0
            results = []

            logger.info(f"开始批量更新动漫元数据，共 {total_count} 个项目")

            for item in items:
                try:
                    # 从URL提取元数据
                    if item.url:
                        try:
                            metadata = (
                                self.minio_service.extract_metadata_from_bilibili_url(
                                    item.url
                                )
                            )
                            updated_fields = self._apply_metadata_to_item(
                                item, metadata
                            )

                            # 提交更改
                            if updated_fields:
                                self.db.commit()

                                results.append(
                                    {
                                        "id": item.id,
                                        "title": item.title,
                                        "status": "success",
                                        "message": f"成功更新{', '.join(updated_fields)}",
                                    }
                                )
                                success_count += 1
                                logger.info(
                                    f"成功更新动漫元数据: {item.title} - "
                                    f"{', '.join(updated_fields)}"
                                )
                            else:
                                results.append(
                                    {
                                        "id": item.id,
                                        "title": item.title,
                                        "status": "skipped",
                                        "message": "无需更新",
                                    }
                                )
                                success_count += 1

                        except Exception as extract_error:
                            logger.error(
                                f"从URL提取元数据失败: {item.title}, 错误: {extract_error}"
                            )
                            results.append(
                                {
                                    "id": item.id,
                                    "title": item.title,
                                    "status": "failed",
                                    "message": f"从URL提取元数据失败: {str(extract_error)}",
                                }
                            )
                            failed_count += 1
                    else:
                        results.append(
                            {
                                "id": item.id,
                                "title": item.title,
                                "status": "skipped",
                                "message": "没有可用的URL",
                            }
                        )
                        failed_count += 1

                except Exception as item_error:
                    logger.error(f"更新动漫元数据失败: {item.title}, 错误: {item_error}")
                    results.append(
                        {
                            "id": item.id,
                            "title": item.title,
                            "status": "failed",
                            "message": str(item_error),
                        }
                    )
                    failed_count += 1

            logger.info(f"批量更新完成: 成功 {success_count} 个，失败 {failed_count} 个")

            return {
                "total": total_count,
                "success": success_count,
                "failed": failed_count,
                "results": results,
            }

        except Exception as e:
            logger.error(f"批量更新动漫元数据失败: {e}")
            return {
                "total": 0,
                "success": 0,
                "failed": 0,
                "results": [],
                "error": str(e),
            }


# 创建服务实例函数
def create_anime_watchlist_service(db: Session):
    """创建追番追剧服务实例"""
    return AnimeWatchlistService(db)

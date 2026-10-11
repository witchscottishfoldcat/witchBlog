import re
from typing import List, Optional, Tuple

from loguru import logger
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.storage_paths import MD_FILES_PREFIX, MD_PROXY_URL_PREFIX
from app.models.md_file import MDFile
from app.schemas.md_file import MDFileCreate, MDFileUpdate
from app.services.md_metadata_service import MDMetadataService
from app.services.md_monitor_service import (
    invalidate_cache_on_file_delete,
    invalidate_cache_on_file_update,
)
from app.services.minio_service import minio_service as _minio_singleton


class MDFileService:
    """MD文件服务类"""

    def __init__(self):
        self.minio_service = _minio_singleton

    def get_file(
        self,
        db: Session,
        file_id: int,
        user_id: Optional[int] = None,
        refresh_url: bool = True,
        check_permission: bool = True,
    ) -> MDFile:
        """获取MD文件

        Args:
            db: 数据库会话
            file_id: 文件ID
            user_id: 用户ID（None表示不检查用户权限）
            refresh_url: 是否刷新URL
            check_permission: 是否检查权限（默认True，代理接口可设为False）
        """
        file = db.query(MDFile).filter(MDFile.id == file_id).first()
        if not file:
            raise NotFoundException(f"文件 {file_id} 不存在")

        # 检查权限（只有在需要检查权限且提供了用户ID时才检查）
        if check_permission and user_id is not None:
            # 如果不是文件所有者
            if file.owner_id != user_id:
                # 如果文件不是公开的，则无权访问
                if not file.is_public:
                    raise NotFoundException(f"文件 {file_id} 不存在或无权访问")

        # 刷新URL（特别是私有文件的预签名URL）
        url_updated = False
        if refresh_url and file.object_name:
            if not file.is_public:
                # 私有文件使用预签名URL，需要刷新
                new_url = self.minio_service.get_file_url(
                    file.object_name, presigned=True
                )
                file.file_url = new_url
                url_updated = True

        # 如果更新了URL，提交到数据库
        if url_updated:
            db.commit()

        # 设置proxy_url（如果尚未设置）
        if not file.proxy_url:
            file.proxy_url = f"{MD_PROXY_URL_PREFIX}{file_id}"
            db.commit()

        return file

    def get_files(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        owner_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None,
        refresh_private_urls: bool = True,
    ) -> Tuple[List[MDFile], int]:
        """获取MD文件列表"""
        query = db.query(MDFile)

        # 按所有者筛选
        if owner_id is not None:
            query = query.filter(MDFile.owner_id == owner_id)

        # 按公开状态筛选
        if is_public is not None:
            query = query.filter(MDFile.is_public == is_public)

        # 搜索
        if search:
            query = query.filter(
                or_(
                    MDFile.title.contains(search),
                    MDFile.description.contains(search),
                    MDFile.tags.contains(search),
                    MDFile.original_filename.contains(search),
                )
            )

        # 获取总数
        total = query.count()

        # 分页
        files = query.order_by(desc(MDFile.created_at)).offset(skip).limit(limit).all()

        # 刷新私有文件的URL
        if refresh_private_urls:
            for file in files:
                if file.object_name and not file.is_public:
                    # 私有文件使用预签名URL，需要刷新
                    new_url = self.minio_service.get_file_url(
                        file.object_name, presigned=True
                    )
                    file.file_url = new_url

                    # 同时更新数据库中的URL，确保后续请求可以使用最新的URL
                    file.file_url = new_url

        # 如果刷新了URL，提交到数据库
        if refresh_private_urls:
            db.commit()

        return files, total

    def create_file(
        self, db: Session, file_data: MDFileCreate, owner_id: int
    ) -> MDFile:
        """创建MD文件"""
        try:
            # 根据文件公开状态决定保存位置
            if file_data.is_public:
                # 公开文件保存到公开位置
                minio_info = self.minio_service.upload_content(
                    content=file_data.content,
                    filename=file_data.filename,
                    folder="md_files",
                    is_public=True,  # 明确指定为公开
                )
                file_url = self.minio_service.get_file_url(
                    minio_info["object_name"], presigned=False
                )
            else:
                # 私有文件保存到私有位置
                minio_info = self.minio_service.upload_content(
                    content=file_data.content,
                    filename=file_data.filename,
                    folder="md_files",
                    is_public=False,  # 明确指定为私有
                )
                file_url = self.minio_service.get_file_url(
                    minio_info["object_name"], presigned=True
                )

            # 计算字数
            word_count = len(re.findall(r"\w+", file_data.content))

            # 创建数据库记录，object_name根据公开状态指向相应位置
            db_file = MDFile(
                title=file_data.title,
                description=file_data.description,
                tags=file_data.tags,
                is_public=file_data.is_public,
                published=file_data.published,
                category=file_data.category,
                subcategory=file_data.subcategory,
                pinned=file_data.pinned,
                encrypted=file_data.encrypted,
                author=file_data.author,
                original_filename=file_data.filename,
                object_name=minio_info["object_name"],  # 根据公开状态指向相应位置
                bucket_name=settings.MINIO_BUCKET_NAME,
                file_size=minio_info["size"],
                file_url=file_url,
                etag=minio_info["etag"],
                word_count=word_count,
                owner_id=owner_id,
            )

            db.add(db_file)
            db.commit()
            db.refresh(db_file)

            # 设置proxy_url
            db_file.proxy_url = f"{MD_PROXY_URL_PREFIX}{db_file.id}"
            db.commit()
            db.refresh(db_file)

            # 解析并存储front-matter元数据
            MDMetadataService.parse_and_store_metadata(db, db_file, file_data.content)
            db.refresh(db_file)

            # 如果创建的是公开文件，清除RSS缓存
            if file_data.is_public:
                try:
                    from app.services.rss import rss_service

                    rss_service.clear_cache()
                    logger.info(f"创建公开文件 {db_file.id} 后，RSS缓存已清除")
                except Exception as rss_error:
                    logger.error(f"清除RSS缓存失败: {rss_error}")

            return db_file
        except Exception as e:
            db.rollback()
            raise e

    def update_file(
        self,
        db: Session,
        file_id: int,
        file_update: MDFileUpdate,
        user_id: int,
        is_superuser: bool = False,
    ) -> MDFile:
        """更新MD文件"""
        file = self.get_file(db, file_id, check_permission=is_superuser is False)

        # 检查权限：非所有者且非超级管理员无权更新
        if file.owner_id != user_id and not is_superuser:
            raise BadRequestException("无权更新此文件")

        update_data = file_update.dict(exclude_unset=True)
        content_changed = "content" in update_data

        # 检查是否更改了公开状态
        is_public_changed = (
            "is_public" in update_data and update_data["is_public"] != file.is_public
        )
        new_is_public = update_data.get("is_public", file.is_public)

        # 如果更新了内容或公开状态改变，需要重新上传到MinIO
        if content_changed or is_public_changed:
            content = update_data.pop("content", None)

            # 如果没有提供内容但有公开状态改变，需要获取当前内容
            if content is None and is_public_changed:
                content = self.minio_service.get_file_content(file.object_name)

            # 删除旧文件（如果存在）
            if file.object_name:
                self.minio_service.delete_file(file.object_name)

            # 处理公开状态改变
            if is_public_changed:
                # 根据新的公开状态选择存储位置
                if new_is_public:
                    # 文件变为公开，上传到公开位置
                    minio_info = self.minio_service.upload_content(
                        content=content,
                        filename=file.original_filename,
                        folder="md_files",
                        is_public=True,  # 明确指定为公开
                    )
                    # 公开文件使用永久URL
                    file_url = self.minio_service.get_file_url(
                        minio_info["object_name"], presigned=False
                    )
                else:
                    # 文件变为私有，上传到私有位置
                    minio_info = self.minio_service.upload_content(
                        content=content,
                        filename=file.original_filename,
                        folder="md_files",
                        is_public=False,  # 明确指定为私有
                    )
                    # 私有文件使用预签名URL
                    file_url = self.minio_service.get_file_url(
                        minio_info["object_name"], presigned=True
                    )

                # 更新数据库中的object_name和相关信息
                update_data["object_name"] = minio_info["object_name"]
                update_data["file_size"] = minio_info["size"]
                update_data["etag"] = minio_info["etag"]
                update_data["file_url"] = file_url
            else:
                # 只是更新内容，不改变公开状态
                # 根据当前公开状态选择存储位置
                minio_info = self.minio_service.upload_content(
                    content=content,
                    filename=file.original_filename,
                    folder="md_files",
                    is_public=bool(file.is_public),
                )

                # 生成URL
                if file.is_public:
                    # 公开文件使用永久URL
                    file_url = self.minio_service.get_file_url(
                        minio_info["object_name"], presigned=False
                    )
                else:
                    # 私有文件使用预签名URL
                    file_url = self.minio_service.get_file_url(
                        minio_info["object_name"], presigned=True
                    )

                # 更新MinIO相关信息
                update_data["object_name"] = minio_info["object_name"]
                update_data["file_size"] = minio_info["size"]
                update_data["file_url"] = file_url
                update_data["etag"] = minio_info["etag"]

            if content:
                # 更新字数
                update_data["word_count"] = len(re.findall(r"\w+", content))

        # 更新其他字段
        for field, value in update_data.items():
            setattr(file, field, value)

        db.commit()
        db.refresh(file)

        # 设置proxy_url（如果尚未设置）
        if not file.proxy_url:
            file.proxy_url = f"{MD_PROXY_URL_PREFIX}{file_id}"
            db.commit()
            db.refresh(file)

        # 使缓存失效
        invalidate_cache_on_file_update(file_id, db)

        # 如果更新了内容，解析并存储front-matter元数据
        if content_changed:
            try:
                # 获取更新后的内容
                if content is None:
                    # 如果没有提供新内容，从MinIO获取当前内容
                    content = self.minio_service.get_file_content(file.object_name)

                # 解析并存储元数据
                MDMetadataService.parse_and_store_metadata(db, file, content)
                db.refresh(file)
            except Exception as e:
                # 不影响文件更新，只记录错误
                logger = __import__("loguru").logger
                logger.error(f"更新元数据失败: {str(e)}")

        return file

    def delete_file(
        self, db: Session, file_id: int, user_id: int, is_superuser: bool = False
    ) -> bool:
        """删除MD文件"""
        file = self.get_file(db, file_id, check_permission=is_superuser is False)

        # 检查权限：非所有者且非超级管理员无权删除
        if file.owner_id != user_id and not is_superuser:
            raise BadRequestException("无权删除此文件")

        # 从object_name指向的位置删除文件
        self.minio_service.delete_file(file.object_name)

        # 如果是公开文件且object_name不指向公开位置，尝试从公开位置删除
        if file.is_public and not file.object_name.startswith("public/"):
            try:
                # 尝试从公开位置删除，提取文件名
                file_name = file.object_name.split("/")[-1]  # 获取文件名部分
                public_object_name = f"{MD_FILES_PREFIX}{file_name}"  # 公开位置的object_name
                self.minio_service.delete_file(public_object_name)
            except Exception:
                pass  # 如果文件不存在，忽略错误

        # 保存文件URL用于缓存失效
        file_url = file.file_url

        # 从数据库删除记录
        db.delete(file)
        db.commit()

        # 使缓存失效
        invalidate_cache_on_file_delete(file_url)

        return True

    def get_file_content(
        self, db: Session, file_id: int, user_id: Optional[int] = None
    ) -> str:
        """获取MD文件内容"""
        file = self.get_file(db, file_id, user_id)

        # 直接从object_name指向的位置获取内容
        # 由于修复后的object_name会根据公开状态指向正确的位置
        # 所以不再需要额外的逻辑
        try:
            content = self.minio_service.get_file_content(file.object_name)
            return content
        except Exception as e:
            # 如果是公开文件且私有位置无法访问，尝试从公开位置获取
            if file.is_public and not file.object_name.startswith("public/"):
                try:
                    # 尝试从公开位置获取，提取文件名
                    file_name = file.object_name.split("/")[-1]  # 获取文件名部分
                    public_object_name = (
                        f"{MD_FILES_PREFIX}{file_name}"  # 公开位置的object_name
                    )
                    content = self.minio_service.get_file_content(public_object_name)
                    return content
                except Exception:
                    pass

            # 如果都失败了，重新抛出异常
            raise e

    def count_files(self, db: Session, owner_id: Optional[int] = None) -> int:
        """统计文件数量"""
        query = db.query(MDFile)

        if owner_id is not None:
            query = query.filter(MDFile.owner_id == owner_id)

        return query.count()

    def set_proxy_url(self, db: Session, file_id: int, proxy_url: str) -> None:
        """写入文件的代理 URL（首次代理访问时回填；调用方负责提交会话生命周期）"""
        db.query(MDFile).filter(MDFile.id == file_id).update({"proxy_url": proxy_url})
        db.commit()

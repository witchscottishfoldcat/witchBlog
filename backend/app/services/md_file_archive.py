import logging
from datetime import date, datetime
from typing import List, Optional, Tuple

from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.md_file import MDFile
from app.models.md_file_archive import MDFileArchive
from app.services.md_metadata_parser import MDMetadataParser
from app.services.md_metadata_service import MDMetadataService
from app.services.minio_service import minio_service as _minio_singleton

logger = logging.getLogger(__name__)


class MDFileArchiveService:
    """MD文件归档服务类"""

    def __init__(self):
        self.minio_service = _minio_singleton
        self.metadata_parser = MDMetadataParser()
        self.metadata_service = MDMetadataService()

    def archive_file(
        self,
        db: Session,
        file_id: int,
        archive_reason: str,
        user_id: int,
        is_superuser: bool = False,
    ) -> MDFileArchive:
        """
        归档MD文件

        Args:
            db: 数据库会话
            file_id: 要归档的文件ID
            archive_reason: 归档原因
            user_id: 操作用户ID
            is_superuser: 是否为超级管理员（可归档任意文件）

        Returns:
            归档记录
        """
        # 获取要归档的文件
        file = db.query(MDFile).filter(MDFile.id == file_id).first()
        if not file:
            raise NotFoundException(f"文件 {file_id} 不存在")

        # 检查权限：非所有者且非超级管理员无权归档
        if file.owner_id != user_id and not is_superuser:
            raise BadRequestException("无权归档此文件")

        try:
            # 获取文件内容
            content = self.minio_service.get_file_content(file.object_name)

            # 解析元数据
            result = self.metadata_parser.parse_frontmatter(content)
            processed_metadata = result["metadata"]

            # 上传到归档文件夹
            archive_minio_info = self.minio_service.upload_content(
                content=content,
                filename=file.original_filename,
                folder="archive/md_files",
                is_public=False,  # 归档文件默认私有
            )

            # 生成归档文件URL
            archive_file_url = self.minio_service.get_file_url(
                archive_minio_info["object_name"], presigned=True
            )

            # 处理元数据中的日期序列化
            metadata_json = None
            if processed_metadata:
                # 创建一个可序列化的元数据副本
                # frontmatter 的日期字段（如 published: 2026-08-17）解析为 date，
                # JSON 列无法序列化，处理方式与 md_metadata_service 保持一致
                serializable_metadata = {}
                for key, value in processed_metadata.items():
                    if isinstance(value, (datetime, date)):
                        serializable_metadata[key] = value.isoformat()
                    else:
                        serializable_metadata[key] = value
                metadata_json = serializable_metadata

            # 创建归档记录
            archive_record = MDFileArchive(
                original_file_id=file.id,
                title=file.title,
                description=file.description,
                original_filename=file.original_filename,
                archive_object_name=archive_minio_info["object_name"],
                bucket_name=settings.MINIO_BUCKET_NAME,
                file_size=archive_minio_info["size"],
                file_url=archive_file_url,
                etag=archive_minio_info["etag"],
                word_count=file.word_count,
                is_public=file.is_public,  # 记录归档时的公开状态
                tags=file.tags,
                archive_reason=archive_reason,
                owner_id=file.owner_id,
                # 添加元数据字段
                published=bool(
                    processed_metadata.get("published", False)
                ),  # 归档表该字段为 Boolean；frontmatter 里通常是发布日期(date)，有日期即视为已发布
                category=processed_metadata.get("category") or file.category,
                subcategory=processed_metadata.get("subcategory") or file.subcategory,
                pinned=processed_metadata.get("pinned", False),
                encrypted=processed_metadata.get("encrypted", False),
                author=processed_metadata.get("author"),
                parsed_metadata=metadata_json,
            )

            db.add(archive_record)

            # 提前取出 object_name / 标题：commit 后原 file 实例被删除且过期，
            # 再访问其属性会触发 ORM 刷新已删除对象而报错
            original_object_name = file.object_name
            original_title = file.title

            # 从数据库删除原始记录（先提交事务，成功后再删对象存储）
            db.delete(file)

            db.commit()
            db.refresh(archive_record)

            # 事务提交成功后再删除原位置的 MinIO 对象。
            # 必须先入库后删对象：对象存储删除无法随事务回滚，
            # 若先删对象而后面的步骤失败，会出现「文章还在但内容丢失」的数据不一致。
            # 这里删除失败仅记录告警：归档已完成，残留原对象无害，可手动清理。
            try:
                self.minio_service.delete_file(original_object_name)
            except Exception as del_err:
                logger.warning(
                    f"归档后删除原对象失败（归档已成功，原对象残留）: "
                    f"file_id={file_id}, object={original_object_name}, error={del_err}"
                )

            logger.info(f"成功归档文件: {original_title} (ID: {file_id})")
            return archive_record

        except Exception as e:
            db.rollback()
            logger.error(f"归档文件失败: {e}")
            raise e

    def get_archive(
        self,
        db: Session,
        archive_id: int,
        user_id: Optional[int] = None,
        refresh_url: bool = True,
    ) -> MDFileArchive:
        """获取归档文件"""
        archive = db.query(MDFileArchive).filter(MDFileArchive.id == archive_id).first()
        if not archive:
            raise NotFoundException(f"归档文件 {archive_id} 不存在")

        # 检查权限
        if user_id is not None:
            # 如果是文件所有者或超级用户，可以访问
            if archive.owner_id != user_id:
                raise NotFoundException(f"归档文件 {archive_id} 不存在或无权访问")

        # 刷新URL（归档文件使用预签名URL）
        if refresh_url and archive.archive_object_name:
            new_url = self.minio_service.get_file_url(
                archive.archive_object_name, presigned=True
            )
            archive.file_url = new_url
            db.commit()

        return archive

    def get_archives(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        owner_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None,
        refresh_urls: bool = True,
    ) -> Tuple[List[MDFileArchive], int]:
        """获取归档文件列表"""
        query = db.query(MDFileArchive)

        # 按所有者筛选
        if owner_id is not None:
            query = query.filter(MDFileArchive.owner_id == owner_id)

        # 按公开状态筛选
        if is_public is not None:
            query = query.filter(MDFileArchive.is_public == is_public)

        # 搜索
        if search:
            query = query.filter(
                or_(
                    MDFileArchive.title.contains(search),
                    MDFileArchive.description.contains(search),
                    MDFileArchive.tags.contains(search),
                    MDFileArchive.original_filename.contains(search),
                    MDFileArchive.archive_reason.contains(search),
                )
            )

        # 获取总数
        total = query.count()

        # 分页
        archives = (
            query.order_by(desc(MDFileArchive.archive_date))
            .offset(skip)
            .limit(limit)
            .all()
        )

        # 刷新归档文件的URL
        if refresh_urls:
            for archive in archives:
                if archive.archive_object_name:
                    new_url = self.minio_service.get_file_url(
                        archive.archive_object_name, presigned=True
                    )
                    archive.file_url = new_url

            # 提交到数据库
            db.commit()

        return archives, total

    def get_archive_content(
        self, db: Session, archive_id: int, user_id: Optional[int] = None
    ) -> str:
        """获取归档文件内容"""
        archive = self.get_archive(db, archive_id, user_id)

        try:
            content = self.minio_service.get_file_content(archive.archive_object_name)
            return content
        except Exception as e:
            logger.error(f"获取归档文件内容失败: {e}")
            raise e

    def delete_archive(
        self, db: Session, archive_id: int, user_id: int, is_superuser: bool = False
    ) -> bool:
        """删除归档文件"""
        archive = self.get_archive(db, archive_id)

        # 检查权限：非所有者且非超级管理员无权删除
        if archive.owner_id != user_id and not is_superuser:
            raise BadRequestException("无权删除此归档文件")

        # 从归档位置删除文件
        self.minio_service.delete_file(archive.archive_object_name)

        # 从数据库删除记录
        db.delete(archive)
        db.commit()

        return True

    def count_archives(
        self,
        db: Session,
        owner_id: Optional[int] = None,
        is_public: Optional[bool] = None,
    ) -> int:
        """统计归档文件数量"""
        query = db.query(MDFileArchive)

        if owner_id is not None:
            query = query.filter(MDFileArchive.owner_id == owner_id)

        if is_public is not None:
            query = query.filter(MDFileArchive.is_public == is_public)

        return query.count()


# 创建服务实例
md_file_archive_service = MDFileArchiveService()

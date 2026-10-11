"""
MD文件元数据服务
用于处理MD文件的front-matter元数据解析和存储
"""

from typing import Any, Dict, Optional

from loguru import logger
from sqlalchemy.orm import Session

from app.models.md_file import MDFile
from app.services.md_metadata_parser import MDMetadataParser


class MDMetadataService:
    """MD文件元数据服务类"""

    @staticmethod
    def parse_and_store_metadata(db: Session, md_file: MDFile, content: str) -> None:
        """
        解析MD文件的front-matter并存储到数据库

        Args:
            db: 数据库会话
            md_file: MD文件模型实例
            content: MD文件内容
        """
        try:
            # 解析front-matter
            result = MDMetadataParser.parse_frontmatter(content)
            metadata = result["metadata"]

            if metadata:
                # 更新MD文件模型的元数据字段
                if "title" in metadata and not md_file.title:
                    md_file.title = metadata["title"][:200]  # 确保标题不超过字段长度限制

                if "description" in metadata:
                    md_file.description = metadata["description"]

                if "tags" in metadata:
                    md_file.tags = metadata["tags"]

                if "published" in metadata:
                    md_file.published = metadata["published"]

                if "category" in metadata:
                    md_file.category = metadata["category"][:100]  # 确保分类不超过字段长度限制

                if "subcategory" in metadata:
                    md_file.subcategory = metadata["subcategory"][:100]

                if "pinned" in metadata:
                    md_file.pinned = metadata["pinned"]

                if "encrypted" in metadata:
                    md_file.encrypted = metadata["encrypted"]

                if "author" in metadata:
                    md_file.author = metadata["author"][:100]  # 确保作者名不超过字段长度限制

                # 存储完整的元数据（JSON格式）
                # 处理日期对象，确保可以序列化为JSON
                from datetime import date, datetime

                def json_serializable(obj):
                    """将对象转换为JSON可序列化的格式"""
                    if isinstance(obj, (date, datetime)):
                        return obj.isoformat()
                    return obj

                # 创建一个可序列化的元数据副本
                serializable_metadata = {}
                for key, value in metadata.items():
                    serializable_metadata[key] = json_serializable(value)

                md_file.parsed_metadata = serializable_metadata

                # 提交到数据库
                db.commit()

                logger.info(f"成功更新文件 {md_file.id} 的元数据")
            else:
                logger.info(f"文件 {md_file.id} 没有找到front-matter元数据")

        except Exception as e:
            logger.error(f"解析和存储元数据失败 {md_file.id}: {str(e)}")
            # 不抛出异常，允许文件继续正常处理，只是不包含元数据

    @staticmethod
    def extract_metadata_from_content(content: str) -> Dict[str, Any]:
        """
        从内容中提取元数据

        Args:
            content: MD文件内容

        Returns:
            提取的元数据字典
        """
        try:
            result = MDMetadataParser.parse_frontmatter(content)
            return result["metadata"]
        except Exception as e:
            logger.error(f"提取元数据失败: {str(e)}")
            return {}

    @staticmethod
    def extract_title_from_content(content: str) -> Optional[str]:
        """
        从内容中提取标题

        Args:
            content: MD文件内容

        Returns:
            提取的标题字符串，如果没有找到则返回None
        """
        try:
            return MDMetadataParser.extract_title_from_content(content)
        except Exception as e:
            logger.error(f"提取标题失败: {str(e)}")
            return None

    @staticmethod
    def update_file_metadata(db: Session, file_id: int, content: str) -> bool:
        """
        更新文件的元数据

        Args:
            db: 数据库会话
            file_id: 文件ID
            content: 新的文件内容

        Returns:
            是否成功更新
        """
        try:
            # 获取文件
            md_file = db.query(MDFile).filter(MDFile.id == file_id).first()
            if not md_file:
                logger.error(f"文件 {file_id} 不存在")
                return False

            # 解析并存储元数据
            MDMetadataService.parse_and_store_metadata(db, md_file, content)
            return True

        except Exception as e:
            logger.error(f"更新文件元数据失败 {file_id}: {str(e)}")
            return False

    @staticmethod
    def has_frontmatter(content: str) -> bool:
        """
        检查内容是否包含front-matter

        Args:
            content: 文件内容

        Returns:
            是否包含front-matter
        """
        try:
            return MDMetadataParser.has_frontmatter(content)
        except Exception as e:
            logger.error(f"检查front-matter失败: {str(e)}")
            return False

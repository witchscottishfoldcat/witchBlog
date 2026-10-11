"""
MD文件元数据解析器
用于解析MD文件的front-matter元数据
"""

import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional

import frontmatter
from loguru import logger


class MDMetadataParser:
    """MD文件元数据解析器"""

    TAG_SEPARATOR_PATTERN = re.compile(r'[,，、;；]+|["\'“”‘’]\s*["\'“”‘’]')
    TAG_EDGE_QUOTES_PATTERN = re.compile(r'^["\'“”‘’]+|["\'“”‘’]+$')

    # 支持的元数据字段映射
    METADATA_MAPPING = {
        "title": "title",
        "description": "description",
        "tags": "tags",
        "published": "published",
        "category": "category",
        "subcategory": "subcategory",
        "sub_category": "subcategory",
        "secondary_category": "subcategory",
        "pinned": "pinned",
        "encrypted": "encrypted",
        "date": "published",  # 日期字段映射到published
        "created": "published",  # 创建时间字段映射到published
        "author": "author",
        "summary": "description",  # 摘要字段映射到description
    }

    @classmethod
    def parse_frontmatter(cls, content: str) -> Dict[str, Any]:
        """
        解析MD文件的front-matter

        Args:
            content: MD文件内容

        Returns:
            包含元数据和正文的字典
            {
                'metadata': Dict[str, Any],  # 解析出的元数据
                'content': str,              # 纯正文内容（不含front-matter）
                'raw_content': str           # 原始内容
            }
        """
        try:
            # 使用frontmatter库解析
            post = frontmatter.loads(content)

            # 提取元数据
            metadata = post.metadata if post.metadata else {}

            # 规范化元数据字段名
            normalized_metadata = cls._normalize_metadata(metadata)

            # 处理特殊字段类型
            processed_metadata = cls._process_metadata_fields(normalized_metadata)

            return {
                "metadata": processed_metadata,
                "content": post.content,
                "raw_content": content,
            }

        except Exception as e:
            logger.error(f"解析front-matter失败: {str(e)}")
            return {"metadata": {}, "content": content, "raw_content": content}

    @classmethod
    def extract_metadata_from_file(cls, file_path: str) -> Dict[str, Any]:
        """
        从文件路径读取并解析MD文件的元数据

        Args:
            file_path: MD文件路径

        Returns:
            解析后的元数据字典
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            result = cls.parse_frontmatter(content)
            return result["metadata"]

        except FileNotFoundError:
            logger.error(f"文件不存在: {file_path}")
            return {}
        except Exception as e:
            logger.error(f"读取文件失败 {file_path}: {str(e)}")
            return {}

    @classmethod
    def _normalize_metadata(cls, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        规范化元数据字段名
        将各种可能的字段名映射到标准字段名

        Args:
            metadata: 原始元数据字典

        Returns:
            规范化后的元数据字典
        """
        normalized = {}

        for key, value in metadata.items():
            # 尝试映射字段名
            mapped_key = cls.METADATA_MAPPING.get(key.lower(), key.lower())

            # 跳过无效字段
            if not value and value != 0 and value is not False:
                continue

            normalized[mapped_key] = value

        return normalized

    @classmethod
    def _process_metadata_fields(cls, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        处理特殊字段类型的转换

        Args:
            metadata: 规范化后的元数据字典

        Returns:
            处理后的元数据字典
        """
        processed = metadata.copy()

        # 处理日期字段
        if "published" in processed:
            published = processed["published"]
            if isinstance(published, str):
                # 尝试解析日期字符串
                try:
                    # 支持ISO格式和其他常见日期格式
                    processed["published"] = cls._parse_date_string(published)
                except ValueError:
                    logger.warning(f"无法解析日期字符串: {published}")
                    del processed["published"]
            elif isinstance(published, (datetime, date)):
                processed["published"] = published
            else:
                # 无效的日期格式，移除
                if "published" in processed:
                    del processed["published"]

        # 处理标签字段
        if "tags" in processed:
            tags = processed["tags"]
            normalized_tags = cls._normalize_tags(tags)
            if normalized_tags:
                processed["tags"] = ",".join(normalized_tags)
            else:
                # 无效的标签格式，移除
                del processed["tags"]

        # 处理布尔字段
        for field in ["pinned", "encrypted"]:
            if field in processed:
                value = processed[field]
                if isinstance(value, bool):
                    # 已经是布尔值，保持不变
                    pass
                elif isinstance(value, str):
                    # 字符串转布尔值
                    processed[field] = value.lower() in ("true", "yes", "1", "on")
                elif isinstance(value, (int, float)):
                    # 数字转布尔值
                    processed[field] = bool(value)
                else:
                    # 其他类型，尝试转为布尔值
                    processed[field] = bool(value)

        # 处理一级、二级分类字段
        for field in ("category", "subcategory"):
            if field in processed:
                value = processed[field]
                processed[field] = (
                    value.strip() if isinstance(value, str) else str(value).strip()
                )

        return processed

    @classmethod
    def _normalize_tags(cls, tags: Any) -> List[str]:
        """Normalize current and legacy tag formats into individual tag names."""
        values = tags if isinstance(tags, list) else [tags]
        normalized: List[str] = []

        for value in values:
            if not isinstance(value, str):
                continue

            body = value.strip().removeprefix("[").removesuffix("]")
            for tag in cls.TAG_SEPARATOR_PATTERN.split(body):
                cleaned = cls.TAG_EDGE_QUOTES_PATTERN.sub("", tag.strip()).strip()
                if cleaned:
                    normalized.append(cleaned)

        return normalized

    @classmethod
    def _parse_date_string(cls, date_str: str) -> datetime:
        """
        解析日期字符串

        Args:
            date_str: 日期字符串

        Returns:
            datetime对象

        Raises:
            ValueError: 无法解析日期
        """
        # 常见日期格式
        date_formats = [
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y/%m/%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M",
            "%Y/%m/%d %H:%M",
        ]

        # 尝试各种格式
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue

        raise ValueError(f"无法解析日期字符串: {date_str}")

    @classmethod
    def has_frontmatter(cls, content: str) -> bool:
        """
        检查内容是否包含front-matter

        Args:
            content: 文件内容

        Returns:
            是否包含front-matter
        """
        try:
            post = frontmatter.loads(content)
            return bool(post.metadata)
        except Exception:
            return False

    @classmethod
    def extract_title_from_content(cls, content: str) -> Optional[str]:
        """
        从内容中提取标题（优先使用front-matter中的title，其次是第一个H1标题）

        Args:
            content: MD文件内容

        Returns:
            标题字符串，如果没有找到则返回None
        """
        result = cls.parse_frontmatter(content)

        # 优先使用front-matter中的title
        if result["metadata"].get("title"):
            return result["metadata"]["title"]

        # 尝试从内容中提取第一个H1标题
        content_text = result["content"]
        h1_pattern = r"^#\s+(.+)$"

        for line in content_text.split("\n"):
            match = re.match(h1_pattern, line.strip())
            if match:
                return match.group(1).strip()

        return None

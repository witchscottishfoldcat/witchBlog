import hashlib
import logging
import time
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.models.md_file import MDFile
from app.services.minio_service import minio_service

logger = logging.getLogger(__name__)


class MDCacheService:
    """MD文件缓存服务，提供本地磁盘缓存功能"""

    def __init__(self):
        # 创建缓存目录
        self.cache_dir = Path(settings.UPLOAD_DIR) / "md_cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # 设置缓存过期时间（秒）
        self.cache_ttl = 24 * 60 * 60  # 默认24小时

        logger.info(f"MD缓存服务初始化完成，缓存目录: {self.cache_dir}")

    def _get_cache_key(self, file_url: str) -> str:
        """生成缓存键值"""
        # 使用URL的MD5哈希作为缓存键
        return hashlib.md5(file_url.encode("utf-8")).hexdigest()

    def _get_cache_path(self, file_url: str) -> Path:
        """获取缓存文件路径"""
        cache_key = self._get_cache_key(file_url)
        return self.cache_dir / f"{cache_key}.md"

    def _get_meta_path(self, cache_key: str) -> Path:
        """获取元数据文件路径"""
        return self.cache_dir / f"{cache_key}.meta"

    def _is_cache_valid(
        self, cache_file: Path, meta_file: Path, original_etag: Optional[str] = None
    ) -> bool:
        """检查缓存是否有效"""
        if not cache_file.exists() or not meta_file.exists():
            return False

        try:
            # 检查缓存文件是否过期
            file_mtime = cache_file.stat().st_mtime
            if time.time() - file_mtime > self.cache_ttl:
                return False

            # 如果提供了ETag，检查文件是否变化
            if original_etag:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta_data = f.read().strip()
                    if meta_data != original_etag:
                        return False

            return True
        except Exception as e:
            logger.error(f"检查缓存有效性时出错: {e}")
            return False

    def get_cached_content(self, md_file: MDFile) -> Optional[str]:
        """获取缓存的MD文件内容"""
        if not md_file.file_url:
            return None

        cache_file = self._get_cache_path(md_file.file_url)
        cache_key = self._get_cache_key(md_file.file_url)
        meta_file = self._get_meta_path(cache_key)

        if not self._is_cache_valid(cache_file, meta_file, md_file.etag):
            logger.debug(f"缓存无效或已过期: {md_file.file_url}")
            return None

        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                content = f.read()
            logger.debug(f"成功从缓存读取文件: {md_file.file_url}")
            return content
        except Exception as e:
            logger.error(f"读取缓存文件时出错: {e}")
            return None

    def cache_content(self, md_file: MDFile, content: str) -> bool:
        """缓存MD文件内容"""
        if not md_file.file_url:
            return False

        cache_file = self._get_cache_path(md_file.file_url)
        cache_key = self._get_cache_key(md_file.file_url)
        meta_file = self._get_meta_path(cache_key)

        try:
            # 写入缓存文件
            with open(cache_file, "w", encoding="utf-8") as f:
                f.write(content)

            # 写入元数据文件（存储ETag用于检查文件变化）
            with open(meta_file, "w", encoding="utf-8") as f:
                f.write(md_file.etag or "")

            logger.info(f"成功缓存文件: {md_file.file_url} -> {cache_file}")
            return True
        except Exception as e:
            logger.error(f"缓存文件时出错: {e}")
            return False

    def fetch_and_cache(self, md_file: MDFile) -> Optional[str]:
        """从MinIO获取文件并缓存（使用服务端SDK凭证，不依赖公开策略/URL）"""
        if not getattr(md_file, "object_name", None):
            logger.error(
                f"MD文件缺少 object_name，无法回源: {getattr(md_file, 'file_url', None)}"
            )
            return None

        try:
            response = minio_service.client.get_object(
                minio_service.bucket_name, md_file.object_name
            )
            try:
                raw_bytes = response.read()
            finally:
                response.close()
                response.release_conn()

            # 处理文本编码，确保正确显示中文
            content = None

            # 尝试多种编码方式解码
            for encoding in ["utf-8", "gbk", "gb2312", "big5"]:
                try:
                    content = raw_bytes.decode(encoding)
                    logger.info(f"成功使用 {encoding} 编码解码文件: {md_file.object_name}")
                    break
                except UnicodeDecodeError:
                    continue

            # 如果所有编码都失败，使用容错解码
            if content is None:
                try:
                    content = raw_bytes.decode("utf-8", errors="replace")
                    logger.warning(f"使用UTF-8容错解码文件: {md_file.object_name}")
                except Exception as e:
                    logger.error(f"解码文件内容失败: {md_file.object_name}, 错误: {e}")
                    return None

            # 缓存内容
            if self.cache_content(md_file, content):
                logger.info(f"成功获取并缓存文件: {md_file.object_name}")
                return content
            else:
                logger.warning(f"获取文件成功但缓存失败: {md_file.object_name}")
                return content
        except Exception as e:
            logger.error(f"获取并缓存文件时出错: {getattr(md_file, 'object_name', '?')}, 错误: {e}")
            return None

    def get_content(
        self, md_file: MDFile, force_refresh: bool = False
    ) -> Optional[str]:
        """获取MD文件内容，优先从缓存获取"""
        logger.info(
            f"开始获取MD文件内容: force_refresh={force_refresh}, file_url={md_file.file_url}"
        )

        if force_refresh:
            logger.info(f"强制刷新缓存: {md_file.file_url}")
            return self.fetch_and_cache(md_file)

        # 先尝试从缓存获取
        logger.info("尝试从缓存获取文件内容")
        cached_content = self.get_cached_content(md_file)
        if cached_content is not None:
            logger.info(f"缓存命中，返回缓存内容: length={len(cached_content)}")
            return cached_content

        # 缓存未命中，从MinIO获取并缓存
        logger.info("缓存未命中，从OSS获取文件内容")
        return self.fetch_and_cache(md_file)

    def invalidate_cache(self, file_url: str) -> bool:
        """使缓存失效"""
        if not file_url:
            return False

        cache_file = self._get_cache_path(file_url)
        cache_key = self._get_cache_key(file_url)
        meta_file = self._get_meta_path(cache_key)

        try:
            # 删除缓存文件和元数据文件
            if cache_file.exists():
                cache_file.unlink()

            if meta_file.exists():
                meta_file.unlink()

            logger.info(f"已失效缓存: {file_url}")
            return True
        except Exception as e:
            logger.error(f"失效缓存时出错: {e}")
            return False

    def clean_expired_cache(self) -> int:
        """清理过期的缓存文件"""
        cleaned_count = 0

        try:
            current_time = time.time()
            for cache_file in self.cache_dir.glob("*.md"):
                if current_time - cache_file.stat().st_mtime > self.cache_ttl:
                    # 删除过期的缓存文件
                    cache_file.unlink()
                    cleaned_count += 1

                    # 尝试删除对应的元数据文件
                    meta_file = self.cache_dir / f"{cache_file.stem}.meta"
                    if meta_file.exists():
                        meta_file.unlink()

            logger.info(f"清理过期缓存完成，删除了 {cleaned_count} 个文件")
        except Exception as e:
            logger.error(f"清理过期缓存时出错: {e}")

        return cleaned_count

    def clean_all_cache(self) -> int:
        """清理所有缓存文件"""
        cleaned_count = 0

        try:
            # 删除所有.md文件和.meta文件
            for cache_file in self.cache_dir.glob("*.md"):
                cache_file.unlink()
                cleaned_count += 1

                # 删除对应的元数据文件
                meta_file = self.cache_dir / f"{cache_file.stem}.meta"
                if meta_file.exists():
                    meta_file.unlink()

            logger.info(f"清理所有缓存完成，删除了 {cleaned_count} 个文件")
        except Exception as e:
            logger.error(f"清理所有缓存时出错: {e}")

        return cleaned_count

    def get_cache_stats(self) -> dict:
        """获取缓存统计信息"""
        try:
            cache_files = list(self.cache_dir.glob("*.md"))
            total_size = sum(f.stat().st_size for f in cache_files)

            return {
                "cache_dir": str(self.cache_dir),
                "file_count": len(cache_files),
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "ttl_hours": self.cache_ttl / (60 * 60),
            }
        except Exception as e:
            logger.error(f"获取缓存统计信息时出错: {e}")
            return {"error": str(e)}


# 创建全局缓存服务实例
md_cache_service = MDCacheService()

"""
OSS 图片缓存服务

为 OSS 代理提供本地磁盘缓存：
- 命中缓存直接读本地文件，避免每次都回源 OSS
- 未命中时用服务端 MinIO 凭证拉取并落盘（顺带解决私有/策略缺失对象的访问问题）
- 缓存键基于 object_name 的 MD5，存储 {key}.{ext} + {key}.meta

设计镜像 app/services/md_cache_service.py，区别在于处理二进制而非文本。
"""
import hashlib
import logging
import os
import time
from pathlib import Path
from typing import Optional, Tuple

from app.core.config import settings

# 允许代理的 object_name 前缀白名单，防止任意读取 OSS 对象
# 唯一权威定义见 app/core/storage_paths.py（新增图片目录时在那里登记）
from app.core.storage_paths import PROXY_ALLOWED_PREFIXES as ALLOWED_OBJECT_PREFIXES

logger = logging.getLogger(__name__)

# 图片缓存过期时间（秒），默认 24 小时
IMAGE_CACHE_TTL_SECONDS = 24 * 60 * 60


def _cache_dir() -> Path:
    """缓存根目录：UPLOAD_DIR/image_cache"""
    return Path(settings.UPLOAD_DIR) / "image_cache"


def _cache_key(object_name: str) -> str:
    """生成缓存键值：object_name 的 MD5"""
    return hashlib.md5(object_name.encode("utf-8")).hexdigest()


def _ext_from_object_name(object_name: str) -> str:
    """从 object_name 提取扩展名（含点），未知时回退为空"""
    ext = os.path.splitext(object_name)[1].lower()
    # 限制扩展名，避免被构造出奇怪的可执行文件名
    # 注意不含 .svg：SVG 可携带脚本，经本服务域名回显会形成存储型 XSS 面
    allowed = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".bmp")
    return ext if ext in allowed else ""


def _cache_file_path(object_name: str) -> Path:
    """缓存内容文件路径"""
    return (
        _cache_dir() / f"{_cache_key(object_name)}{_ext_from_object_name(object_name)}"
    )


def _meta_file_path(object_name: str) -> Path:
    """缓存元数据文件路径（记录 content_type 与 object_name 便于清理/诊断）"""
    return _cache_dir() / f"{_cache_key(object_name)}.meta"


def is_object_allowed(object_name: str) -> bool:
    """校验 object_name 是否在允许代理的白名单前缀内"""
    if not object_name:
        return False
    # 禁止路径穿越
    if ".." in object_name or object_name.startswith("/"):
        return False
    return object_name.startswith(ALLOWED_OBJECT_PREFIXES)


def _is_cache_valid(cache_file: Path) -> bool:
    """检查缓存文件是否存在且未过期"""
    if not cache_file.exists():
        return False
    if time.time() - cache_file.stat().st_mtime > IMAGE_CACHE_TTL_SECONDS:
        return False
    return True


class ImageCacheService:
    """OSS 图片磁盘缓存服务"""

    def __init__(self):
        self.cache_dir = _cache_dir()
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"图片缓存服务初始化完成，缓存目录: {self.cache_dir}")

    def get_cached(self, object_name: str) -> Optional[Tuple[bytes, str]]:
        """
        从本地缓存读取图片

        Returns:
            (image_bytes, content_type) 或 None（缓存未命中/失效）
        """
        cache_file = _cache_file_path(object_name)
        if not _is_cache_valid(cache_file):
            return None
        try:
            data = cache_file.read_bytes()
            content_type = _guess_content_type(object_name)
            logger.debug(f"图片缓存命中: {object_name}")
            return data, content_type
        except Exception as e:
            logger.error(f"读取图片缓存失败: {object_name}, 错误: {e}")
            return None

    def fetch_and_cache(self, object_name: str) -> Optional[Tuple[bytes, str]]:
        """
        从 OSS 拉取图片并落盘缓存

        使用服务端 MinIO 凭证，不依赖桶公开策略。
        """
        # 延迟导入，避免与 minio_service 形成模块级循环
        from app.services.minio_service import minio_service

        try:
            response = minio_service.client.get_object(
                minio_service.bucket_name, object_name
            )
            try:
                data = response.read()
            finally:
                response.close()
                response.release_conn()

            content_type = (
                response.headers.get("content-type")
                if hasattr(response, "headers")
                else None
            ) or _guess_content_type(object_name)

            # 写入缓存（失败不影响本次返回）
            self._write_cache(object_name, data)
            logger.info(f"从 OSS 拉取并缓存图片: {object_name}")
            return data, content_type
        except Exception as e:
            logger.error(f"从 OSS 拉取图片失败: {object_name}, 错误: {e}")
            return None

    def _write_cache(self, object_name: str, data: bytes) -> bool:
        """写入缓存文件与元数据"""
        try:
            cache_file = _cache_file_path(object_name)
            meta_file = _meta_file_path(object_name)
            cache_file.write_bytes(data)
            meta_file.write_text(object_name, encoding="utf-8")
            return True
        except Exception as e:
            logger.error(f"写入图片缓存失败: {object_name}, 错误: {e}")
            return False

    def get_content(self, object_name: str) -> Optional[Tuple[bytes, str]]:
        """获取图片内容：优先缓存，未命中则回源"""
        cached = self.get_cached(object_name)
        if cached is not None:
            return cached
        return self.fetch_and_cache(object_name)

    def invalidate_cache(self, object_name: str) -> bool:
        """使指定 object_name 的缓存失效"""
        try:
            cache_file = _cache_file_path(object_name)
            meta_file = _meta_file_path(object_name)
            if cache_file.exists():
                cache_file.unlink()
            if meta_file.exists():
                meta_file.unlink()
            logger.info(f"已失效图片缓存: {object_name}")
            return True
        except Exception as e:
            logger.error(f"失效图片缓存失败: {object_name}, 错误: {e}")
            return False

    def clean_expired_cache(self) -> int:
        """清理过期缓存（以 .meta 文件为驱动，删除成对的内容文件）"""
        cleaned = 0
        try:
            now = time.time()
            for meta_file in self.cache_dir.glob("*.meta"):
                if now - meta_file.stat().st_mtime > IMAGE_CACHE_TTL_SECONDS:
                    cache_key = meta_file.stem
                    # 删除同 key 的内容文件（任意扩展名）
                    for content_file in self.cache_dir.glob(f"{cache_key}.*"):
                        if content_file.suffix == ".meta":
                            continue
                        content_file.unlink()
                        cleaned += 1
                    meta_file.unlink()
            if cleaned:
                logger.info(f"清理过期图片缓存完成，删除了 {cleaned} 个文件")
        except Exception as e:
            logger.error(f"清理过期图片缓存出错: {e}")
        return cleaned

    def get_cache_stats(self) -> dict:
        """获取缓存统计信息"""
        try:
            meta_files = list(self.cache_dir.glob("*.meta"))
            total_size = 0
            for meta_file in meta_files:
                cache_key = meta_file.stem
                for content_file in self.cache_dir.glob(f"{cache_key}.*"):
                    if content_file.suffix != ".meta":
                        total_size += content_file.stat().st_size
            return {
                "cache_dir": str(self.cache_dir),
                "file_count": len(meta_files),
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "ttl_hours": IMAGE_CACHE_TTL_SECONDS / (60 * 60),
            }
        except Exception as e:
            logger.error(f"获取图片缓存统计出错: {e}")
            return {"error": str(e)}


# 扩展名 -> content_type 映射，用于无响应头时推断
_CONTENT_TYPE_MAP = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".bmp": "image/bmp",
}


def _guess_content_type(object_name: str) -> str:
    """根据扩展名推断 content_type"""
    ext = _ext_from_object_name(object_name)
    return _CONTENT_TYPE_MAP.get(ext, "application/octet-stream")


# 全局缓存服务实例
image_cache_service = ImageCacheService()

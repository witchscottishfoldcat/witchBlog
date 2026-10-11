import io
import json
import logging
import uuid
from datetime import timedelta
from typing import BinaryIO, Optional, Tuple

from minio import Minio
from minio.error import S3Error

from app.core.config import settings
from app.core.storage_paths import (
    ANIME_COVERS_PREFIX,
    LINK_IMAGES_PREFIX,
    UPLOAD_PART_SIZE,
)

logger = logging.getLogger(__name__)

# OSS 代理端点路径（与 app/api/v1/proxy.py 的路由保持一致）
OSS_PROXY_PATH = "/api/v1/proxy/oss"
REMOTE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
IMAGE_FORMAT_METADATA = {
    "JPEG": (".jpg", "image/jpeg"),
    "PNG": (".png", "image/png"),
    "GIF": (".gif", "image/gif"),
    "WEBP": (".webp", "image/webp"),
    "BMP": (".bmp", "image/bmp"),
}


def build_proxy_url(object_name: str) -> str:
    """
    根据对象名构建代理 URL，隐藏 OSS 真实地址。

    返回形如: {BACKEND_BASE_URL}/api/v1/proxy/oss/{object_name}

    若 BACKEND_BASE_URL 未配置，则回退为相对路径（仅同源部署时可用）。
    """
    base = (settings.BACKEND_BASE_URL or "").rstrip("/")
    object_name = object_name.lstrip("/")
    return f"{base}{OSS_PROXY_PATH}/{object_name}"


def to_proxy_url(value: Optional[str]) -> Optional[str]:
    """
    将 OSS 直链或对象名改写为代理 URL。

    - OSS 直链 (http://{MINIO_ENDPOINT}/{bucket}/xxx) -> 代理 URL
    - 已经是对象名 -> 代理 URL
    - 外部 URL（B 站/Steam 等）或空值 -> 原样返回
    """
    if not value:
        return value

    # 判断是否为 OSS 直链：形如 http(s)://{endpoint}/{bucket}/...
    oss_prefix_http = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_NAME}/"
    oss_prefix_https = (
        f"https://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_NAME}/"
    )
    if value.startswith(oss_prefix_http):
        object_name = value[len(oss_prefix_http) :]
        return build_proxy_url(object_name)
    if value.startswith(oss_prefix_https):
        object_name = value[len(oss_prefix_https) :]
        return build_proxy_url(object_name)

    # 已经是代理 URL，避免重复改写
    if OSS_PROXY_PATH in value:
        return value

    # 以 http 开头的其他外部链接，原样返回（不处理外部 CDN 图片）
    if value.startswith(("http://", "https://")):
        return value

    # 其余视为对象名
    return build_proxy_url(value)


class MinIOService:
    """MinIO服务类"""

    def __init__(self):
        """构造函数只创建客户端，不做任何网络调用。

        桶存在性与桶策略统一由启动流程经 minio_policy_service 处理；
        历史版本在构造函数里检查桶并写策略，导致每次实例化都有 2-3 次
        MinIO 网络往返，且与 minio_policy_service 的策略互相冲突。
        """
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME

    def upload_content(
        self, content: str, filename: str, folder: str, is_public: bool = False
    ) -> dict:
        """
        上传内容到MinIO

        Args:
            content: 要上传的内容（字符串）
            filename: 文件名
            folder: 文件夹名称
            is_public: 是否为公开文件

        Returns:
            dict: 包含对象名称、大小和ETag的字典
        """
        try:
            # 将字符串转换为字节流
            content_bytes = content.encode("utf-8")
            content_stream = io.BytesIO(content_bytes)

            # 生成唯一的文件名
            file_extension = self._get_file_extension(filename)
            # 该方法只用于文本/Markdown 内容上传，
            # 限制扩展名白名单防止借公开前缀托管任意类型文件（.html/.svg 等）
            allowed_text_extensions = (".md", ".markdown", ".mdown", ".mkd", ".txt")
            if file_extension and file_extension.lower() not in allowed_text_extensions:
                raise ValueError(
                    f"不允许的文件扩展名: {file_extension}，仅允许 {allowed_text_extensions}"
                )
            object_name = (
                f"{folder}/{uuid.uuid4()}{file_extension if file_extension else '.txt'}"
            )

            # 上传文件
            result = self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=content_stream,
                length=len(content_bytes),
                part_size=UPLOAD_PART_SIZE,
                content_type="text/markdown",
            )

            # 如果是公开文件，设置公开读取权限
            if is_public:
                # 为单个对象设置访问策略
                # 注意：MinIO可能不支持单个对象的策略设置，所以我们需要在URL层面处理
                # 这里我们只是记录日志，真正的公开访问通过直接URL访问实现
                logger.info(f"上传公开文件: {object_name}")
            else:
                logger.info(f"上传私有文件: {object_name}")

            return {
                "object_name": object_name,
                "size": len(content_bytes),
                "etag": result.etag,
            }
        except S3Error as e:
            logger.error(f"上传内容到MinIO失败: {e}")
            raise

    def get_upload_url(self, object_name: str, expires_in: int = 3600) -> str:
        """
        获取预签名上传URL（PUT）

        Args:
            object_name: 对象名称
            expires_in: 有效期（秒）

        Returns:
            str: 预签名上传URL
        """
        return self.client.presigned_put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            expires=timedelta(seconds=expires_in),
        )

    def get_file_url(self, object_name: str, presigned: bool = False) -> str:
        """
        获取文件URL

        Args:
            object_name: 对象名称
            presigned: 是否使用预签名URL（用于私有文件）

        Returns:
            str: 文件URL
        """
        if presigned:
            # 生成预签名URL，有效期1小时（私有文件场景）
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=timedelta(hours=1),
            )
            return url
        else:
            # 公开访问走后端代理，隐藏 OSS 真实地址
            return build_proxy_url(object_name)

    def delete_file(self, object_name: str) -> bool:
        """
        删除文件

        Args:
            object_name: 对象名称

        Returns:
            bool: 删除是否成功
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"成功删除文件: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"删除文件失败: {e}")
            return False

    def get_file_content(self, object_name: str) -> str:
        """
        获取文件内容

        Args:
            object_name: 对象名称

        Returns:
            str: 文件内容
        """
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            try:
                data = response.read()
            finally:
                # 必须释放连接，否则 MinIO 连接池连接耗尽
                response.close()
                response.release_conn()
            return data.decode("utf-8")
        except S3Error as e:
            logger.error(f"获取文件内容失败: {e}")
            raise

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
            # 生成唯一的文件名
            file_extension = self._get_file_extension(file_name)
            object_name = f"{LINK_IMAGES_PREFIX}{uuid.uuid4()}{file_extension}"

            # 上传文件
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file_data,
                length=-1,  # 自动检测长度
                part_size=UPLOAD_PART_SIZE,
                content_type=content_type,
            )

            # 生成公开访问URL（走代理，隐藏 OSS 地址）
            public_url = build_proxy_url(object_name)

            logger.info(f"成功上传链接图片: {object_name}")
            return object_name, public_url

        except S3Error as e:
            logger.error(f"上传链接图片到MinIO失败: {e}")
            raise

    def delete_link_image(self, object_name: str) -> bool:
        """
        删除链接图片

        Args:
            object_name: 对象名称

        Returns:
            bool: 删除是否成功
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"成功删除链接图片: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"删除链接图片失败: {e}")
            return False

    def get_link_image_url(self, object_name: str) -> str:
        """
        获取链接图片的URL

        Args:
            object_name: 对象名称

        Returns:
            str: 图片URL（走代理，隐藏 OSS 地址）
        """
        return build_proxy_url(object_name)

    def upload_anime_cover(self, image_url: str) -> Tuple[str, str]:
        """
        从URL下载动漫封面图片并上传到MinIO

        Args:
            image_url: 图片URL

        Returns:
            Tuple[object_name, public_url]: 对象名称和公开访问URL
        """
        try:
            # 导入必要的库
            from io import BytesIO

            from app.core.ssrf_guard import create_safe_sync_client

            # 下载图片
            with create_safe_sync_client(
                image_url, timeout=30.0, follow_redirects=False
            ) as client:
                response = client.get(image_url)
                response.raise_for_status()

                # 检查内容类型是否为图片
                content_type = response.headers.get("content-type", "")
                if not content_type.startswith("image/"):
                    logger.error(
                        f"URL不是图片类型: {image_url}, content-type: {content_type}"
                    )
                    raise ValueError(f"URL不是图片类型: {content_type}")

                if len(response.content) > REMOTE_IMAGE_MAX_BYTES:
                    raise ValueError("远程图片超过大小限制")
                is_valid, image_format, _ = self.validate_image_content(
                    response.content
                )
                if not is_valid or image_format not in IMAGE_FORMAT_METADATA:
                    raise ValueError("远程内容不是受支持的图片")
                file_extension, content_type = IMAGE_FORMAT_METADATA[image_format]

                object_name = (
                    f"{ANIME_COVERS_PREFIX}{uuid.uuid4()}"
                    f"{file_extension if file_extension else '.jpg'}"
                )

                # 创建内存流
                image_stream = BytesIO(response.content)

                # 上传文件
                self.client.put_object(
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    data=image_stream,
                    length=len(response.content),
                    part_size=UPLOAD_PART_SIZE,
                    content_type=content_type,
                )

                # 生成公开访问URL（走代理，隐藏 OSS 地址）
                public_url = build_proxy_url(object_name)

                logger.info(f"成功上传动漫封面: {object_name}")
                return object_name, public_url

        except Exception as e:
            logger.error(f"上传动漫封面到MinIO失败: {e}")
            raise

    def _get_extension_from_content_type(self, content_type: str) -> str:
        """
        根据内容类型获取文件扩展名

        Args:
            content_type: 内容类型

        Returns:
            str: 文件扩展名（包含点）
        """
        content_type_map = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
        }

        return content_type_map.get(content_type, "")

    def delete_anime_cover(self, object_name: str) -> bool:
        """
        删除动漫封面图片

        Args:
            object_name: 对象名称

        Returns:
            bool: 删除是否成功
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"成功删除动漫封面: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"删除动漫封面失败: {e}")
            return False

    def get_anime_cover_url(self, object_name: str) -> str:
        """
        获取动漫封面的URL

        Args:
            object_name: 对象名称

        Returns:
            str: 图片URL（走代理，隐藏 OSS 地址）
        """
        return build_proxy_url(object_name)

    def extract_metadata_from_bilibili_url(self, page_url: str) -> dict:
        """
        从B站番剧页面提取元数据信息

        Args:
            page_url: 网页URL

        Returns:
            dict: 包含元数据的字典

        Raises:
            ValueError: 如果无法提取元数据
        """
        try:
            # 导入必要的库
            import re
            from urllib.parse import urlparse

            from bs4 import BeautifulSoup

            # SSRF 防护：仅允许 bilibili.com（含子域），拒绝内网/保留地址
            from app.core.ssrf_guard import create_safe_sync_client

            hostname = (urlparse(page_url).hostname or "").lower()
            bilibili_allowed = hostname == "bilibili.com" or hostname.endswith(
                ".bilibili.com"
            )
            if not bilibili_allowed:
                raise ValueError("仅支持 bilibili.com 的页面URL")

            # 下载网页内容，添加常见的请求头以避免被拒绝
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/91.0.4472.124 Safari/537.36"
                ),
                "Accept": (
                    "text/html,application/xhtml+xml,"
                    "application/xml;q=0.9,image/webp,*/*;q=0.8"
                ),
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }

            # 禁止跟随重定向：防止跳转绕过 bilibili 域名白名单
            with create_safe_sync_client(
                page_url, timeout=30.0, follow_redirects=False, headers=headers
            ) as client:
                response = client.get(page_url)
                response.raise_for_status()

                # 检查内容类型是否为HTML
                content_type = response.headers.get("content-type", "")
                if not content_type.startswith("text/html"):
                    logger.error(
                        f"URL不是HTML类型: {page_url}, content-type: {content_type}"
                    )
                    raise ValueError(f"URL不是HTML类型: {content_type}")

                # 解析HTML
                soup = BeautifulSoup(response.content, "html.parser")

                metadata = {}

                # 1. Open Graph标签
                og_tags = {}
                for meta in soup.find_all("meta"):
                    if meta.get("property") and meta.get("property").startswith("og:"):
                        og_tags[meta.get("property")] = meta.get("content")

                metadata.update(
                    {
                        "title": og_tags.get("og:title"),
                        "image_url": og_tags.get("og:image"),
                        "description": og_tags.get("og:description"),
                        "url": og_tags.get("og:url"),
                        "type": og_tags.get("og:type"),
                    }
                )

                # 2. 内联script数据
                scripts = soup.find_all("script")
                window_data = None

                for script in scripts:
                    if script.string and ("__INITIAL_STATE__" in script.string):
                        try:
                            pattern = r"window\.__INITIAL_STATE__\s*=\s*({.*?});"
                            match = re.search(pattern, script.string, re.DOTALL)
                            if match:
                                window_data = json.loads(match.group(1))
                                break
                        except Exception:
                            continue

                if window_data and "mediaInfo" in window_data:
                    media_info = window_data["mediaInfo"]

                    # 提取更多详细信息
                    if not metadata.get("title"):
                        metadata["title"] = media_info.get("title")

                    if not metadata.get("description"):
                        metadata["description"] = media_info.get("brief")

                    if not metadata.get("image_url"):
                        metadata["image_url"] = media_info.get("cover")

                    # 提取额外信息
                    metadata["horizontal_cover"] = media_info.get("horizontal_cover")
                    metadata["total_episodes"] = media_info.get("ep_size")

                    # 处理地区信息
                    if "areas" in media_info:
                        areas = media_info.get("areas", [])
                        if isinstance(areas, list) and len(areas) > 0:
                            areas_names = [
                                area.get("name") if isinstance(area, dict) else area
                                for area in areas
                            ]
                            metadata["areas"] = ", ".join(areas_names)

                    metadata["publisher"] = media_info.get("publisher")
                    metadata["style"] = media_info.get("style")
                    metadata["alias"] = media_info.get("alias")

                    # 从evaluate字段提取评分和描述
                    evaluate = media_info.get("evaluate", "")
                    if evaluate and not metadata.get("description"):
                        metadata["description"] = evaluate

                    # 提取季度信息
                    if "season_id" in media_info:
                        metadata["season_id"] = media_info["season_id"]

                    if "season_title" in media_info:
                        metadata["season_title"] = media_info["season_title"]

                    # 提取类型标签
                    if "styles" in media_info:
                        styles = media_info["styles"]
                        if isinstance(styles, list):
                            style_names = [
                                style.get("name") if isinstance(style, dict) else style
                                for style in styles
                            ]
                            metadata["styles"] = ", ".join(style_names)

                    # 提取评分信息
                    if "rating" in media_info:
                        rating = media_info["rating"]
                        if isinstance(rating, dict):
                            metadata["rating_score"] = rating.get("score")
                            metadata["rating_count"] = rating.get("count")

                # 处理缺失信息
                if not metadata.get("title"):
                    title_tag = soup.find("title")
                    if title_tag:
                        metadata["title"] = title_tag.get_text().strip()

                if not metadata.get("description"):
                    description_meta = soup.find("meta", attrs={"name": "description"})
                    if description_meta:
                        metadata["description"] = description_meta.get(
                            "content", ""
                        ).strip()

                # 清理描述文本
                description = metadata.get("description")
                if description:
                    metadata["description"] = description.strip()

                # 确保URL是完整的
                url = metadata.get("url")
                if url and not url.startswith("http"):
                    metadata["url"] = "https:" + url

                # 确保图片URL是完整的
                image_url = metadata.get("image_url")
                if image_url and not image_url.startswith("http"):
                    metadata["image_url"] = (
                        "https:" + image_url
                        if image_url.startswith("//")
                        else image_url
                    )

                logger.info(f"成功从B站页面提取元数据: {page_url}")
                return metadata

        except Exception as e:
            logger.error(f"从B站页面提取元数据失败: {e}")
            raise

    def _get_file_extension(self, file_name: str) -> str:
        """
        获取文件扩展名

        Args:
            file_name: 文件名

        Returns:
            str: 文件扩展名（包含点）
        """
        if not file_name:
            return ""

        last_dot_index = file_name.rfind(".")
        if last_dot_index == -1:
            return ""

        return file_name[last_dot_index:].lower()

    def is_image_file(self, file_name: str) -> bool:
        """
        检查是否是图片文件

        Args:
            file_name: 文件名

        Returns:
            bool: 是否是图片文件
        """
        if not file_name:
            return False

        extension = self._get_file_extension(file_name)
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        return extension in allowed_extensions

    @staticmethod
    def validate_image_content(data: bytes) -> tuple:
        """
        使用 Pillow 校验文件内容是否为真实图片。

        仅依赖 content-type 或扩展名不可靠，攻击者可上传伪装为图片的
        恶意文件（如含脚本的 SVG）。此方法通过实际解码图片头来判断。

        Args:
            data: 文件二进制内容

        Returns:
            (is_valid: bool, format: Optional[str], (width, height): Optional[tuple])
        """
        if not data:
            return False, None, None

        try:
            import io as _io

            from PIL import Image

            img = Image.open(_io.BytesIO(data))
            # verify() 会检查文件完整性，发现损坏或伪造时抛出异常
            img.verify()

            # verify 后需要重新打开才能获取尺寸/格式
            img = Image.open(_io.BytesIO(data))
            # 仅允许安全的位图格式，拒绝 SVG/PDF 等可携带脚本的格式
            allowed_formats = {"JPEG", "PNG", "GIF", "WEBP", "BMP"}
            if img.format not in allowed_formats:
                return False, None, None

            return True, img.format, img.size
        except Exception:
            return False, None, None

    def upload_file(self, file, folder: str, is_public: bool = True) -> dict:
        """
        上传文件到MinIO

        Args:
            file: 上传的文件对象
            folder: 目标文件夹
            is_public: 是否为公开文件

        Returns:
            dict: 包含文件信息的字典
        """
        try:
            # 读取文件内容
            file_content = file.file.read()
            file.file.seek(0)  # 重置文件指针

            # This generic entry point is currently used for site images only.
            # Derive extension and MIME from decoded bytes rather than the attacker-
            # controlled filename or Content-Type header.
            is_valid, image_format, _ = self.validate_image_content(file_content)
            if not is_valid or image_format not in IMAGE_FORMAT_METADATA:
                raise ValueError("文件内容不是受支持的图片")
            file_extension, content_type = IMAGE_FORMAT_METADATA[image_format]

            # 生成唯一的文件名
            object_name = f"{folder}/{uuid.uuid4()}{file_extension}"

            # 创建内存流
            file_stream = io.BytesIO(file_content)

            # 上传文件
            result = self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file_stream,
                length=len(file_content),
                part_size=UPLOAD_PART_SIZE,
                content_type=content_type,
            )

            # 根据公开状态生成URL
            if is_public:
                # 公开文件走代理 URL，隐藏 OSS 地址
                url = build_proxy_url(object_name)
                log_message = f"成功上传公开文件: {object_name}"
            else:
                # 私有文件使用预签名URL
                url = self.client.presigned_get_object(
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    expires=timedelta(hours=1),
                )
                log_message = f"成功上传私有文件: {object_name}"

            logger.info(log_message)
            return {
                "object_name": object_name,
                "size": len(file_content),
                "url": url,
                "etag": result.etag,
            }

        except S3Error as e:
            logger.error(f"上传文件到MinIO失败: {e}")
            raise


# 创建全局MinIO服务实例
minio_service = MinIOService()

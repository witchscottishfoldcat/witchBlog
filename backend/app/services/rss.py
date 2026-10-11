"""RSS服务模块，用于生成RSS 2.0格式的XML内容"""
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from threading import Lock
from xml.dom import minidom

from loguru import logger
from sqlalchemy.orm import Session

from app.models.md_file import MDFile
from app.services.md_file import MDFileService
from app.services.site_config import SiteConfigService


class RSSCache:
    """RSS Feed缓存类"""

    def __init__(self, ttl_minutes: int = 10):
        """
        初始化缓存

        Args:
            ttl_minutes: 缓存过期时间（分钟）
        """
        self.cache: dict[str, str] = {}
        self.timestamps: dict[str, datetime] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
        self.lock = Lock()

    def get(self, key: str) -> str | None:
        """
        从缓存获取数据

        Args:
            key: 缓存键

        Returns:
            缓存的数据，如果不存在或已过期则返回None
        """
        with self.lock:
            if key not in self.cache:
                return None

            # 检查是否过期
            if datetime.now() > self.timestamps[key]:
                # 缓存已过期，删除
                del self.cache[key]
                del self.timestamps[key]
                logger.info(f"RSS缓存已过期: {key}")
                return None

            logger.info(f"从缓存获取RSS feed: {key}")
            return self.cache[key]

    def set(self, key: str, value: str) -> None:
        """
        设置缓存

        Args:
            key: 缓存键
            value: 要缓存的数据
        """
        with self.lock:
            self.cache[key] = value
            self.timestamps[key] = datetime.now() + self.ttl
            logger.info(f"RSS feed已缓存: {key}, 过期时间: {self.timestamps[key]}")

    def clear(self, key: str | None = None) -> None:
        """
        清除缓存

        Args:
            key: 要清除的缓存键，如果为None则清除所有
        """
        with self.lock:
            if key:
                if key in self.cache:
                    del self.cache[key]
                    del self.timestamps[key]
                    logger.info(f"清除RSS缓存: {key}")
            else:
                self.cache.clear()
                self.timestamps.clear()
                logger.info("清除所有RSS缓存")

    def is_expired(self, key: str) -> bool:
        """
        检查缓存是否过期

        Args:
            key: 缓存键

        Returns:
            True表示已过期或不存在，False表示有效
        """
        with self.lock:
            if key not in self.cache:
                return True
            return datetime.now() > self.timestamps[key]


class RSSService:
    """RSS服务类，用于生成RSS 2.0格式的XML内容"""

    def __init__(self, cache_ttl_minutes: int = 10):
        """
        初始化RSS服务

        Args:
            cache_ttl_minutes: RSS Feed缓存过期时间（分钟），默认10分钟
        """
        self.md_file_service = MDFileService()
        self.site_config_service = SiteConfigService()
        self.rss_cache = RSSCache(ttl_minutes=cache_ttl_minutes)

    def generate_rss_feed(
        self, db: Session, feed_url: str, limit: int = 10, force_refresh: bool = False
    ) -> str:
        """
        生成RSS 2.0格式的XML内容

        Args:
            db: 数据库会话
            feed_url: RSS feed的完整URL
            limit: 最多包含的文章数量
            force_refresh: 是否强制刷新缓存（忽略缓存）

        Returns:
            RSS XML字符串
        """
        # 生成缓存键
        cache_key = f"rss_feed_{limit}"

        # 检查缓存（除非强制刷新）
        if not force_refresh:
            cached_xml = self.rss_cache.get(cache_key)
            if cached_xml:
                logger.info("使用缓存的RSS feed")
                return cached_xml

        try:
            # 获取站点配置
            site_config = self.site_config_service.get_active_site_config(db)
            if not site_config:
                logger.warning("未找到活动的站点配置，使用默认配置")
                site_name = "WitchCat Blog"
                site_description = "你的博客简介"
                site_url = feed_url.replace("/api/v1/rss", "")
            else:
                site_name = site_config.site_name or "WitchCat Blog"
                site_description = site_config.site_signature or "你的博客简介"
                site_url = feed_url.replace("/api/v1/rss", "")

            # 获取公开文章列表（按发布时间或创建时间倒序）
            files, _ = self.md_file_service.get_files(
                db=db, skip=0, limit=limit, is_public=True
            )

            logger.info(f"正在生成RSS feed，包含 {len(files)} 篇公开文章")

            # 创建RSS根元素
            rss = ET.Element("rss", version="2.0")

            # 创建channel元素
            channel = ET.SubElement(rss, "channel")

            # 添加频道元数据
            self._add_text_element(channel, "title", site_name)
            self._add_text_element(channel, "description", site_description)
            self._add_text_element(channel, "link", site_url)
            self._add_text_element(channel, "language", "zh-cn")
            self._add_text_element(
                channel, "lastBuildDate", self._format_date(datetime.utcnow())
            )

            # 添加atom:link（支持RSS阅读器自动发现）
            channel.set("xmlns:atom", "http://www.w3.org/2005/Atom")
            channel.set("xmlns:content", "http://purl.org/rss/1.0/modules/content/")
            atom_link = ET.SubElement(channel, "{http://www.w3.org/2005/Atom}link")
            atom_link.set("href", feed_url)
            atom_link.set("rel", "self")
            atom_link.set("type", "application/rss+xml")

            # 添加文章item
            for md_file in files:
                self._add_item_element(channel, md_file, site_url, db)

            # 格式化XML
            xml_str = self._prettify_xml(rss)

            logger.info(f"RSS feed生成成功，URL: {feed_url}")

            # 存入缓存
            self.rss_cache.set(cache_key, xml_str)

            return xml_str

        except Exception as e:
            logger.error(f"生成RSS feed失败: {str(e)}")
            raise

    def clear_cache(self, limit: int | None = None) -> None:
        """
        清除RSS缓存

        Args:
            limit: 要清除的缓存limit，如果为None则清除所有
        """
        if limit is None:
            self.rss_cache.clear()
        else:
            cache_key = f"rss_feed_{limit}"
            self.rss_cache.clear(cache_key)
        logger.info(f"RSS缓存已清除: {limit if limit else 'all'}")

    def get_cache_info(self) -> dict:
        """
        获取缓存信息

        Returns:
            缓存状态信息
        """
        with self.rss_cache.lock:
            return {
                "cache_count": len(self.rss_cache.cache),
                "cache_keys": list(self.rss_cache.cache.keys()),
                "ttl_minutes": int(self.rss_cache.ttl.total_seconds() / 60),
            }

    def _add_text_element(
        self, parent: ET.Element, tag: str, text: str, use_cdata: bool = False
    ) -> None:
        """
        添加文本元素到XML

        Args:
            parent: 父元素
            tag: 标签名
            text: 文本内容
            use_cdata: 是否使用CDATA包裹（用于包含HTML的内容）
        """
        element = ET.SubElement(parent, tag)
        element.text = text
        if use_cdata:
            # 使用自定义属性标记需要CDATA包裹
            element.set("__use_cdata__", "true")

    def _add_item_element(
        self, channel: ET.Element, md_file: MDFile, base_url: str, db: Session
    ) -> None:
        """
        添加文章item到RSS channel

        Args:
            channel: RSS channel元素
            md_file: MD文件对象
            base_url: 站点基础URL
            db: 数据库会话
        """
        item = ET.SubElement(channel, "item")

        # 标题
        self._add_text_element(item, "title", md_file.title)

        # 获取完整正文内容
        try:
            full_content = self.md_file_service.get_file_content(db, md_file.id)
            # 将Markdown转换为HTML格式
            html_content = self._markdown_to_html(full_content)
        except (IOError, RuntimeError, ValueError) as e:
            logger.warning(f"获取文件 {md_file.id} 内容失败: {str(e)}，使用简介代替")
            html_content = md_file.description or ""

        # 描述（使用完整的HTML内容）
        # 这样即使RSS阅读器不支持content:encoded，也能在description中看到完整内容
        self._add_text_element(
            item, "description", html_content, use_cdata=True
        )  # 使用CDATA包裹HTML内容

        # 添加content:encoded（完整正文，HTML格式）
        # 使用CDATA包裹HTML内容
        self._add_text_element(
            item,
            "{http://purl.org/rss/1.0/modules/content/}encoded",
            html_content,
            use_cdata=True,
        )

        # 链接（使用file_url或生成默认链接）
        if md_file.file_url:
            link = md_file.file_url
        else:
            link = f"{base_url}/api/v1/md-files/{md_file.id}/content"
        self._add_text_element(item, "link", link)

        # 发布日期（优先使用published字段，其次使用created_at）
        if md_file.published:
            pub_date = datetime.combine(md_file.published, datetime.min.time())
        else:
            pub_date = md_file.created_at
        self._add_text_element(item, "pubDate", self._format_date(pub_date))

        # 作者
        if md_file.author:
            self._add_text_element(item, "author", md_file.author)

        # 分类
        if md_file.category:
            self._add_text_element(item, "category", md_file.category)

        # 标签（多个标签用逗号分隔，创建多个category元素）
        if md_file.tags:
            tags = [tag.strip() for tag in md_file.tags.split(",") if tag.strip()]
            for tag in tags:
                self._add_text_element(item, "category", tag)

        # GUID（唯一标识符）
        guid = ET.SubElement(item, "guid")
        guid.text = f"{base_url}/api/v1/md-files/{md_file.id}"
        guid.set("isPermaLink", "false")

    def _markdown_to_html(self, markdown_content: str) -> str:
        """
        将Markdown内容转换为HTML格式

        Args:
            markdown_content: Markdown格式的文本

        Returns:
            HTML格式的文本
        """
        # 简单的Markdown到HTML转换
        # 注意：这只是基础转换，建议在生产环境使用markdown库

        html = markdown_content

        # 标题 (# H1, ## H2, ### H3, etc.)
        html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)
        html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
        html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
        html = re.sub(r"^#### (.+)$", r"<h4>\1</h4>", html, flags=re.MULTILINE)
        html = re.sub(r"^##### (.+)$", r"<h5>\1</h5>", html, flags=re.MULTILINE)
        html = re.sub(r"^###### (.+)$", r"<h6>\1</h6>", html, flags=re.MULTILINE)

        # 粗体 (**bold**)
        html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
        html = re.sub(r"__(.+?)__", r"<strong>\1</strong>", html)

        # 斜体 (*italic*)
        html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)
        html = re.sub(r"_(.+?)_", r"<em>\1</em>", html)

        # 代码行 (`code`)
        html = re.sub(r"`(.+?)`", r"<code>\1</code>", html)

        # 代码块 (```)
        html = re.sub(r"```(\w+)?\n([\s\S]+?)```", r"<pre><code>\2</code></pre>", html)

        # 链接 [text](url)
        html = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r'<a href="\2">\1</a>', html)

        # 图片 ![alt](url)
        html = re.sub(r"!\[([^\]]*)\]\(([^\)]+)\)", r'<img src="\2" alt="\1" />', html)

        # 无序列表
        lines = html.split("\n")
        in_list = False
        result_lines = []
        for line in lines:
            if line.strip().startswith("- ") or line.strip().startswith("* "):
                if not in_list:
                    result_lines.append("<ul>")
                    in_list = True
                # 移除列表标记
                list_item = re.sub(r"^[\s]*[-*] (.+)$", r"\1", line)
                result_lines.append(f"  <li>{list_item}</li>")
            else:
                if in_list:
                    result_lines.append("</ul>")
                    in_list = False
                result_lines.append(line)
        if in_list:
            result_lines.append("</ul>")
        html = "\n".join(result_lines)

        # 有序列表
        lines = html.split("\n")
        in_list = False
        result_lines = []
        for line in lines:
            if re.match(r"^\s*\d+\.\s", line):
                if not in_list:
                    result_lines.append("<ol>")
                    in_list = True
                # 移除列表标记
                list_item = re.sub(r"^\s*\d+\.\s+(.+)$", r"\1", line)
                result_lines.append(f"  <li>{list_item}</li>")
            else:
                if in_list:
                    result_lines.append("</ol>")
                    in_list = False
                result_lines.append(line)
        if in_list:
            result_lines.append("</ol>")
        html = "\n".join(result_lines)

        # 段落（双换行）
        html = re.sub(r"\n\n", "</p><p>", html)
        html = "<p>" + html + "</p>"

        # 水平线 (--- 或 ***)
        html = re.sub(r"^-{3,}$", "<hr />", html, flags=re.MULTILINE)
        html = re.sub(r"^\*{3,}$", "<hr />", html, flags=re.MULTILINE)

        # 引用 (> quote)
        html = re.sub(
            r"^> (.+)$", r"<blockquote>\1</blockquote>", html, flags=re.MULTILINE
        )

        # 换行 (单换行转为<br>)
        html = re.sub(r"(?<!<\/p>)\n(?!<p>)", "<br />\n", html)

        return html

    def _format_date(self, dt: datetime) -> str:
        """
        格式化日期为RFC 822格式（RSS标准）

        Args:
            dt: datetime对象

        Returns:
            RFC 822格式的日期字符串
        """
        # 格式：Wed, 02 Oct 2002 13:00:00 GMT
        return dt.strftime("%a, %d %b %Y %H:%M:%S GMT")

    def _prettify_xml(self, elem: ET.Element) -> str:
        """
        美化XML输出，添加适当的缩进和换行

        Args:
            elem: XML根元素

        Returns:
            格式化后的XML字符串
        """
        import re

        # 使用ET.tostring转换为字符串
        rough_string = ET.tostring(elem, encoding="utf-8")
        xml_str = rough_string.decode("utf-8")

        # 找到所有带有__use_cdata__属性的元素，并为它们添加CDATA包裹
        # 正则匹配：<tag __use_cdata__="true">content</tag>
        def wrap_cdata(match):
            """为标记为CDATA的元素添加CDATA包裹"""
            tag_open = match.group(1)  # <tag __use_cdata__="true">
            content = match.group(2)  # 内容
            tag_close = match.group(3)  # </tag>

            # 移除__use_cdata__属性
            tag_open = re.sub(r'\s+__use_cdata__="true"', "", tag_open)

            # 如果内容包含CDATA，保持原样
            if "<![CDATA[" in content and "]]>" in content:
                return f"{tag_open}{content}{tag_close}"

            # 转义CDATA结束标记
            content = content.replace("]]>", "]]&gt;")

            # 添加CDATA包裹
            return f"{tag_open}<![CDATA[{content}]]>{tag_close}"

        # 匹配带有__use_cdata__属性的元素
        xml_str = re.sub(
            r'<(\S+?\s+[^>]*?__use_cdata__="true"[^>]*?)>(.*?)</\1>',
            wrap_cdata,
            xml_str,
            flags=re.DOTALL,
        )

        # 使用minidom进行格式化
        reparsed = minidom.parseString(xml_str)
        final_xml = reparsed.toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")

        # 取消CDATA内部的HTML转义，恢复原始HTML格式
        def unescape_cdata_html(match):
            """取消CDATA内的HTML转义"""
            cdata_content = match.group(1)
            # 只取消常见HTML标签的转义
            cdata_content = cdata_content.replace("&lt;", "<")
            cdata_content = cdata_content.replace("&gt;", ">")
            cdata_content = cdata_content.replace("&quot;", '"')
            cdata_content = cdata_content.replace("&apos;", "'")
            # &amp; 要最后替换，避免影响其他实体
            cdata_content = cdata_content.replace("&amp;", "&")
            # 恢复CDATA结束标记
            cdata_content = cdata_content.replace("]]&gt;", "]]>")
            return f"<![CDATA[{cdata_content}]]>"

        final_xml = re.sub(
            r"<!\[CDATA\[(.*?)\]\]>", unescape_cdata_html, final_xml, flags=re.DOTALL
        )

        return final_xml


# 创建全局RSS服务实例
rss_service = RSSService()

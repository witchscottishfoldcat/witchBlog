import re
from typing import Dict, List, Tuple
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from app.core.ssrf_guard import create_safe_sync_client
from app.core.unified_logging import get_logger

logger = get_logger(__name__)


class ProjectParserService:
    """项目信息解析服务，支持从GitHub和Gitee提取项目信息"""

    def __init__(self):
        self.request_headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/91.0.4472.124 Safari/537.36"
            )
        }

    def _safe_get(self, url: str):
        """Fetch through the shared DNS-pinned SSRF transport."""
        with create_safe_sync_client(
            url,
            timeout=10,
            follow_redirects=False,
            headers=self.request_headers,
        ) as client:
            return client.get(url)

    def parse_project_url(self, url: str) -> Tuple[str, str]:
        """
        解析项目URL，返回平台和项目路径

        Args:
            url: 项目URL

        Returns:
            (平台类型, 项目路径)
        """
        parsed_url = urlparse(url)
        # 使用 hostname 而非 netloc：netloc 含 userinfo，
        # http://github.com@10.0.0.5/ 这类伪造会被拆穿
        domain = (parsed_url.hostname or "").lower()

        # 精确匹配域名（含子域），防止 evil-github.com / github.com.attacker.com 绕过
        def _domain_allowed(domain: str, allowed: str) -> bool:
            return domain == allowed or domain.endswith(f".{allowed}")

        if _domain_allowed(domain, "github.com"):
            # 提取GitHub项目的所有者和仓库名
            path_parts = parsed_url.path.strip("/").split("/")
            if len(path_parts) >= 2:
                owner = path_parts[0]
                repo = path_parts[1]
                return "github", f"{owner}/{repo}"

        elif _domain_allowed(domain, "gitee.com"):
            # 提取Gitee项目的所有者和仓库名
            path_parts = parsed_url.path.strip("/").split("/")
            if len(path_parts) >= 2:
                owner = path_parts[0]
                repo = path_parts[1]
                return "gitee", f"{owner}/{repo}"

        raise ValueError("不支持的项目URL")

    def extract_github_info(self, url: str) -> Dict:
        """
        从GitHub项目页面提取项目信息

        Args:
            url: GitHub项目URL

        Returns:
            包含项目信息的字典
        """
        try:
            # 禁止跟随重定向，防止借助 3xx 跳转绕过域名白名单
            response = self._safe_get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            # 提取项目名称 - 尝试多个选择器
            name_elem = soup.find("strong", {"class": "mr-2"})
            if not name_elem:
                name_elem = soup.find("h1", {"class": "h3 lh-condensed"})
            if not name_elem:
                name_elem = soup.find("h1")
            name = name_elem.text.strip() if name_elem else ""

            # 提取项目描述 - 尝试多个选择器
            description_elem = soup.find("p", {"class": "f4 my-3"})
            if not description_elem:
                description_elem = soup.find("p", {"class": "f4 color-fg-muted"})
            if not description_elem:
                description_elem = soup.find("meta", {"name": "description"})
                if description_elem:
                    description = description_elem.get("content", "")
                else:
                    description = ""
            else:
                description = description_elem.text.strip() if description_elem else ""

            # 提取星标数和复刻数
            stars_elem = soup.find("a", {"href": re.compile(r"/stargazers$")})
            if stars_elem:
                stars_text = stars_elem.text.strip().replace(",", "").replace(" ", "")
                # 使用正则表达式提取数字部分
                stars_match = re.search(r"(\d+)", stars_text)
                stars_count = int(stars_match.group(1)) if stars_match else 0
            else:
                stars_count = 0

            forks_elem = soup.find("a", {"href": re.compile(r"/forks$")})
            if forks_elem:
                forks_text = forks_elem.text.strip().replace(",", "").replace(" ", "")
                # 使用正则表达式提取数字部分
                forks_match = re.search(r"(\d+)", forks_text)
                forks_count = int(forks_match.group(1)) if forks_match else 0
            else:
                forks_count = 0

            # 提取所有者和仓库名
            _, project_path = self.parse_project_url(url)
            owner, repo = project_path.split("/")

            # 提取头像URL
            avatar_elem = soup.find("img", {"class": "avatar"})
            avatar_url = avatar_elem["src"] if avatar_elem else ""

            # 构建语言统计URL并获取语言信息
            api_url = f"https://api.github.com/repos/{owner}/{repo}/languages"
            languages = self._fetch_github_languages(api_url)

            # 构建语言统计JSON
            language_stats = self._build_language_stats(languages)

            return {
                "name": name or repo,
                "description": description,
                "owner": owner,
                "repository_name": repo,
                "platform": "github",
                "url": url,
                "avatar_url": avatar_url,
                "stars_count": stars_count,
                "forks_count": forks_count,
                "language_stats": language_stats,
                "languages": languages,
                "is_private": 0,  # 公开仓库
            }

        except Exception as e:
            logger.error(f"提取GitHub项目信息失败: {e}")
            raise Exception(f"无法获取GitHub项目信息: {str(e)}")

    def extract_gitee_info(self, url: str) -> Dict:
        """
        从Gitee项目页面提取项目信息

        Args:
            url: Gitee项目URL

        Returns:
            包含项目信息的字典
        """
        try:
            # 禁止跟随重定向，防止借助 3xx 跳转绕过域名白名单
            response = self._safe_get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            # 提取项目名称 - 尝试多个选择器
            name_elem = soup.find("span", {"class": "title-project"})
            if not name_elem:
                name_elem = soup.find("h1", {"class": "project-title"})
            if not name_elem:
                name_elem = soup.find("h1")
            name = name_elem.text.strip() if name_elem else ""

            # 提取项目描述 - 尝试多个选择器
            description_elem = soup.find("div", {"class": "project-desc"})
            if not description_elem:
                description_elem = soup.find("div", {"class": "description"})
            if not description_elem:
                description_elem = soup.find("meta", {"name": "description"})
                if description_elem:
                    description = description_elem.get("content", "")
                else:
                    description = ""
            else:
                description = description_elem.text.strip() if description_elem else ""

            # 提取星标数和复刻数
            stars_elem = soup.find("a", {"title": "Star"})
            if stars_elem:
                stars_text = stars_elem.text.strip().replace(",", "").replace(" ", "")
                # 使用正则表达式提取数字部分
                stars_match = re.search(r"(\d+)", stars_text)
                stars_count = int(stars_match.group(1)) if stars_match else 0
            else:
                stars_count = 0

            forks_elem = soup.find("a", {"title": "Fork"})
            if forks_elem:
                forks_text = forks_elem.text.strip().replace(",", "").replace(" ", "")
                # 使用正则表达式提取数字部分
                forks_match = re.search(r"(\d+)", forks_text)
                forks_count = int(forks_match.group(1)) if forks_match else 0
            else:
                forks_count = 0

            # 提取所有者和仓库名
            _, project_path = self.parse_project_url(url)
            owner, repo = project_path.split("/")

            # 提取头像URL
            avatar_elem = soup.find("img", {"class": "ui avatar image"})
            avatar_url = avatar_elem["src"] if avatar_elem else ""

            # 提取语言信息 - 传递URL以便使用API
            languages = self._extract_gitee_languages(soup, url)
            language_stats = self._build_language_stats(languages)

            return {
                "name": name or repo,
                "description": description,
                "owner": owner,
                "repository_name": repo,
                "platform": "gitee",
                "url": url,
                "avatar_url": avatar_url,
                "stars_count": stars_count,
                "forks_count": forks_count,
                "language_stats": language_stats,
                "languages": languages,
                "is_private": 0,  # 公开仓库
            }

        except Exception as e:
            logger.error(f"提取Gitee项目信息失败: {e}")
            raise Exception(f"无法获取Gitee项目信息: {str(e)}")

    def _fetch_github_languages(self, api_url: str) -> List[Dict]:
        """获取GitHub项目的语言信息"""
        try:
            response = self._safe_get(api_url)
            response.raise_for_status()

            languages_data = response.json()
            total_bytes = sum(languages_data.values())

            languages = []
            for language, bytes_count in languages_data.items():
                percentage = (bytes_count / total_bytes) * 100 if total_bytes > 0 else 0
                languages.append(
                    {
                        "language": language,
                        "bytes_count": bytes_count,
                        "percentage": round(percentage, 2),
                    }
                )

            # 按使用量降序排序
            languages.sort(key=lambda x: x["percentage"], reverse=True)
            return languages

        except Exception as e:
            logger.error(f"获取GitHub语言信息失败: {e}")
            return []

    def _extract_gitee_languages(self, soup, url: str) -> List[Dict]:
        """从Gitee页面中提取语言信息"""
        try:
            # 直接使用我们改进的web_fetch_service
            from app.services.web_fetch_service import WebFetchService

            fetch_service = WebFetchService()
            languages = fetch_service.extract_languages_from_gitee(soup, url)

            logger.info(f"从Gitee页面提取到{len(languages)}种语言信息")
            return languages

        except Exception as e:
            logger.error(f"提取Gitee语言信息失败: {e}")
            return []

    def _build_language_stats(self, languages: List[Dict]) -> Dict:
        """构建语言统计JSON数据"""
        return {
            "total_languages": len(languages),
            "languages": languages,
            "dominant_language": languages[0]["language"] if languages else None,
        }

    def extract_project_info(self, url: str) -> Dict:
        """
        根据URL自动提取项目信息

        Args:
            url: 项目URL

        Returns:
            dict: 包含项目信息的字典
        """
        # SSRF 防护：拒绝内网/保留地址（域名白名单之外的 URL 在
        # parse_project_url 已被拒绝，这里再做一层 IP 层面的校验）
        platform, _ = self.parse_project_url(url)

        if platform == "github":
            return self.extract_github_info(url)
        elif platform == "gitee":
            return self.extract_gitee_info(url)
        else:
            raise ValueError(f"不支持的平台: {platform}")


# 创建全局服务实例
project_parser_service = ProjectParserService()

"""
项目仓库统计同步定时任务

定期从 GitHub / Gitee 仓库 API 拉取最新星标数与复刻数，
更新项目模块 project_info 表的 stars_count / forks_count。

与 project_parser 的整页解析不同：本任务只同步 star/fork，
走平台官方 JSON API（轻量、不依赖页面结构），其余字段不触碰。
"""

from typing import Dict, Optional, Tuple

from app.core.unified_logging import get_logger

logger = get_logger(__name__)

# 支持 star/fork 同步的平台及其仓库 API 地址模板
REPO_API_URL_TEMPLATES: Dict[str, str] = {
    "github": "https://api.github.com/repos/{owner}/{repo}",
    "gitee": "https://gitee.com/api/v5/repos/{owner}/{repo}",
}

# 仓库 API 请求超时（秒）
REPO_API_TIMEOUT_SECONDS = 10

# GitHub API 要求请求带 User-Agent，否则 403
REPO_API_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/91.0.4472.124 Safari/537.36"
    )
}


def _fetch_repo_stats(
    platform: str, owner: str, repo: str
) -> Optional[Tuple[int, int]]:
    """
    从平台仓库 API 拉取 (星标数, 复刻数)

    任何失败（网络、限流、字段缺失）都返回 None，由调用方保留旧值。
    """
    from app.core.ssrf_guard import create_safe_sync_client

    url = REPO_API_URL_TEMPLATES[platform].format(owner=owner, repo=repo)
    try:
        with create_safe_sync_client(
            url,
            timeout=REPO_API_TIMEOUT_SECONDS,
            follow_redirects=False,
            headers=REPO_API_HEADERS,
        ) as client:
            response = client.get(url)
        response.raise_for_status()
        data = response.json()
        return int(data["stargazers_count"]), int(data["forks_count"])
    except Exception as e:
        logger.warning(f"拉取仓库统计失败 {platform}/{owner}/{repo}: {e}")
        return None


def _resolve_repo_location(project) -> Optional[Tuple[str, str]]:
    """
    解析项目的 (owner, 仓库名)

    优先用库内字段；缺失时回退解析项目 URL（复用域名白名单逻辑）。
    """
    if project.owner and project.repository_name:
        return project.owner, project.repository_name

    from app.services.project_parser import project_parser_service

    try:
        _, project_path = project_parser_service.parse_project_url(project.url)
        owner, repo = project_path.split("/")
        return owner, repo
    except ValueError:
        return None


def sync_project_repo_stats() -> str:
    """更新项目模块所有仓库的星标数与复刻数"""
    from app.core.database import SessionLocal
    from app.models.project_info import ProjectInfo

    db = SessionLocal()
    updated = 0
    failed = 0
    skipped = 0
    try:
        projects = db.query(ProjectInfo).order_by(ProjectInfo.id).all()
        for project in projects:
            # 私有仓库公开 API 拉不到（404），保留旧值直接跳过
            if project.is_private:
                skipped += 1
                continue

            if project.platform not in REPO_API_URL_TEMPLATES:
                skipped += 1
                logger.warning(f"项目 {project.id} 平台 {project.platform} 暂不支持统计同步，跳过")
                continue

            location = _resolve_repo_location(project)
            if not location:
                skipped += 1
                logger.warning(f"项目 {project.id} 无法解析 owner/仓库名，跳过")
                continue

            stats = _fetch_repo_stats(project.platform, *location)
            if stats is None:
                failed += 1
                continue

            stars, forks = stats
            if project.stars_count != stars or project.forks_count != forks:
                project.stars_count = stars
                project.forks_count = forks
                updated += 1

        db.commit()
        msg = f"项目仓库统计同步完成: 更新 {updated}, " f"失败 {failed}, 跳过 {skipped}"
        logger.info(msg)
        return msg
    except Exception as e:
        db.rollback()
        logger.error(f"项目仓库统计同步失败: {e}")
        return "项目仓库统计同步失败"
    finally:
        db.close()

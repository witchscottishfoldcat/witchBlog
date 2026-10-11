from fastapi import APIRouter

from app.api.v1 import (
    admin,
    ai,
    albums,
    anime_watchlist,
    auth,
    diaries,
    game_showcase,
    game_showcase_public,
    links,
    md_cache_simple,
    md_file_archive,
    md_files,
    music_libraries,
    music_public,
    music_tracks,
    projects,
    proxy,
    resource_links,
    scheduler_api,
    simple_about,
    site_config,
    site_stats,
    skills,
    sponsors,
    system_logs,
    test_exceptions,
    timelines,
    users,
)
from app.core.config import settings as _settings

api_router = APIRouter()

# api_router.include_router(texts.router, prefix="/texts", tags=["文本"])//废弃
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(md_files.router, prefix="/md-files", tags=["MD文件主页博客"])
api_router.include_router(diaries.router, prefix="/diaries", tags=["日记"])
api_router.include_router(timelines.router, prefix="/timelines", tags=["时间线"])
api_router.include_router(skills.router, prefix="/skills", tags=["技能"])
api_router.include_router(projects.router, prefix="/projects", tags=["项目展示"])
api_router.include_router(
    md_file_archive.router, prefix="/md-file-archive", tags=["MD文件归档"]
)
api_router.include_router(site_config.router, prefix="/site-config", tags=["站点配置"])
api_router.include_router(links.router, prefix="/links", tags=["友情链接"])
api_router.include_router(
    resource_links.router, prefix="/resource-links", tags=["其他个人网页链接"]
)
api_router.include_router(
    anime_watchlist.router, prefix="/anime-watchlist", tags=["追番追剧"]
)
api_router.include_router(sponsors.router, prefix="/sponsors", tags=["赞助鸣谢"])
api_router.include_router(
    music_libraries.router, prefix="/music-libraries", tags=["音乐库"]
)
api_router.include_router(music_tracks.router, prefix="/music-tracks", tags=["音乐曲目"])
api_router.include_router(music_public.router, prefix="/music", tags=["音乐馆前台"])
api_router.include_router(game_showcase.router, prefix="/game-showcase", tags=["游戏展示"])
api_router.include_router(game_showcase_public.router, prefix="/games", tags=["游戏展示前台"])
api_router.include_router(albums.router, prefix="/albums", tags=["相册"])
api_router.include_router(site_stats.router, prefix="/site-stats", tags=["站点统计"])
api_router.include_router(system_logs.router, prefix="/system-logs", tags=["系统日志"])
api_router.include_router(simple_about.router, prefix="/about", tags=["关于页面"])
# 启用代理路由
api_router.include_router(proxy.router, prefix="/proxy", tags=["代理服务"])
# AI服务路由
api_router.include_router(ai.router, prefix="/ai", tags=["AI服务"])
# 后台管理路由（仅超级管理员可访问）
api_router.include_router(admin.router, prefix="/admin", tags=["后台管理"])
# 定时任务管理路由
api_router.include_router(scheduler_api.router, prefix="/scheduler", tags=["定时任务"])


# MD缓存简化刷新路由
api_router.include_router(
    md_cache_simple.router, prefix="/md-cache-simple", tags=["MD缓存简化刷新"]
)
# 添加异常处理测试路由（仅开发/测试环境注册，避免生产暴露调试端点）

if _settings.ENVIRONMENT.lower() != "production":
    api_router.include_router(
        test_exceptions.router, prefix="/test-exceptions", tags=["异常处理测试"]
    )

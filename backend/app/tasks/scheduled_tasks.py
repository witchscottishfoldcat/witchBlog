"""
定时任务统一注册中心

所有定时任务在此注册。新增任务只需在 register_all_tasks() 中添加一行。
"""

from app.core.scheduler import TaskScheduler


def register_all_tasks(scheduler: TaskScheduler) -> None:
    """
    注册所有定时任务

    新增任务只需在这里添加一行 scheduler.add_job(...)
    """

    # ==================== MinIO ====================

    from app.tasks.minio_tasks import refresh_minio_urls

    scheduler.add_job(
        name="minio_url_refresh",
        func=refresh_minio_urls,
        trigger="interval",
        description="将 MinIO 文件 URL 刷新为稳定的代理 URL，清理历史遗留的预签名/直链地址",
        hours=1,
    )

    # ==================== Steam ====================

    from app.tasks.steam_tasks import sync_steam_games

    scheduler.add_job(
        name="steam_game_sync",
        func=sync_steam_games,
        trigger="cron",
        description="从 Steam 同步游戏数据（游玩时长等）",
        hour=3,
        minute=0,
    )

    # ==================== 项目模块 ====================

    from app.tasks.project_tasks import sync_project_repo_stats

    scheduler.add_job(
        name="project_stats_sync",
        func=sync_project_repo_stats,
        trigger="cron",
        description="从 GitHub / Gitee 更新项目模块仓库的星标数与复刻数",
        hour=4,
        minute=0,
    )

    # ==================== 在此添加新任务 ====================
    # scheduler.add_job(
    #     name="your_task_name",
    #     func=your_task_function,
    #     trigger="interval",  # 或 "cron"
    #     description="任务描述",
    #     hours=1,  # interval 参数
    # )

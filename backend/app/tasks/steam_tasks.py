"""
Steam 游戏同步定时任务

定期从 Steam 同步游戏数据（游玩时长等）。
"""

from app.core.unified_logging import get_logger

logger = get_logger(__name__)


async def sync_steam_games():
    """从 Steam 同步游戏数据"""
    from app.core.config import settings
    from app.core.database import SessionLocal
    from app.services.game_showcase_service import GameShowcaseService

    steam_id = settings.STEAM_DEFAULT_USER_ID
    if not steam_id or not settings.STEAM_API_KEY:
        logger.warning("Steam API Key 或默认用户 ID 未配置，跳过同步")
        return "未配置"

    db = SessionLocal()
    try:
        service = GameShowcaseService(db)
        result = await service.import_from_steam(
            steam_id=steam_id,
            import_all=False,  # 只同步有游玩时长的
            default_status="playing",
        )
        msg = (
            f"Steam 同步完成: 新增 {result['imported']}, "
            f"更新 {result['updated']}, 失败 {result['failed']}"
        )
        logger.info(msg)
        return msg
    except Exception as e:
        logger.error(f"Steam 游戏同步失败: {e}")
        raise
    finally:
        db.close()

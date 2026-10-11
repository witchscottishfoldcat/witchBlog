"""
游戏展示服务

提供游戏展示的业务逻辑：
- CRUD 操作
- 分页查询（按平台/分类/状态/标签过滤）
- Steam 批量导入
- 统计数据
"""

from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException
from app.core.unified_logging import get_logger
from app.models.game_showcase import GameShowcase
from app.schemas.game_showcase import GameShowcaseCreate, GameShowcaseUpdate

logger = get_logger(__name__)


class GameShowcaseService:
    """游戏展示服务类"""

    def __init__(self, db: Session):
        self.db = db

    # ==================== CRUD ====================

    def get_game(self, game_id: int) -> Optional[GameShowcase]:
        """获取单个游戏"""
        return self.db.query(GameShowcase).filter(GameShowcase.id == game_id).first()

    def get_game_by_steam_appid(self, steam_appid: str) -> Optional[GameShowcase]:
        """通过 Steam AppID 查找游戏"""
        return (
            self.db.query(GameShowcase)
            .filter(GameShowcase.steam_appid == steam_appid)
            .first()
        )

    def get_games(
        self,
        platform: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        tags: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
        is_r18: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "sort_order",
    ) -> List[GameShowcase]:
        """获取游戏列表"""
        query = self._build_filter_query(
            platform, category, status, tags, is_favorite, is_active, is_r18
        )
        query = self._apply_sort(query, sort_by)
        return query.offset(skip).limit(limit).all()

    def get_games_paginated(
        self,
        page: int = 1,
        size: int = 20,
        platform: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        tags: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
        is_r18: Optional[bool] = None,
        sort_by: str = "sort_order",
    ) -> Tuple[List[GameShowcase], int]:
        """分页获取游戏列表"""
        query = self._build_filter_query(
            platform, category, status, tags, is_favorite, is_active, is_r18
        )
        total = query.count()
        query = self._apply_sort(query, sort_by)
        items = query.offset((page - 1) * size).limit(size).all()
        return items, total

    def count_games(self, is_active: Optional[bool] = None) -> int:
        """统计游戏数量"""
        query = self.db.query(GameShowcase)
        if is_active is not None:
            query = query.filter(GameShowcase.is_active == is_active)
        return query.count()

    def create_game(self, game_in: GameShowcaseCreate) -> GameShowcase:
        """创建游戏"""
        try:
            # 检查 Steam AppID 是否重复
            if game_in.steam_appid:
                existing = self.get_game_by_steam_appid(game_in.steam_appid)
                if existing:
                    raise BadRequestException(
                        f"Steam AppID {game_in.steam_appid} 已存在 (游戏: {existing.title})"
                    )

            db_game = GameShowcase(**game_in.dict())
            self.db.add(db_game)
            self.db.commit()
            self.db.refresh(db_game)
            logger.info(f"创建游戏成功: {db_game.title}")
            return db_game
        except BadRequestException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建游戏失败: {e}")
            raise

    def update_game(
        self, game_id: int, game_update: GameShowcaseUpdate
    ) -> GameShowcase:
        """更新游戏"""
        game = self.get_game(game_id)
        if not game:
            raise NotFoundException(f"游戏不存在 (id={game_id})")

        update_data = game_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(game, key, value)

        try:
            self.db.commit()
            self.db.refresh(game)
            logger.info(f"更新游戏成功: {game.title}")
            return game
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新游戏失败: {e}")
            raise

    def delete_game(self, game_id: int) -> None:
        """删除游戏"""
        game = self.get_game(game_id)
        if not game:
            raise NotFoundException(f"游戏不存在 (id={game_id})")

        try:
            self.db.delete(game)
            self.db.commit()
            logger.info(f"删除游戏成功: {game.title}")
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除游戏失败: {e}")
            raise

    # ==================== Steam 导入 ====================

    async def import_from_steam(
        self,
        steam_id: str,
        import_all: bool = True,
        default_status: str = "want_play",
    ) -> Dict:
        """
        从 Steam 批量导入游戏

        Args:
            steam_id: Steam 64位用户ID
            import_all: 是否导入全部游戏（False 则只导入有游玩时长的）
            default_status: 导入时的默认状态

        Returns:
            导入报告
        """
        from app.services.steam_service import create_steam_service

        steam_svc = create_steam_service()
        result = {
            "total_found": 0,
            "imported": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0,
        }

        # 获取游戏库
        games = await steam_svc.get_owned_games(steam_id)
        result["total_found"] = len(games)

        if not games:
            logger.warning(f"Steam 用户 {steam_id} 的游戏库为空或不可见")
            return result

        # 过滤无游玩时长的游戏
        if not import_all:
            games = [g for g in games if g.get("playtime_forever", 0) > 0]

        logger.info(f"开始从 Steam 导入 {len(games)} 个游戏...")

        # 批量获取游戏详情
        appids = [str(g.get("appid")) for g in games]
        details_map = await steam_svc.get_games_details_batch(appids)

        # 一次性取回已有游戏，避免循环内逐条 SELECT（N+1）
        existing_map = {
            g.steam_appid: g
            for g in self.db.query(GameShowcase)
            .filter(GameShowcase.steam_appid.in_(appids))
            .all()
        }

        for game in games:
            appid = str(game.get("appid", ""))

            try:
                existing = existing_map.get(appid)
                details = details_map.get(appid, {})

                game_data = self._parse_steam_game(game, details, default_status)

                if existing:
                    # 更新游玩时长和基本信息
                    self._update_from_steam(existing, game_data)
                    result["updated"] += 1
                else:
                    db_game = GameShowcase(**game_data)
                    self.db.add(db_game)
                    result["imported"] += 1

            except Exception as e:
                logger.error(f"导入游戏失败 (appid={appid}): {e}")
                result["failed"] += 1

        try:
            self.db.commit()
            logger.info(
                f"Steam 导入完成: 新增 {result['imported']}, "
                f"更新 {result['updated']}, 失败 {result['failed']}"
            )
        except Exception as e:
            self.db.rollback()
            logger.error(f"提交导入数据失败: {e}")
            raise

        return result

    def _parse_steam_game(self, game: Dict, details: Dict, default_status: str) -> Dict:
        """解析 Steam 游戏数据为 GameShowcase 字段"""
        appid = str(game.get("appid", ""))
        play_time = game.get("playtime_forever", 0)

        # 根据游玩时长推断状态
        status = default_status
        if play_time > 0:
            status = "playing"

        # 从详情中提取信息
        genres = details.get("genres", [])
        category = self._map_genre_to_category(genres)

        return {
            "title": game.get("name", details.get("name", f"Unknown ({appid})")),
            "description": details.get("description", ""),
            "cover_image_url": details.get(
                "header_image",
                f"https://shared.akamai.steamstatic.com"
                f"/store_item_assets/steam/apps/{appid}/header.jpg",
            ),
            "steam_appid": appid,
            "steam_url": f"https://store.steampowered.com/app/{appid}",
            "platform": "steam",
            "category": category,
            "tags": ", ".join(genres[:5]) if genres else None,
            "developer": ", ".join(details.get("developers", [])),
            "publisher": ", ".join(details.get("publishers", [])),
            "status": status,
            "play_time": play_time,
            "release_date": details.get("release_date", ""),
            "is_active": True,
            "is_r18": self._detect_r18_from_descriptors(
                details.get("content_descriptors") or {}
            ),
        }

    # Steam 内容描述符 ID：2=频繁裸露或性内容，3=仅成人性内容
    _R18_DESCRIPTOR_IDS = {2, 3}
    # 描述符备注中的成人内容关键词（Steam 部分游戏只写在 notes 里）
    _R18_NOTES_KEYWORDS = ("adult only", "explicit sexual")

    @classmethod
    def _detect_r18_from_descriptors(cls, content_descriptors: Dict) -> bool:
        """根据 Steam content_descriptors 判断是否 R18

        - ids 含 2/3（频繁裸露或性内容 / 仅成人性内容）→ 判定 R18
        - ids 不含但 notes 明确提到 adult only / explicit sexual → 判定 R18
        - 只申报 1（部分裸露）或暴力描述符（4/5）的擦边游戏不判定，避免误伤
        """
        ids = set(content_descriptors.get("ids") or [])
        if ids & cls._R18_DESCRIPTOR_IDS:
            return True
        notes = (content_descriptors.get("notes") or "").lower()
        return any(kw in notes for kw in cls._R18_NOTES_KEYWORDS)

    @staticmethod
    def _update_from_steam(existing: GameShowcase, game_data: Dict) -> None:
        """用 Steam 数据更新已有游戏记录（只更新游玩时长和基本信息）"""
        existing.play_time = game_data.get("play_time", existing.play_time)
        # 更新封面和简介（如果原来没有的话）
        if not existing.cover_image_url:
            existing.cover_image_url = game_data.get("cover_image_url")
        if not existing.description:
            existing.description = game_data.get("description")
        if not existing.developer:
            existing.developer = game_data.get("developer")
        if not existing.publisher:
            existing.publisher = game_data.get("publisher")

    @staticmethod
    def _map_genre_to_category(genres: List[str]) -> str:
        """将 Steam 类型标签映射到简化分类"""
        genre_lower = [g.lower() for g in genres]
        genre_map = {
            "rpg": ["rpg", "角色扮演"],
            "fps": ["fps", "第一人称射击", "first-person shooter"],
            "strategy": ["策略", "strategy", "即时战略", "回合制策略"],
            "simulation": ["模拟", "simulation", "经营"],
            "indie": ["独立", "indie"],
            "adventure": ["冒险", "adventure", "动作冒险"],
        }
        for cat, keywords in genre_map.items():
            for kw in keywords:
                if any(kw in g for g in genre_lower):
                    return cat
        return "other"

    # ==================== 统计 ====================

    def get_status_stats(
        self, is_active: Optional[bool] = True, is_r18: Optional[bool] = None
    ) -> List[Dict]:
        """按状态统计"""
        query = self.db.query(
            GameShowcase.status, func.count(GameShowcase.id)
        ).group_by(GameShowcase.status)
        if is_active is not None:
            query = query.filter(GameShowcase.is_active == is_active)
        if is_r18 is not None:
            query = query.filter(GameShowcase.is_r18 == is_r18)
        return [{"status": s, "count": c} for s, c in query.all()]

    def get_platform_stats(
        self, is_active: Optional[bool] = True, is_r18: Optional[bool] = None
    ) -> List[Dict]:
        """按平台统计"""
        query = self.db.query(
            GameShowcase.platform, func.count(GameShowcase.id)
        ).group_by(GameShowcase.platform)
        if is_active is not None:
            query = query.filter(GameShowcase.is_active == is_active)
        if is_r18 is not None:
            query = query.filter(GameShowcase.is_r18 == is_r18)
        return [{"platform": p, "count": c} for p, c in query.all()]

    def get_category_stats(
        self, is_active: Optional[bool] = True, is_r18: Optional[bool] = None
    ) -> List[Dict]:
        """按分类统计"""
        query = self.db.query(
            GameShowcase.category, func.count(GameShowcase.id)
        ).group_by(GameShowcase.category)
        if is_active is not None:
            query = query.filter(GameShowcase.is_active == is_active)
        if is_r18 is not None:
            query = query.filter(GameShowcase.is_r18 == is_r18)
        return [{"category": c, "count": cnt} for c, cnt in query.all()]

    def get_overall_stats(self, is_r18: Optional[bool] = None) -> Dict:
        """获取总体统计（is_r18=False 时排除 R18 内容，供公开 API 使用）"""
        base_filters: list[Any] = [GameShowcase.is_active.is_(True)]
        if is_r18 is not None:
            base_filters.append(GameShowcase.is_r18 == is_r18)
        total = (
            self.db.query(func.count(GameShowcase.id)).filter(*base_filters).scalar()
            or 0
        )
        total_time = (
            self.db.query(func.sum(GameShowcase.play_time))
            .filter(*base_filters)
            .scalar()
            or 0
        )
        fav_count = (
            self.db.query(func.count(GameShowcase.id))
            .filter(GameShowcase.is_favorite.is_(True), *base_filters)
            .scalar()
        )
        avg_rating = (
            self.db.query(func.avg(GameShowcase.rating))
            .filter(GameShowcase.rating.isnot(None), *base_filters)
            .scalar()
        )

        return {
            "total_games": total,
            "total_play_time": total_time,
            "total_play_time_hours": round(total_time / 60, 1),
            "favorite_count": fav_count or 0,
            "average_rating": round(avg_rating, 1) if avg_rating else None,
            "status_stats": self.get_status_stats(is_r18=is_r18),
            "platform_stats": self.get_platform_stats(is_r18=is_r18),
            "category_stats": self.get_category_stats(is_r18=is_r18),
        }

    def get_random_games(
        self, count: int = 5, is_r18: Optional[bool] = None
    ) -> List[GameShowcase]:
        """随机获取游戏（is_r18=False 时排除 R18 内容，供公开 API 使用）"""
        query = self.db.query(GameShowcase).filter(GameShowcase.is_active.is_(True))
        if is_r18 is not None:
            query = query.filter(GameShowcase.is_r18 == is_r18)
        return query.order_by(func.random()).limit(count).all()

    # ==================== 私有方法 ====================

    def _build_filter_query(
        self,
        platform: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        tags: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        is_active: Optional[bool] = None,
        is_r18: Optional[bool] = None,
    ):
        """构建过滤查询"""
        query = self.db.query(GameShowcase)

        if platform:
            query = query.filter(GameShowcase.platform == platform)
        if category:
            query = query.filter(GameShowcase.category == category)
        if status:
            query = query.filter(GameShowcase.status == status)
        if is_favorite is not None:
            query = query.filter(GameShowcase.is_favorite == is_favorite)
        if is_active is not None:
            query = query.filter(GameShowcase.is_active == is_active)
        if is_r18 is not None:
            query = query.filter(GameShowcase.is_r18 == is_r18)
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            tag_filters = [GameShowcase.tags.contains(t) for t in tag_list]
            query = query.filter(or_(*tag_filters))

        return query

    @staticmethod
    def _apply_sort(query, sort_by: str):
        """应用排序"""
        sort_map = {
            "sort_order": GameShowcase.sort_order,
            "created_at": desc(GameShowcase.created_at),
            "title": GameShowcase.title,
            "play_time": desc(GameShowcase.play_time),
            "rating": desc(GameShowcase.rating),
        }
        order = sort_map.get(sort_by, GameShowcase.sort_order)
        return query.order_by(order)

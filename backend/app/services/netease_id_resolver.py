"""
网易云歌曲 ID 解析器

通过歌曲名和歌手名搜索网易云 API，自动匹配真实的 netease_id。
用于：
1. 手动创建歌曲时自动补全 netease_id
2. 批量修复数据库中无效的 netease_id
"""

import asyncio
import re
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.unified_logging import get_logger
from app.models.music import MusicTrack
from app.services.netease_service import netease_service

logger = get_logger(__name__)

# 批量操作时每次请求之间的间隔（秒），避免请求过快
BATCH_REQUEST_DELAY = 0.5


def is_valid_netease_id(netease_id: str) -> bool:
    """
    判断 netease_id 是否为有效的网易云歌曲 ID（纯数字）

    Args:
        netease_id: 待验证的 ID

    Returns:
        True 表示有效（纯数字），False 表示无效
    """
    if not netease_id:
        return False
    return bool(re.match(r"^\d+$", netease_id.strip()))


def _calculate_similarity(str1: str, str2: str) -> float:
    """
    计算两个字符串的相似度（简单的字符级别比较）

    Args:
        str1: 字符串1
        str2: 字符串2

    Returns:
        0.0 ~ 1.0 之间的相似度
    """
    s1 = str1.strip().lower()
    s2 = str2.strip().lower()

    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0

    # 一个包含另一个
    if s1 in s2 or s2 in s1:
        return 0.8

    # 交集字符占比
    set1 = set(s1)
    set2 = set(s2)
    intersection = set1 & set2
    union = set1 | set2
    return len(intersection) / len(union) if union else 0.0


def _find_best_match(
    title: str, artist: str, search_results: List[Dict]
) -> Optional[str]:
    """
    从搜索结果中找到最佳匹配的歌曲 ID

    Args:
        title: 目标歌曲名
        artist: 目标歌手名
        search_results: 网易云搜索返回的歌曲列表

    Returns:
        最佳匹配的 netease_id，未找到则返回 None
    """
    if not search_results:
        return None

    best_score = 0.0
    best_id = None

    for song in search_results:
        song_name = song.get("name", "")
        song_artists = song.get("ar", [])
        artist_names = [a.get("name", "") for a in song_artists]

        # 计算歌曲名相似度
        title_sim = _calculate_similarity(title, song_name)

        # 计算歌手名相似度（取最高匹配）
        artist_sim = 0.0
        for a_name in artist_names:
            sim = _calculate_similarity(artist, a_name)
            artist_sim = max(artist_sim, sim)

        # 综合得分：歌曲名权重更高
        score = title_sim * 0.6 + artist_sim * 0.4

        if score > best_score:
            best_score = score
            best_id = str(song.get("id", ""))

    # 阈值：至少达到 0.6 才算匹配成功
    if best_score >= 0.6 and best_id:
        logger.debug(
            f"匹配成功: '{title} - {artist}' -> ID: {best_id} (得分: {best_score:.2f})"
        )
        return best_id

    logger.debug(f"匹配失败: '{title} - {artist}' (最高得分: {best_score:.2f})")
    return None


async def resolve_single(title: str, artist: str) -> Optional[str]:
    """
    搜索网易云，返回最佳匹配的歌曲 netease_id

    Args:
        title: 歌曲名
        artist: 歌手名

    Returns:
        匹配到的 netease_id，未匹配则返回 None
    """
    try:
        keywords = f"{title} {artist}"
        data = await netease_service.search_songs(keywords, limit=10)

        songs = data.get("result", {}).get("songs", [])
        if not songs:
            logger.info(f"搜索无结果: '{keywords}'")
            return None

        return _find_best_match(title, artist, songs)

    except Exception as e:
        logger.error(f"搜索失败 '{title} - {artist}': {e}")
        return None


def get_invalid_tracks(db: Session) -> List[MusicTrack]:
    """
    查询数据库中 netease_id 无效（非纯数字）的所有歌曲

    Args:
        db: 数据库会话

    Returns:
        无效 netease_id 的歌曲列表
    """
    all_tracks = db.query(MusicTrack).filter(MusicTrack.is_active.is_(True)).all()

    return [t for t in all_tracks if not is_valid_netease_id(t.netease_id)]


async def backfill_database(
    db: Session, dry_run: bool = False
) -> Dict[str, List[Dict]]:
    """
    批量修复数据库中无效 netease_id 的歌曲

    Args:
        db: 数据库会话
        dry_run: 如果 True，只输出将要修复的内容但不实际修改

    Returns:
        修复报告，包含 success / failed / skipped 列表
    """
    invalid_tracks = get_invalid_tracks(db)

    if not invalid_tracks:
        logger.info("所有歌曲的 netease_id 均有效，无需修复")
        return {"success": [], "failed": [], "skipped": []}

    logger.info(f"发现 {len(invalid_tracks)} 首歌曲的 netease_id 无效，开始修复...")

    result: Dict[str, List[Dict]] = {
        "success": [],
        "failed": [],
        "skipped": [],
    }

    for track in invalid_tracks:
        track_info = {
            "id": track.id,
            "title": track.title,
            "artist": track.artist,
            "old_netease_id": track.netease_id,
        }

        try:
            new_id = await resolve_single(track.title, track.artist)

            if not new_id:
                track_info["reason"] = "搜索无匹配结果"
                result["failed"].append(track_info)
                logger.warning(f"[失败] {track.title} - {track.artist}: 无匹配")
                continue

            # 检查新 ID 是否已被其他歌曲使用
            existing = (
                db.query(MusicTrack)
                .filter(
                    MusicTrack.netease_id == new_id,
                    MusicTrack.id != track.id,
                )
                .first()
            )

            if existing:
                track_info["reason"] = f"ID {new_id} 已被歌曲 '{existing.title}' 使用"
                result["skipped"].append(track_info)
                logger.warning(
                    f"[跳过] {track.title}: ID {new_id} 已被 '{existing.title}' 使用"
                )
                continue

            track_info["new_netease_id"] = new_id

            if not dry_run:
                track.netease_id = new_id
                track.netease_url = f"https://music.163.com/song?id={new_id}"

            result["success"].append(track_info)
            logger.info(
                f"[{'预览' if dry_run else '成功'}] {track.title} - {track.artist}: "
                f"{track_info['old_netease_id']} -> {new_id}"
            )

        except Exception as e:
            track_info["reason"] = str(e)
            result["failed"].append(track_info)
            logger.error(f"[错误] {track.title}: {e}")

        # 限速
        await asyncio.sleep(BATCH_REQUEST_DELAY)

    if not dry_run:
        try:
            db.commit()
            logger.info(
                f"修复完成: 成功 {len(result['success'])}, "
                f"失败 {len(result['failed'])}, "
                f"跳过 {len(result['skipped'])}"
            )
        except Exception as e:
            db.rollback()
            logger.error(f"提交修复结果失败: {e}")
            raise

    return result

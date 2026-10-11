import os

import pytest

if not os.environ.get("WITCHCAT_LIVE_TESTS"):
    pytest.skip(
        "需要运行中的本地服务：启动服务并设置 WITCHCAT_LIVE_TESTS=1 后运行",
        allow_module_level=True,
    )

"""
音乐馆前台展示 API 测试脚本
测试所有前台只读接口端点
"""

from datetime import datetime

import requests

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"
MUSIC_API = f"{API_V1}/music"


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RESET = "\033[0m"


def ok(msg: str):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")


def fail(msg: str):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")


def info(msg: str):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")


def warn(msg: str):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.RESET}")


def _get(url: str, params: dict | None = None, timeout: int = 10):
    """发送 GET 请求并返回 (status_code, json_data)"""
    resp = requests.get(url, params=params, timeout=timeout)
    return resp.status_code, resp.json() if resp.status_code == 200 else resp.text


# ==================== 测试用例 ====================


def test_overview():
    """测试音乐馆首页概览"""
    print("\n" + "=" * 60)
    print("1. 测试音乐馆首页概览 GET /music/")
    print("=" * 60)

    code, data = _get(f"{MUSIC_API}/")
    if code != 200:
        fail(f"状态码: {code}")
        return False

    required_keys = {"stats", "playlists", "recent_tracks"}
    if not required_keys.issubset(data.keys()):
        fail(f"缺少字段: {required_keys - data.keys()}")
        return False

    stats = data["stats"]
    ok("概览获取成功")
    info(f"  歌单数: {stats.get('total_playlists')}")
    info(f"  歌曲数: {stats.get('total_tracks')}")
    info(f"  播放次数: {stats.get('total_play_count')}")
    info(f"  公开歌单: {len(data['playlists'])} 个")
    info(f"  最近歌曲: {len(data['recent_tracks'])} 首")
    return True


def test_playlists():
    """测试公开歌单列表"""
    print("\n" + "=" * 60)
    print("2. 测试公开歌单列表 GET /music/playlists")
    print("=" * 60)

    code, data = _get(f"{MUSIC_API}/playlists", {"page": 1, "size": 10})
    if code != 200:
        fail(f"状态码: {code}")
        return False

    required_keys = {"items", "total", "page", "size", "pages"}
    if not required_keys.issubset(data.keys()):
        fail(f"缺少字段: {required_keys - data.keys()}")
        return False

    ok(f"歌单列表获取成功 - 共 {data['total']} 个")
    for item in data["items"][:3]:
        info(f"  - [{item['id']}] {item['title']} ({item['track_count']}首)")
    return True


def test_playlist_detail():
    """测试歌单详情"""
    print("\n" + "=" * 60)
    print("3. 测试歌单详情 GET /music/playlists/{id}")
    print("=" * 60)

    # 先获取一个歌单 ID
    _, list_data = _get(f"{MUSIC_API}/playlists", {"page": 1, "size": 1})
    if not isinstance(list_data, dict) or not list_data.get("items"):
        warn("没有公开歌单，跳过")
        return True

    playlist_id = list_data["items"][0]["id"]
    code, data = _get(f"{MUSIC_API}/playlists/{playlist_id}")
    if code != 200:
        fail(f"状态码: {code}")
        return False

    ok(f"歌单详情获取成功 - {data['title']}")
    info(f"  歌曲数: {data.get('total_tracks')}")
    info(f"  总时长: {data.get('total_duration', 0) // 60} 分钟")
    info(f"  浏览量: {data.get('view_count')}")
    info(f"  歌曲列表: {len(data.get('tracks', []))} 首")
    return True


def test_playlist_tracks():
    """测试歌单内歌曲列表"""
    print("\n" + "=" * 60)
    print("4. 测试歌单内歌曲列表 GET /music/playlists/{id}/tracks")
    print("=" * 60)

    _, list_data = _get(f"{MUSIC_API}/playlists", {"page": 1, "size": 1})
    if not isinstance(list_data, dict) or not list_data.get("items"):
        warn("没有公开歌单，跳过")
        return True

    playlist_id = list_data["items"][0]["id"]
    code, data = _get(
        f"{MUSIC_API}/playlists/{playlist_id}/tracks",
        {"page": 1, "size": 5},
    )
    if code != 200:
        fail(f"状态码: {code}")
        return False

    ok(f"歌曲列表获取成功 - 共 {data['total']} 首")
    for t in data["items"][:3]:
        info(f"  - {t['title']} - {t['artist']}")
    return True


def test_track_detail():
    """测试歌曲详情"""
    print("\n" + "=" * 60)
    print("5. 测试歌曲详情 GET /music/tracks/{id}")
    print("=" * 60)

    _, list_data = _get(f"{MUSIC_API}/playlists", {"page": 1, "size": 1})
    if not isinstance(list_data, dict) or not list_data.get("items"):
        warn("没有公开歌单，跳过")
        return True

    playlist_id = list_data["items"][0]["id"]
    _, tracks = _get(f"{MUSIC_API}/playlists/{playlist_id}/tracks", {"size": 1})
    if not isinstance(tracks, dict) or not tracks.get("items"):
        warn("没有歌曲，跳过")
        return True

    track_id = tracks["items"][0]["id"]
    code, data = _get(f"{MUSIC_API}/tracks/{track_id}")
    if code != 200:
        fail(f"状态码: {code}")
        return False

    ok(f"歌曲详情获取成功 - {data['title']}")
    info(f"  艺术家: {data['artist']}")
    info(f"  分类: {data.get('category')}")
    info(f"  评分: {data.get('rating')}")
    return True


def test_player_code():
    """测试播放器代码"""
    print("\n" + "=" * 60)
    print("6. 测试播放器代码 GET /music/tracks/{id}/player")
    print("=" * 60)

    _, list_data = _get(f"{MUSIC_API}/playlists", {"page": 1, "size": 1})
    if not isinstance(list_data, dict) or not list_data.get("items"):
        warn("没有公开歌单，跳过")
        return True

    playlist_id = list_data["items"][0]["id"]
    _, tracks = _get(f"{MUSIC_API}/playlists/{playlist_id}/tracks", {"size": 1})
    if not isinstance(tracks, dict) or not tracks.get("items"):
        warn("没有歌曲，跳过")
        return True

    track_id = tracks["items"][0]["id"]
    code, data = _get(f"{MUSIC_API}/tracks/{track_id}/player")
    if code != 200:
        fail(f"状态码: {code}")
        return False

    iframe = data.get("iframe_code", "")
    ok(f"播放器代码获取成功 ({len(iframe)} 字符)")
    if iframe:
        info(f"  预览: {iframe[:60]}...")
    return True


def test_lyrics():
    """测试歌词"""
    print("\n" + "=" * 60)
    print("7. 测试歌词 GET /music/tracks/{id}/lyrics")
    print("=" * 60)

    _, list_data = _get(f"{MUSIC_API}/playlists", {"page": 1, "size": 1})
    if not isinstance(list_data, dict) or not list_data.get("items"):
        warn("没有公开歌单，跳过")
        return True

    playlist_id = list_data["items"][0]["id"]
    _, tracks = _get(f"{MUSIC_API}/playlists/{playlist_id}/tracks", {"size": 1})
    if not isinstance(tracks, dict) or not tracks.get("items"):
        warn("没有歌曲，跳过")
        return True

    track_id = tracks["items"][0]["id"]
    code, data = _get(f"{MUSIC_API}/tracks/{track_id}/lyrics")
    if code != 200:
        fail(f"状态码: {code}")
        return False

    ok(f"歌词接口成功 - {data.get('message')}")
    return True


def test_random_tracks():
    """测试随机推荐"""
    print("\n" + "=" * 60)
    print("8. 测试随机推荐 GET /music/tracks/random")
    print("=" * 60)

    code, data = _get(f"{MUSIC_API}/tracks/random", {"count": 3})
    if code != 200:
        fail(f"状态码: {code}")
        return False

    ok(f"随机推荐成功 - {len(data)} 首")
    for t in data:
        info(f"  - {t['title']} - {t['artist']}")
    return True


def test_stats():
    """测试统计数据"""
    print("\n" + "=" * 60)
    print("9. 测试统计数据 GET /music/stats")
    print("=" * 60)

    code, data = _get(f"{MUSIC_API}/stats")
    if code != 200:
        fail(f"状态码: {code}")
        return False

    ok("统计数据获取成功")
    info(f"  歌单数: {data['total_playlists']}")
    info(f"  歌曲数: {data['total_tracks']}")
    info(f"  播放次数: {data['total_play_count']}")
    info(f"  收藏数: {data['favorite_count']}")
    info(f"  分类: {len(data.get('category_stats', []))} 个")
    return True


def test_nonexistent_playlist():
    """测试不存在的歌单"""
    print("\n" + "=" * 60)
    print("10. 测试不存在的歌单返回404")
    print("=" * 60)

    code, _ = _get(f"{MUSIC_API}/playlists/99999")
    if code == 404:
        ok("正确返回404")
        return True
    else:
        fail(f"期望404，实际: {code}")
        return False


# ==================== 主函数 ====================


def run_all_tests():
    print("\n" + "=" * 60)
    print("  🎵 音乐馆前台展示 API 测试")
    print("=" * 60)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"地址: {MUSIC_API}")

    # 先检查服务器
    try:
        requests.get(f"{MUSIC_API}/stats", timeout=3)
    except requests.exceptions.ConnectionError:
        fail("无法连接到服务器，请先启动: python main.py")
        return

    tests = [
        test_overview,
        test_playlists,
        test_playlist_detail,
        test_playlist_tracks,
        test_track_detail,
        test_player_code,
        test_lyrics,
        test_random_tracks,
        test_stats,
        test_nonexistent_playlist,
    ]

    passed = failed = 0
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            fail(f"{test.__name__} 异常: {e}")
            failed += 1

    print("\n" + "=" * 60)
    print("  📊 测试结果汇总")
    print("=" * 60)
    print(f"{Colors.GREEN}✅ 通过: {passed}{Colors.RESET}")
    print(f"{Colors.RED}❌ 失败: {failed}{Colors.RESET}")

    total = passed + failed
    rate = (passed / total * 100) if total > 0 else 0
    print(f"\n总计: {total} 个测试, 通过率: {rate:.1f}%")

    if failed == 0:
        print(f"\n{Colors.GREEN}🎉 所有测试通过！{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}⚠️  有 {failed} 个测试失败{Colors.RESET}")


if __name__ == "__main__":
    run_all_tests()

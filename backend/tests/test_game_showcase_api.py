import os

import pytest

if not os.environ.get("WITCHCAT_LIVE_TESTS"):
    pytest.skip(
        "需要运行中的本地服务：启动服务并设置 WITCHCAT_LIVE_TESTS=1 后运行",
        allow_module_level=True,
    )

"""
游戏展示 API 测试脚本

测试内容：
1. CRUD 操作
2. Steam 导入
3. 前台展示接口
4. 统计数据
"""

from datetime import datetime

import requests

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"
ADMIN_API = f"{API_V1}/game-showcase"
PUBLIC_API = f"{API_V1}/games"

STEAM_ID = os.getenv("STEAM_DEFAULT_USER_ID", "").strip()


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RESET = "\033[0m"


def ok(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")


def fail(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")


def info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")


def warn(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.RESET}")


# ==================== 测试用例 ====================


def test_create_game():
    """测试手动创建游戏"""
    print("\n" + "=" * 60)
    print("1. 测试手动创建游戏")
    print("=" * 60)

    data = {
        "title": f"测试游戏_{datetime.now().strftime('%H%M%S')}",
        "description": "这是一个测试游戏",
        "platform": "pc",
        "category": "rpg",
        "status": "playing",
        "play_time": 120,
        "rating": 8.5,
        "review": "很好玩的游戏",
        "tags": "测试,RPG",
    }

    resp = requests.post(f"{ADMIN_API}/", json=data, timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        ok(f"创建成功: {result['title']} (id={result['id']})")
        info(f"  平台: {result['platform']}, 分类: {result['category']}")
        return result["id"]
    else:
        fail(f"创建失败: {resp.status_code} - {resp.text}")
        return None


def test_get_game(game_id):
    """测试获取游戏详情"""
    print("\n" + "=" * 60)
    print("2. 测试获取游戏详情")
    print("=" * 60)

    if not game_id:
        warn("跳过（无游戏ID）")
        return False

    resp = requests.get(f"{ADMIN_API}/{game_id}", timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        ok(f"获取成功: {result['title']}")
        info(f"  评分: {result.get('rating')}, 时长: {result.get('play_time')}分钟")
        return True
    else:
        fail(f"获取失败: {resp.status_code}")
        return False


def test_update_game(game_id):
    """测试更新游戏"""
    print("\n" + "=" * 60)
    print("3. 测试更新游戏")
    print("=" * 60)

    if not game_id:
        warn("跳过")
        return False

    data = {"rating": 9.0, "status": "completed", "review": "非常棒！"}
    resp = requests.put(f"{ADMIN_API}/{game_id}", json=data, timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        ok(f"更新成功: 评分={result['rating']}, 状态={result['status']}")
        return True
    else:
        fail(f"更新失败: {resp.status_code}")
        return False


def test_game_list():
    """测试游戏列表"""
    print("\n" + "=" * 60)
    print("4. 测试游戏列表")
    print("=" * 60)

    resp = requests.get(f"{ADMIN_API}/list", params={"page": 1, "size": 5}, timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        ok(f"列表获取成功 - 共 {result['total']} 个游戏")
        for item in result["items"][:3]:
            info(
                f"  - {item['title']} ({item['platform']}) - {item.get('play_time', 0) // 60}h"  # noqa: E501
            )
        return True
    else:
        fail(f"列表失败: {resp.status_code}")
        return False


def test_steam_import():
    """测试 Steam 导入"""
    if not STEAM_ID:
        warn("未配置 STEAM_DEFAULT_USER_ID，跳过 Steam 导入")
        return None
    print("\n" + "=" * 60)
    print("5. 测试 Steam 导入（核心功能）")
    print("=" * 60)

    data = {
        "steam_id": STEAM_ID,
        "import_all": True,
        "default_status": "want_play",
    }

    info(f"正在从 Steam 导入游戏... (Steam ID: {STEAM_ID})")
    info("这可能需要 1-2 分钟（因为要逐个获取游戏详情）...")

    try:
        resp = requests.post(f"{ADMIN_API}/import-from-steam", json=data, timeout=300)
        if resp.status_code == 200:
            result = resp.json()
            ok("Steam 导入成功!")
            info(f"  Steam 库中总数: {result['total_found']}")
            info(f"  新导入: {result['imported']}")
            info(f"  已更新: {result['updated']}")
            info(f"  跳过: {result['skipped']}")
            info(f"  失败: {result['failed']}")
            info(f"  消息: {result['message']}")
            return True
        else:
            fail(f"导入失败: {resp.status_code} - {resp.text[:200]}")
            return False
    except requests.exceptions.Timeout:
        warn("请求超时，游戏数量较多，请耐心等待")
        return False


def test_stats():
    """测试统计数据"""
    print("\n" + "=" * 60)
    print("6. 测试统计数据")
    print("=" * 60)

    resp = requests.get(f"{ADMIN_API}/stats", timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        ok("统计获取成功")
        info(f"  总游戏数: {result['total_games']}")
        info(f"  总游玩时长: {result['total_play_time_hours']} 小时")
        info(f"  收藏数: {result['favorite_count']}")
        info(f"  平均评分: {result.get('average_rating', 'N/A')}")
        if result.get("platform_stats"):
            info("  平台分布:")
            for s in result["platform_stats"]:
                info(f"    {s['platform']}: {s['count']}个")
        if result.get("status_stats"):
            info("  状态分布:")
            for s in result["status_stats"]:
                info(f"    {s['status']}: {s['count']}个")
        return True
    else:
        fail(f"统计失败: {resp.status_code}")
        return False


def test_public_overview():
    """测试前台概览"""
    print("\n" + "=" * 60)
    print("7. 测试前台概览")
    print("=" * 60)

    resp = requests.get(f"{PUBLIC_API}/", timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        ok("前台概览获取成功")
        stats = result.get("stats", {})
        info(f"  总游戏数: {stats.get('total_games')}")
        info(f"  最近添加: {len(result.get('recent_games', []))} 个")
        info(f"  正在玩: {len(result.get('playing_games', []))} 个")
        info(f"  收藏: {len(result.get('favorite_games', []))} 个")
        return True
    else:
        fail(f"前台概览失败: {resp.status_code}")
        return False


def test_public_list():
    """测试前台列表"""
    print("\n" + "=" * 60)
    print("8. 测试前台游戏列表")
    print("=" * 60)

    resp = requests.get(f"{PUBLIC_API}/list", params={"page": 1, "size": 5}, timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        ok(f"前台列表获取成功 - 共 {result['total']} 个游戏")
        for item in result["items"][:5]:
            hours = item.get("play_time", 0) // 60
            info(f"  - {item['title']} [{item['platform']}] {hours}h")
        return True
    else:
        fail(f"前台列表失败: {resp.status_code}")
        return False


def test_random_games():
    """测试随机推荐"""
    print("\n" + "=" * 60)
    print("9. 测试随机推荐")
    print("=" * 60)

    resp = requests.get(f"{PUBLIC_API}/random", params={"count": 3}, timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        ok(f"随机推荐成功 - {len(result)} 个游戏")
        for item in result:
            info(f"  - {item['title']} ({item['platform']})")
        return True
    else:
        fail(f"随机推荐失败: {resp.status_code}")
        return False


def test_delete_game(game_id):
    """测试删除游戏"""
    print("\n" + "=" * 60)
    print("10. 测试删除游戏")
    print("=" * 60)

    if not game_id:
        warn("跳过")
        return False

    resp = requests.delete(f"{ADMIN_API}/{game_id}", timeout=10)
    if resp.status_code == 200:
        ok(f"删除成功 (id={game_id})")
        return True
    else:
        fail(f"删除失败: {resp.status_code}")
        return False


# ==================== 主函数 ====================


def run_all_tests():
    print("\n" + "=" * 60)
    print("  🎮 游戏展示 API 测试")
    print("=" * 60)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"后台: {ADMIN_API}")
    print(f"前台: {PUBLIC_API}")

    # 检查服务器
    try:
        requests.get(f"{ADMIN_API}/stats", timeout=3)
    except requests.exceptions.ConnectionError:
        fail("无法连接到服务器，请先启动: python main.py")
        return

    passed = failed = skipped = 0

    # CRUD 测试
    game_id = test_create_game()
    if game_id:
        passed += 1
    else:
        failed += 1

    for test_fn in [
        lambda: test_get_game(game_id),
        lambda: test_update_game(game_id),
        lambda: test_game_list(),
        lambda: test_steam_import(),
        lambda: test_stats(),
        lambda: test_public_overview(),
        lambda: test_public_list(),
        lambda: test_random_games(),
        lambda: test_delete_game(game_id),
    ]:
        try:
            result = test_fn()
            if result is None:
                skipped += 1
            elif result:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            fail(f"测试异常: {e}")
            failed += 1

    print("\n" + "=" * 60)
    print("  📊 测试结果汇总")
    print("=" * 60)
    print(f"{Colors.GREEN}✅ 通过: {passed}{Colors.RESET}")
    print(f"{Colors.RED}❌ 失败: {failed}{Colors.RESET}")
    print(f"{Colors.YELLOW}⚠️ 跳过: {skipped}{Colors.RESET}")
    total = passed + failed
    rate = (passed / total * 100) if total > 0 else 0
    print(f"\n总计: {total} 个测试, 通过率: {rate:.1f}%")

    if failed == 0:
        print(f"\n{Colors.GREEN}🎉 所有测试通过！{Colors.RESET}")


if __name__ == "__main__":
    run_all_tests()

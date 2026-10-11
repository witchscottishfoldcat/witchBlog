"""
Steam API 连通性测试脚本

测试内容：
1. Steam Store API（不需要 Key）—— 获取游戏详情
2. Steam Web API（需要 Key）—— 验证 Key 有效性
3. GetOwnedGames —— 获取用户游戏库（需要 Key + Steam ID）
4. ResolveVanityURL —— 通过自定义 URL 解析 Steam ID
"""

import os
import sys

import requests

STEAM_API_KEY = os.environ.get("STEAM_API_KEY", "")

# ==================== 颜色输出 ====================


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


def test_store_api():
    """测试 Steam Store API（不需要 Key）"""
    print("\n" + "=" * 60)
    print("1. 测试 Steam Store API（获取游戏详情）")
    print("=" * 60)

    # 用《Elden Ring》(appid=1245620) 做测试
    appid = 1245620
    url = f"https://store.steampowered.com/api/appdetails?appids={appid}&l=schinese"

    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code != 200:
            fail(f"HTTP 状态码: {resp.status_code}")
            return False

        data = resp.json()
        game_data = data.get(str(appid), {})

        if not game_data.get("success"):
            fail("API 返回 success=false")
            return False

        game = game_data.get("data", {})
        ok("Store API 连通成功!")
        info(f"  游戏名: {game.get('name')}")
        info(f"  类型: {game.get('type')}")
        info(f"  开发商: {game.get('developers', [])}")
        info(f"  发行商: {game.get('publishers', [])}")
        info(f"  简介: {game.get('short_description', '')[:80]}...")
        info(f"  封面: {game.get('header_image', '')[:60]}...")

        # 显示分类
        genres = [g.get("description") for g in game.get("genres", [])]
        info(f"  类型标签: {', '.join(genres)}")

        # 显示价格
        price = game.get("price_overview", {})
        if price:
            info(f"  价格: {price.get('final_formatted', 'N/A')}")

        return True

    except requests.exceptions.Timeout:
        fail("请求超时（可能需要代理）")
        return False
    except Exception as e:
        fail(f"请求失败: {e}")
        return False


def test_api_key_validity():
    """测试 Steam Web API Key 是否有效"""
    print("\n" + "=" * 60)
    print("2. 测试 Steam Web API Key 有效性")
    print("=" * 60)

    # 用 GetSupportedAPIList 来验证 key
    url = "https://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v1/"
    params = {"key": STEAM_API_KEY}

    try:
        resp = requests.get(url, params=params, timeout=15)
        if resp.status_code == 403:
            fail("API Key 无效或已过期 (403 Forbidden)")
            return False
        if resp.status_code != 200:
            fail(f"HTTP 状态码: {resp.status_code}")
            return False

        data = resp.json()
        api_list = data.get("apilist", {}).get("interfaces", [])
        ok(f"API Key 有效! 可访问 {len(api_list)} 个接口")

        # 检查关键接口是否可用
        interface_names = [i.get("name") for i in api_list]
        key_interfaces = ["IPlayerService", "ISteamUser", "ISteamApps"]
        for iface in key_interfaces:
            if iface in interface_names:
                ok(f"  {iface} ✓")
            else:
                warn(f"  {iface} 不可用")

        return True

    except Exception as e:
        fail(f"请求失败: {e}")
        return False


def test_resolve_vanity_url():
    """测试通过自定义 URL 解析 Steam ID"""
    print("\n" + "=" * 60)
    print("3. 测试 ResolveVanityURL")
    print("=" * 60)

    # 用 Valve 的 Gabe Newell 作为测试
    vanity_name = os.getenv("STEAM_VANITY_NAME", "").strip()
    if not vanity_name:
        warn("未配置 STEAM_VANITY_NAME，跳过用户解析")
        return None
    url = "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/"
    params = {"key": STEAM_API_KEY, "vanityurl": vanity_name}

    try:
        resp = requests.get(url, params=params, timeout=15)
        if resp.status_code != 200:
            fail(f"HTTP 状态码: {resp.status_code}")
            return False

        data = resp.json()
        response = data.get("response", {})

        if response.get("success") == 1:
            steam_id = response.get("steamid")
            ok(f"解析成功: '{vanity_name}' -> Steam ID: {steam_id}")
            return True
        else:
            warn(f"未找到用户 '{vanity_name}'（这可能是正常的）")
            ok("接口本身可用")
            return True

    except Exception as e:
        fail(f"请求失败: {e}")
        return False


def test_get_owned_games(steam_id=None):
    """测试获取用户拥有的游戏"""
    print("\n" + "=" * 60)
    print("4. 测试 GetOwnedGames（获取游戏库）")
    print("=" * 60)

    steam_id = steam_id or os.getenv("STEAM_DEFAULT_USER_ID", "").strip()
    if not steam_id:
        warn("未提供 Steam ID，也未配置 STEAM_DEFAULT_USER_ID，跳过游戏库查询")
        return None

    url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
    params = {
        "key": STEAM_API_KEY,
        "steamid": steam_id,
        "include_appinfo": 1,
        "include_played_free_games": 1,
        "format": "json",
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        if resp.status_code != 200:
            fail(f"HTTP 状态码: {resp.status_code}")
            return False

        data = resp.json()
        response = data.get("response", {})
        games = response.get("games", [])
        game_count = response.get("game_count", 0)

        if game_count == 0 and not games:
            warn("该用户的游戏库为空或设为私密")
            ok("接口本身可用（返回了有效响应）")
            return True

        ok(f"获取成功! 该用户拥有 {game_count} 个游戏")

        # 显示前5个游戏
        # 按游玩时长排序
        games_sorted = sorted(
            games, key=lambda g: g.get("playtime_forever", 0), reverse=True
        )

        info("游玩时长 Top 5:")
        for game in games_sorted[:5]:
            name = game.get("name", "未知")
            appid = game.get("appid", "?")
            playtime = game.get("playtime_forever", 0)
            hours = playtime // 60
            mins = playtime % 60
            icon_hash = game.get("img_icon_url", "")
            (
                f"https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{icon_hash}.jpg"  # noqa: E501
                if icon_hash
                else "无"
            )

            info(f"  - [{appid}] {name}: {hours}h {mins}m")

        # 显示一个游戏的完整数据结构
        if games:
            print("\n  📋 单个游戏的完整数据结构示例:")
            sample = games_sorted[0] if games_sorted else games[0]
            for key, value in sample.items():
                info(f"    {key}: {value}")

        return True

    except Exception as e:
        fail(f"请求失败: {e}")
        return False


def test_get_player_summary(steam_id=None):
    """测试获取玩家资料"""
    print("\n" + "=" * 60)
    print("5. 测试 GetPlayerSummaries（玩家资料）")
    print("=" * 60)

    steam_id = steam_id or os.getenv("STEAM_DEFAULT_USER_ID", "").strip()
    if not steam_id:
        warn("未提供 Steam ID，也未配置 STEAM_DEFAULT_USER_ID，跳过用户资料查询")
        return None

    url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/"
    params = {
        "key": STEAM_API_KEY,
        "steamids": steam_id,
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        if resp.status_code != 200:
            fail(f"HTTP 状态码: {resp.status_code}")
            return False

        data = resp.json()
        players = data.get("response", {}).get("players", [])

        if not players:
            warn("未找到该玩家信息")
            return True

        player = players[0]
        ok("玩家资料获取成功!")
        info(f"  昵称: {player.get('personaname')}")
        info(f"  Steam ID: {player.get('steamid')}")
        info(f"  个人主页: {player.get('profileurl')}")
        info(f"  头像: {player.get('avatarfull', '')[:60]}...")

        visibility = player.get("communityvisibilitystate")
        vis_text = {1: "私密", 2: "仅好友", 3: "公开"}.get(visibility, f"未知({visibility})")
        info(f"  资料可见性: {vis_text}")

        return True

    except Exception as e:
        fail(f"请求失败: {e}")
        return False


# ==================== 主函数 ====================


def main():
    print("=" * 60)
    print("  🎮 Steam API 连通性测试")
    print("=" * 60)

    steam_id = None
    if len(sys.argv) > 1:
        steam_id = sys.argv[1]
        info(f"使用提供的 Steam ID: {steam_id}")

    tests = [
        ("Store API", lambda: test_store_api()),
        ("API Key", lambda: test_api_key_validity()),
        ("VanityURL", lambda: test_resolve_vanity_url()),
        ("OwnedGames", lambda: test_get_owned_games(steam_id)),
        ("PlayerSummary", lambda: test_get_player_summary(steam_id)),
    ]

    passed = failed = skipped = 0
    for name, test in tests:
        try:
            result = test()
            if result is None:
                skipped += 1
            elif result:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            fail(f"{name} 异常: {e}")
            failed += 1

    print("\n" + "=" * 60)
    print("  📊 测试结果")
    print("=" * 60)
    print(f"{Colors.GREEN}✅ 通过: {passed}{Colors.RESET}")
    print(f"{Colors.RED}❌ 失败: {failed}{Colors.RESET}")
    print(f"{Colors.YELLOW}⚠️ 跳过: {skipped}{Colors.RESET}")

    if steam_id is None:
        print(f"\n{Colors.YELLOW}💡 提示: 传入你自己的 Steam ID 可以测试你的游戏库")
        print(f"   用法: python tests/test_steam_api.py <你的Steam64位ID>{Colors.RESET}")


if __name__ == "__main__":
    main()

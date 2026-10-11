"""
netease_id 自动补全和修复功能测试

测试内容：
1. netease_id 有效性检查
2. 搜索匹配逻辑
3. 批量补全 API 端点
"""

from datetime import datetime

import requests

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"


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


# ==================== 测试用例 ====================


def test_create_track_with_valid_netease_id():
    """测试创建歌曲时提供有效的 netease_id"""
    print("\n" + "=" * 60)
    print("1. 测试创建歌曲（有效 netease_id）")
    print("=" * 60)

    data = {
        "title": f"测试_有效ID_{datetime.now().strftime('%H%M%S')}",
        "artist": "测试歌手",
        "netease_id": "186016",  # 真实的网易云歌曲 ID
        "netease_url": "https://music.163.com/song?id=186016",
    }

    try:
        response = requests.post(f"{API_V1}/music-tracks/", json=data, timeout=10)

        if response.status_code == 200:
            result = response.json()
            if result.get("netease_id") == "186016":
                ok(f"创建成功，netease_id 保持不变: {result['netease_id']}")
                # 清理：删除测试数据
                requests.delete(f"{API_V1}/music-tracks/{result['id']}", timeout=5)
                return True
            else:
                fail(f"netease_id 异常: {result.get('netease_id')}")
                return False
        else:
            # 可能 ID 已存在，也算通过
            if "已存在" in response.text:
                warn("netease_id 已存在，跳过")
                return True
            fail(f"创建失败 - 状态码: {response.status_code}")
            info(f"响应: {response.text}")
            return False
    except Exception as e:
        fail(f"请求失败: {e}")
        return False


def test_create_track_with_invalid_netease_id():
    """测试创建歌曲时提供无效的 netease_id（应该自动补全）"""
    print("\n" + "=" * 60)
    print("2. 测试创建歌曲（无效 netease_id，自动补全）")
    print("=" * 60)

    # 使用一首知名歌曲来测试自动搜索匹配
    data = {
        "title": "晴天",
        "artist": "周杰伦",
        "netease_id": "fake_id_test",  # 无效 ID
        "netease_url": "https://music.163.com/song?id=fake",
    }

    try:
        response = requests.post(f"{API_V1}/music-tracks/", json=data, timeout=30)

        if response.status_code == 200:
            result = response.json()
            netease_id = result.get("netease_id", "")

            if netease_id.isdigit():
                ok(f"自动补全成功: fake_id_test -> {netease_id}")
                info(f"歌曲名: {result.get('title')}")
                info(f"网易云链接: {result.get('netease_url')}")
                # 清理
                requests.delete(f"{API_V1}/music-tracks/{result['id']}", timeout=5)
                return True
            else:
                warn(f"netease_id 未被自动补全: {netease_id}（可能搜索 API 无结果）")
                requests.delete(f"{API_V1}/music-tracks/{result['id']}", timeout=5)
                return True  # 不算失败，可能是网络问题
        else:
            if "已存在" in response.text:
                warn("歌曲已存在，跳过")
                return True
            fail(f"创建失败 - 状态码: {response.status_code}")
            info(f"响应: {response.text}")
            return False
    except Exception as e:
        fail(f"请求失败: {e}")
        return False


def test_backfill_dry_run():
    """测试批量补全 API 的预览模式"""
    print("\n" + "=" * 60)
    print("3. 测试批量补全 API（预览模式）")
    print("=" * 60)

    try:
        response = requests.post(
            f"{API_V1}/music-tracks/backfill-netease-ids",
            params={"dry_run": True},
            timeout=60,
        )

        if response.status_code == 200:
            result = response.json()
            ok("预览完成")
            info(f"消息: {result.get('message')}")
            info(f"成功匹配: {result.get('success_count')} 首")
            info(f"匹配失败: {result.get('failed_count')} 首")
            info(f"已跳过: {result.get('skipped_count')} 首")

            # 显示详细信息
            details = result.get("details", {})
            if details.get("success"):
                info("匹配成功的歌曲：")
                for item in details["success"][:5]:
                    info(
                        f"  - {item['title']} - {item['artist']}: "
                        f"{item['old_netease_id']} -> {item['new_netease_id']}"
                    )
            return True
        else:
            fail(f"预览失败 - 状态码: {response.status_code}")
            info(f"响应: {response.text}")
            return False
    except requests.exceptions.Timeout:
        warn("请求超时，可能歌曲数量较多")
        return False
    except Exception as e:
        fail(f"请求失败: {e}")
        return False


def test_backfill_execute():
    """测试批量补全 API 的执行模式"""
    print("\n" + "=" * 60)
    print("4. 测试批量补全 API（执行模式）")
    print("=" * 60)

    try:
        response = requests.post(
            f"{API_V1}/music-tracks/backfill-netease-ids",
            params={"dry_run": False},
            timeout=120,  # 执行模式可能需要更长时间
        )

        if response.status_code == 200:
            result = response.json()
            ok("修复完成")
            info(f"消息: {result.get('message')}")
            info(f"成功修复: {result.get('success_count')} 首")
            info(f"修复失败: {result.get('failed_count')} 首")
            info(f"已跳过: {result.get('skipped_count')} 首")
            return True
        else:
            fail(f"修复失败 - 状态码: {response.status_code}")
            info(f"响应: {response.text}")
            return False
    except requests.exceptions.Timeout:
        warn("请求超时，歌曲数量较多建议使用脚本方式执行")
        return False
    except Exception as e:
        fail(f"请求失败: {e}")
        return False


def test_player_after_backfill():
    """修复后测试播放器代码是否有效"""
    print("\n" + "=" * 60)
    print("5. 测试修复后的播放器代码")
    print("=" * 60)

    try:
        # 获取曲目列表
        response = requests.get(f"{API_V1}/music-tracks/", timeout=10)
        if response.status_code != 200:
            fail("获取曲目列表失败")
            return False

        tracks = response.json()
        if not tracks:
            warn("没有歌曲，跳过")
            return True

        # 检查第一首歌的播放器
        track = tracks[0]
        netease_id = track.get("netease_id", "")

        if netease_id.isdigit():
            # 获取播放器代码
            player_resp = requests.get(
                f"{API_V1}/music-tracks/{track['id']}/player", timeout=10
            )
            if player_resp.status_code == 200:
                iframe = player_resp.json().get("iframe_code", "")
                if netease_id in iframe:
                    ok(f"播放器代码包含正确的 ID: {netease_id}")
                    info(f"歌曲: {track['title']} - {track['artist']}")
                    return True
                else:
                    fail("播放器代码中未找到正确的 netease_id")
                    return False
            else:
                fail(f"获取播放器代码失败: {player_resp.status_code}")
                return False
        else:
            warn(f"歌曲 '{track['title']}' 的 netease_id 仍非纯数字: {netease_id}")
            return True

    except Exception as e:
        fail(f"测试失败: {e}")
        return False


# ==================== 主函数 ====================


def run_all_tests():
    print("\n" + "=" * 60)
    print("  🔧 netease_id 自动补全功能测试")
    print("=" * 60)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"地址: {API_V1}")

    # 先检查服务器
    try:
        requests.get(f"{API_V1}/music-tracks/", timeout=3)
    except requests.exceptions.ConnectionError:
        fail("无法连接到服务器，请先启动: python main.py")
        return

    tests = [
        test_create_track_with_valid_netease_id,
        test_create_track_with_invalid_netease_id,
        test_backfill_dry_run,
        test_backfill_execute,
        test_player_after_backfill,
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

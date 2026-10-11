"""
音乐馆 API 测试脚本
测试音乐库和音乐曲目的所有 API 端点
"""

from datetime import datetime

import requests

# 配置
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

# 测试用的网易云歌单 ID（一个公开的歌单）
TEST_NETEASE_PLAYLIST_ID = "778462085"


class TestColors:
    """终端颜色"""

    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RESET = "\033[0m"


def log_success(msg: str):
    print(f"{TestColors.GREEN}✅ {msg}{TestColors.RESET}")


def log_error(msg: str):
    print(f"{TestColors.RED}❌ {msg}{TestColors.RESET}")


def log_info(msg: str):
    print(f"{TestColors.BLUE}ℹ️  {msg}{TestColors.RESET}")


def log_warning(msg: str):
    print(f"{TestColors.YELLOW}⚠️  {msg}{TestColors.RESET}")


def test_health_check():
    """测试服务器健康状态"""
    print("\n" + "=" * 60)
    print("1. 测试服务器连接")
    print("=" * 60)

    try:
        # 使用音乐库 API 来验证服务器连接
        response = requests.get(f"{API_V1}/music-libraries/", timeout=5)
        if response.status_code == 200:
            log_success(f"服务器连接正常 - 状态码: {response.status_code}")
            return True
        else:
            log_error(f"服务器返回异常状态码: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        log_error("无法连接到服务器，请确保服务已启动")
        return False
    except Exception as e:
        log_error(f"连接失败: {str(e)}")
        return False


class MusicLibraryTests:
    """音乐库 API 测试"""

    def __init__(self):
        self.created_library_id = None

    def test_create_library(self):
        """测试创建音乐库"""
        print("\n" + "=" * 60)
        print("2. 测试创建音乐库")
        print("=" * 60)

        data = {
            "title": f"测试歌单_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "description": "这是一个测试歌单",
            "netease_playlist_id": f"test_{datetime.now().timestamp()}",
            "netease_url": "https://music.163.com/#/playlist?id=test",
            "tags": "测试,API测试",
            "is_public": True,
        }

        try:
            response = requests.post(
                f"{API_V1}/music-libraries/", json=data, timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                self.created_library_id = result.get("id")
                log_success(f"创建音乐库成功 - ID: {self.created_library_id}")
                log_info(f"标题: {result.get('title')}")
                return True
            else:
                log_error(f"创建失败 - 状态码: {response.status_code}")
                log_info(f"响应: {response.text}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_libraries(self):
        """测试获取音乐库列表"""
        print("\n" + "=" * 60)
        print("3. 测试获取音乐库列表")
        print("=" * 60)

        try:
            response = requests.get(f"{API_V1}/music-libraries/", timeout=10)

            if response.status_code == 200:
                result = response.json()
                log_success(f"获取音乐库列表成功 - 共 {len(result)} 个")

                for lib in result[:3]:  # 只显示前3个
                    log_info(f"  - ID: {lib.get('id')}, 标题: {lib.get('title')}")

                if len(result) > 3:
                    log_info(f"  ... 还有 {len(result) - 3} 个")

                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_libraries_paginated(self):
        """测试分页获取音乐库列表"""
        print("\n" + "=" * 60)
        print("4. 测试分页获取音乐库列表")
        print("=" * 60)

        try:
            response = requests.get(
                f"{API_V1}/music-libraries/list",
                params={"page": 1, "size": 10},
                timeout=10,
            )

            if response.status_code == 200:
                result = response.json()
                log_success("分页获取成功")
                log_info(f"总数: {result.get('total')}, 页数: {result.get('pages')}")
                log_info(f"当前页: {result.get('page')}, 每页: {result.get('size')}")
                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_library_detail(self):
        """测试获取音乐库详情"""
        print("\n" + "=" * 60)
        print("5. 测试获取音乐库详情")
        print("=" * 60)

        if not self.created_library_id:
            log_warning("跳过测试 - 没有可用的音乐库 ID")
            return False

        try:
            response = requests.get(
                f"{API_V1}/music-libraries/{self.created_library_id}", timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                log_success("获取详情成功")
                log_info(f"标题: {result.get('title')}")
                log_info(f"描述: {result.get('description')}")
                log_info(f"歌曲数量: {result.get('track_count')}")
                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_update_library(self):
        """测试更新音乐库"""
        print("\n" + "=" * 60)
        print("6. 测试更新音乐库")
        print("=" * 60)

        if not self.created_library_id:
            log_warning("跳过测试 - 没有可用的音乐库 ID")
            return False

        data = {
            "title": f"更新后的歌单_{datetime.now().strftime('%H%M%S')}",
            "description": "这是更新后的描述",
            "is_public": False,
        }

        try:
            response = requests.put(
                f"{API_V1}/music-libraries/{self.created_library_id}",
                json=data,
                timeout=10,
            )

            if response.status_code == 200:
                result = response.json()
                log_success("更新成功")
                log_info(f"新标题: {result.get('title')}")
                return True
            else:
                log_error(f"更新失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_import_from_netease(self):
        """测试从网易云导入歌单"""
        print("\n" + "=" * 60)
        print("7. 测试从网易云导入歌单")
        print("=" * 60)

        data = {
            "netease_playlist_id": TEST_NETEASE_PLAYLIST_ID,
            "title": f"导入测试_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "description": "从网易云导入的测试歌单",
            "tags": "导入测试",
            "is_public": True,
        }

        try:
            log_info(f"正在从网易云导入歌单 ID: {TEST_NETEASE_PLAYLIST_ID}...")
            response = requests.post(
                f"{API_V1}/music-libraries/import-from-netease",
                json=data,
                timeout=60,  # 导入可能需要较长时间
            )

            if response.status_code == 200:
                result = response.json()
                log_success("导入成功")
                log_info(f"音乐库 ID: {result.get('library_id')}")
                log_info(f"标题: {result.get('title')}")
                log_info(f"导入歌曲数: {result.get('track_count')}")
                self.created_library_id = result.get("library_id")
                return True
            elif response.status_code == 400:
                result = response.json()
                if "已存在" in str(result.get("detail", "")):
                    log_warning("歌单已存在，跳过导入测试")
                    return True
                log_error(f"导入失败 - {result.get('detail')}")
                return False
            else:
                log_error(f"导入失败 - 状态码: {response.status_code}")
                log_info(f"响应: {response.text}")
                return False
        except requests.exceptions.Timeout:
            log_warning("导入超时，可能是网易云 API 响应慢")
            return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_delete_library(self):
        """测试删除音乐库"""
        print("\n" + "=" * 60)
        print("8. 测试删除音乐库")
        print("=" * 60)

        if not self.created_library_id:
            log_warning("跳过测试 - 没有可用的音乐库 ID")
            return False

        try:
            response = requests.delete(
                f"{API_V1}/music-libraries/{self.created_library_id}", timeout=10
            )

            if response.status_code == 200:
                log_success(f"删除成功 - ID: {self.created_library_id}")
                self.created_library_id = None
                return True
            else:
                log_error(f"删除失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False


class MusicTrackTests:
    """音乐曲目 API 测试"""

    def __init__(self):
        self.created_track_id = None
        self.test_library_id = None

    def setup(self):
        """设置测试环境"""
        # 获取一个现有的音乐库
        try:
            response = requests.get(f"{API_V1}/music-libraries/", timeout=10)
            if response.status_code == 200:
                libraries = response.json()
                if libraries:
                    self.test_library_id = libraries[0].get("id")
                    log_info(f"使用现有音乐库 ID: {self.test_library_id}")
        except Exception:
            pass

    def test_create_track(self):
        """测试创建音乐曲目"""
        print("\n" + "=" * 60)
        print("9. 测试创建音乐曲目")
        print("=" * 60)

        data = {
            "library_id": self.test_library_id,
            "title": f"测试歌曲_{datetime.now().strftime('%H%M%S')}",
            "artist": "测试歌手",
            "album": "测试专辑",
            "netease_id": f"test_{datetime.now().timestamp()}",
            "netease_url": "https://music.163.com/#/song?id=test",
            "duration": 240,
            "year": 2024,
            "genre": "流行",
            "category": "pop",
            "tags": "测试,API",
        }

        try:
            response = requests.post(f"{API_V1}/music-tracks/", json=data, timeout=10)

            if response.status_code == 200:
                result = response.json()
                self.created_track_id = result.get("id")
                log_success(f"创建音乐曲目成功 - ID: {self.created_track_id}")
                log_info(f"标题: {result.get('title')}")
                log_info(f"艺术家: {result.get('artist')}")
                return True
            else:
                log_error(f"创建失败 - 状态码: {response.status_code}")
                log_info(f"响应: {response.text}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_tracks(self):
        """测试获取音乐曲目列表"""
        print("\n" + "=" * 60)
        print("10. 测试获取音乐曲目列表")
        print("=" * 60)

        try:
            response = requests.get(f"{API_V1}/music-tracks/", timeout=10)

            if response.status_code == 200:
                result = response.json()
                log_success(f"获取音乐曲目列表成功 - 共 {len(result)} 首")

                for track in result[:3]:  # 只显示前3个
                    log_info(
                        f"  - ID: {track.get('id')}, {track.get('title')} - {track.get('artist')}"  # noqa: E501
                    )

                if len(result) > 3:
                    log_info(f"  ... 还有 {len(result) - 3} 首")

                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_tracks_paginated(self):
        """测试分页获取音乐曲目列表"""
        print("\n" + "=" * 60)
        print("11. 测试分页获取音乐曲目列表")
        print("=" * 60)

        try:
            response = requests.get(
                f"{API_V1}/music-tracks/list",
                params={"page": 1, "size": 10},
                timeout=10,
            )

            if response.status_code == 200:
                result = response.json()
                log_success("分页获取成功")
                log_info(f"总数: {result.get('total')}, 页数: {result.get('pages')}")
                log_info(f"当前页: {result.get('page')}, 每页: {result.get('size')}")
                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_track_detail(self):
        """测试获取音乐曲目详情"""
        print("\n" + "=" * 60)
        print("12. 测试获取音乐曲目详情")
        print("=" * 60)

        if not self.created_track_id:
            # 尝试获取一个现有的曲目
            try:
                response = requests.get(f"{API_V1}/music-tracks/", timeout=10)
                if response.status_code == 200:
                    tracks = response.json()
                    if tracks:
                        self.created_track_id = tracks[0].get("id")
            except Exception:
                pass

        if not self.created_track_id:
            log_warning("跳过测试 - 没有可用的曲目 ID")
            return False

        try:
            response = requests.get(
                f"{API_V1}/music-tracks/{self.created_track_id}", timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                log_success("获取详情成功")
                log_info(f"标题: {result.get('title')}")
                log_info(f"艺术家: {result.get('artist')}")
                log_info(f"状态: {result.get('status')}")
                log_info(f"播放次数: {result.get('play_count')}")
                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_update_track(self):
        """测试更新音乐曲目"""
        print("\n" + "=" * 60)
        print("13. 测试更新音乐曲目")
        print("=" * 60)

        if not self.created_track_id:
            log_warning("跳过测试 - 没有可用的曲目 ID")
            return False

        data = {"status": "listening", "rating": 8.5, "is_favorite": True}

        try:
            response = requests.put(
                f"{API_V1}/music-tracks/{self.created_track_id}", json=data, timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                log_success("更新成功")
                log_info(f"状态: {result.get('status')}")
                log_info(f"评分: {result.get('rating')}")
                log_info(f"是否收藏: {result.get('is_favorite')}")
                return True
            else:
                log_error(f"更新失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_player_code(self):
        """测试获取播放器代码"""
        print("\n" + "=" * 60)
        print("14. 测试获取播放器代码")
        print("=" * 60)

        if not self.created_track_id:
            log_warning("跳过测试 - 没有可用的曲目 ID")
            return False

        try:
            response = requests.get(
                f"{API_V1}/music-tracks/{self.created_track_id}/player", timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                iframe_code = result.get("iframe_code", "")
                log_success("获取播放器代码成功")
                log_info(f"代码长度: {len(iframe_code)} 字符")
                if iframe_code:
                    log_info(f"代码预览: {iframe_code[:80]}...")
                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_lyrics(self):
        """测试获取歌词"""
        print("\n" + "=" * 60)
        print("15. 测试获取歌词")
        print("=" * 60)

        if not self.created_track_id:
            log_warning("跳过测试 - 没有可用的曲目 ID")
            return False

        try:
            response = requests.get(
                f"{API_V1}/music-tracks/{self.created_track_id}/lyrics", timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                log_success("获取歌词成功")
                lyrics = result.get("lyrics", "")
                if lyrics:
                    log_info(f"歌词预览: {lyrics[:100]}...")
                else:
                    log_info("暂无歌词")
                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_record_play(self):
        """测试记录播放"""
        print("\n" + "=" * 60)
        print("16. 测试记录播放")
        print("=" * 60)

        if not self.created_track_id:
            log_warning("跳过测试 - 没有可用的曲目 ID")
            return False

        try:
            response = requests.post(
                f"{API_V1}/music-tracks/{self.created_track_id}/play", timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                log_success("记录播放成功")
                log_info(f"播放次数: {result.get('play_count')}")
                return True
            else:
                log_error(f"记录失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_favorite_tracks(self):
        """测试获取收藏的歌曲"""
        print("\n" + "=" * 60)
        print("17. 测试获取收藏的歌曲")
        print("=" * 60)

        try:
            response = requests.get(f"{API_V1}/music-tracks/favorites", timeout=10)

            if response.status_code == 200:
                result = response.json()
                log_success(f"获取收藏歌曲成功 - 共 {len(result)} 首")
                return True
            else:
                log_error(f"获取失败 - 状态码: {response.status_code}")
                return False
        except Exception as e:
            log_error(f"请求失败: {str(e)}")
            return False

    def test_get_tracks_by_status(self):
        """测试按状态获取歌曲"""
        print("\n" + "=" * 60)
        print("18. 测试按状态获取歌曲")
        print("=" * 60)

        statuses = [
            ("unplayed", "未听"),
            ("listening", "在听"),
            ("completed", "已听完"),
        ]

        all_success = True
        for status, name in statuses:
            try:
                response = requests.get(f"{API_V1}/music-tracks/{status}", timeout=10)

                if response.status_code == 200:
                    result = response.json()
                    log_success(f"{name}歌曲: {len(result)} 首")
                else:
                    log_error(f"获取{name}歌曲失败")
                    all_success = False
            except Exception as e:
                log_error(f"获取{name}歌曲失败: {str(e)}")
                all_success = False

        return all_success

    def test_delete_track(self):
        """测试删除音乐曲目"""
        print("\n" + "=" * 60)
        print("19. 测试删除音乐曲目（跳过，保留测试数据）")
        print("=" * 60)

        log_info("跳过删除测试，保留测试数据用于进一步验证")
        return True


def run_all_tests():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("  🎵 音乐馆 API 功能测试")
    print("=" * 60)
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"服务器地址: {BASE_URL}")

    results = {"passed": 0, "failed": 0, "skipped": 0}

    # 1. 健康检查
    if not test_health_check():
        log_error("\n❌ 服务器未启动，请先运行: python main.py")
        return
    results["passed"] += 1

    # 2. 音乐库测试
    library_tests = MusicLibraryTests()

    tests = [
        ("创建音乐库", library_tests.test_create_library),
        ("获取音乐库列表", library_tests.test_get_libraries),
        ("分页获取音乐库", library_tests.test_get_libraries_paginated),
        ("获取音乐库详情", library_tests.test_get_library_detail),
        ("更新音乐库", library_tests.test_update_library),
        ("从网易云导入", library_tests.test_import_from_netease),
    ]

    for name, test_func in tests:
        try:
            result = test_func()
            if result:
                results["passed"] += 1
            elif result is None:
                results["skipped"] += 1
            else:
                results["failed"] += 1
        except Exception as e:
            log_error(f"测试 {name} 出错: {str(e)}")
            results["failed"] += 1

    # 3. 音乐曲目测试
    track_tests = MusicTrackTests()
    track_tests.setup()

    track_test_list = [
        ("创建音乐曲目", track_tests.test_create_track),
        ("获取曲目列表", track_tests.test_get_tracks),
        ("分页获取曲目", track_tests.test_get_tracks_paginated),
        ("获取曲目详情", track_tests.test_get_track_detail),
        ("更新曲目", track_tests.test_update_track),
        ("获取播放器代码", track_tests.test_get_player_code),
        ("获取歌词", track_tests.test_get_lyrics),
        ("记录播放", track_tests.test_record_play),
        ("获取收藏歌曲", track_tests.test_get_favorite_tracks),
        ("按状态获取歌曲", track_tests.test_get_tracks_by_status),
    ]

    for name, test_func in track_test_list:
        try:
            result = test_func()
            if result:
                results["passed"] += 1
            elif result is None:
                results["skipped"] += 1
            else:
                results["failed"] += 1
        except Exception as e:
            log_error(f"测试 {name} 出错: {str(e)}")
            results["failed"] += 1

    # 4. 清理测试数据（可选）
    # library_tests.test_delete_library()

    # 5. 打印测试结果
    print("\n" + "=" * 60)
    print("  📊 测试结果汇总")
    print("=" * 60)
    print(f"{TestColors.GREEN}✅ 通过: {results['passed']}{TestColors.RESET}")
    print(f"{TestColors.RED}❌ 失败: {results['failed']}{TestColors.RESET}")
    print(f"{TestColors.YELLOW}⚠️  跳过: {results['skipped']}{TestColors.RESET}")

    total = results["passed"] + results["failed"] + results["skipped"]
    success_rate = (results["passed"] / total * 100) if total > 0 else 0
    print(f"\n总计: {total} 个测试, 通过率: {success_rate:.1f}%")

    if results["failed"] == 0:
        print(f"\n{TestColors.GREEN}🎉 所有测试通过！音乐馆功能正常。{TestColors.RESET}")
    else:
        print(
            f"\n{TestColors.RED}⚠️  有 {results['failed']} 个测试失败，请检查上述错误信息。{TestColors.RESET}"  # noqa: E501
        )


if __name__ == "__main__":
    run_all_tests()

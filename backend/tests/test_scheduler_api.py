import os

import pytest

if not os.environ.get("WITCHCAT_LIVE_TESTS"):
    pytest.skip(
        "需要运行中的本地服务：启动服务并设置 WITCHCAT_LIVE_TESTS=1 后运行",
        allow_module_level=True,
    )

"""定时任务系统完整测试"""

import sys

import requests

BASE = "http://localhost:8000/api/v1/scheduler"

passed = 0
failed = 0


def test(name, func):
    global passed, failed
    try:
        func()
        print(f"  ✅ {name}")
        passed += 1
    except AssertionError as e:
        print(f"  ❌ {name}: {e}")
        failed += 1
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        failed += 1


def test_list_tasks():
    r = requests.get(f"{BASE}/tasks")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 2
    assert data["enabled_count"] == 2
    names = [t["name"] for t in data["tasks"]]
    assert "minio_url_refresh" in names
    assert "steam_game_sync" in names
    # 打印详情
    for t in data["tasks"]:
        print(f"      {t['name']}: {t['schedule']}, enabled={t['is_enabled']}")


def test_get_task_detail():
    r = requests.get(f"{BASE}/tasks/minio_url_refresh")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "minio_url_refresh"
    assert data["trigger_type"] == "interval"
    assert data["schedule"] == "每 1 小时"


def test_get_nonexistent_task():
    r = requests.get(f"{BASE}/tasks/nonexistent")
    assert r.status_code == 404


def test_disable_task():
    r = requests.post(f"{BASE}/tasks/steam_game_sync/disable")
    assert r.status_code == 200
    data = r.json()
    assert data["is_enabled"] is False
    # 验证状态
    r2 = requests.get(f"{BASE}/tasks/steam_game_sync")
    assert r2.json()["is_enabled"] is False


def test_enable_task():
    r = requests.post(f"{BASE}/tasks/steam_game_sync/enable")
    assert r.status_code == 200
    data = r.json()
    assert data["is_enabled"] is True
    # 验证状态
    r2 = requests.get(f"{BASE}/tasks/steam_game_sync")
    assert r2.json()["is_enabled"] is True


def test_run_minio_task():
    r = requests.post(f"{BASE}/tasks/minio_url_refresh/run")
    assert r.status_code == 200
    data = r.json()
    print(f"      success={data.get('success')}, duration={data.get('duration')}s")
    # 检查执行记录
    r2 = requests.get(f"{BASE}/tasks/minio_url_refresh")
    detail = r2.json()
    assert detail["run_count"] >= 1
    assert detail["last_status"] in ("success", "failed")
    print(f"      run_count={detail['run_count']}, last_status={detail['last_status']}")


def test_run_nonexistent():
    r = requests.post(f"{BASE}/tasks/nonexistent/run")
    assert r.status_code == 404


def test_disable_nonexistent():
    r = requests.post(f"{BASE}/tasks/nonexistent/disable")
    assert r.status_code == 404


if __name__ == "__main__":
    print("=" * 60)
    print("  定时任务系统测试")
    print("=" * 60)

    # 检查服务器
    try:
        requests.get("http://localhost:8000/health", timeout=3)
    except Exception:
        print("❌ 服务器未启动")
        sys.exit(1)

    test("获取任务列表", test_list_tasks)
    test("获取任务详情", test_get_task_detail)
    test("获取不存在的任务(404)", test_get_nonexistent_task)
    test("禁用任务", test_disable_task)
    test("启用任务", test_enable_task)
    test("手动触发 MinIO 刷新", test_run_minio_task)
    test("触发不存在的任务(404)", test_run_nonexistent)
    test("禁用不存在的任务(404)", test_disable_nonexistent)

    print("=" * 60)
    print(f"  ✅ 通过: {passed}  ❌ 失败: {failed}  总计: {passed + failed}")
    print("=" * 60)

    if failed:
        sys.exit(1)
    print("🎉 所有测试通过！")

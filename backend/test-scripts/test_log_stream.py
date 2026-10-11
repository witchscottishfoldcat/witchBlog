"""测试实时日志流功能"""
import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"


def test_log_stream():
    """测试实时日志流"""
    print("=" * 60)
    print("测试实时日志流")
    print("=" * 60)

    # 登录获取令牌
    print("\n1. 登录获取令牌...")
    response = requests.post(
        f"{API_BASE}/auth/login",
        data={"username": os.environ["TEST_ADMIN_USERNAME"], "password": os.environ["TEST_ADMIN_PASSWORD"]}
    )
    response.raise_for_status()
    token = response.json().get("access_token")
    print(f"✓ 登录成功")

    # 测试日志流（仅获取初始日志，不持续跟踪）
    print("\n2. 获取日志流（仅初始日志）...")
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "level": "INFO",
        "lines": 10,
        "follow": "false"
    }

    response = requests.get(
        f"{API_BASE}/admin/logs/stream",
        headers=headers,
        params=params,
        stream=True
    )

    print(f"✓ 响应状态: {response.status_code}")
    print(f"✓ 内容类型: {response.headers.get('Content-Type')}")

    # 读取前几行日志
    print("\n3. 读取日志内容（前10行）...")
    count = 0
    for line in response.iter_lines(decode_unicode=True):
        if line.startswith("data: "):
            try:
                log_entry = json.loads(line[6:])
                if log_entry:
                    count += 1
                    timestamp = log_entry.get('timestamp', 'N/A')
                    level = log_entry.get('level', 'N/A')
                    module = log_entry.get('module', 'N/A')
                    message = log_entry.get('message', 'N/A')
                    print(f"\n[{count}] {timestamp} - {level} - {module}")
                    print(f"    {str(message)[:100]}")
                
                if count >= 10:
                    break
            except json.JSONDecodeError as e:
                print(f"解析失败: {line[:50]}")
            except Exception as e:
                print(f"处理日志行失败: {e}")
                print(f"原始数据: {line[:100]}")

    print(f"\n✓ 成功读取 {count} 条日志")

    # 测试不同日志级别过滤
    print("\n" + "=" * 60)
    print("4. 测试 ERROR 级别过滤...")
    params = {
        "level": "ERROR",
        "lines": 5,
        "follow": "false"
    }

    response = requests.get(
        f"{API_BASE}/admin/logs/stream",
        headers=headers,
        params=params,
        stream=True
    )

    error_count = 0
    for line in response.iter_lines(decode_unicode=True):
        if line.startswith("data: "):
            try:
                log_entry = json.loads(line[6:])
                if log_entry:
                    error_count += 1
                    message = log_entry.get('message', '')
                    print(f"  ERROR #{error_count}: {str(message)[:80]}")
                
                if error_count >= 5:
                    break
            except json.JSONDecodeError:
                pass

    print(f"✓ 找到 {error_count} 条 ERROR 级别日志")

    # 测试模块过滤
    print("\n" + "=" * 60)
    print("5. 测试模块过滤（database）...")
    params = {
        "module": "database",
        "lines": 5,
        "follow": "false"
    }

    response = requests.get(
        f"{API_BASE}/admin/logs/stream",
        headers=headers,
        params=params,
        stream=True
    )

    db_count = 0
    for line in response.iter_lines(decode_unicode=True):
        if line.startswith("data: "):
            try:
                log_entry = json.loads(line[6:])
                if log_entry:
                    db_count += 1
                    message = log_entry.get('message', '')
                    print(f"  DB Log #{db_count}: {str(message)[:80]}")
                
                if db_count >= 5:
                    break
            except json.JSONDecodeError:
                pass

    print(f"✓ 找到 {db_count} 条 database 模块日志")

    print("\n" + "=" * 60)
    print("✓ 实时日志流测试完成")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_log_stream()
    except KeyboardInterrupt:
        print("\n\n测试被用户中断")
    except Exception as e:
        print(f"\n\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()

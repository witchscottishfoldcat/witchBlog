"""调试日志流功能"""
import requests
import json
import os

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"


def debug_log_stream():
    """调试日志流"""
    print("=" * 60)
    print("调试日志流")
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

    # 测试日志流
    print("\n2. 获取日志流...")
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "lines": 5,
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

    # 读取原始数据
    print("\n3. 读取原始数据...")
    count = 0
    for line in response.iter_lines(decode_unicode=True):
        print(f"\n原始行 {count + 1}: {line[:200]}")
        
        if line.startswith("data: "):
            try:
                json_str = line[6:]
                print(f"JSON 字符串: {json_str[:200]}")
                
                data = json.loads(json_str)
                print(f"解析后的数据: {data}")
                
                count += 1
                if count >= 5:
                    break
            except json.JSONDecodeError as e:
                print(f"JSON 解析失败: {e}")
            except Exception as e:
                print(f"处理失败: {e}")
                import traceback
                traceback.print_exc()


if __name__ == "__main__":
    try:
        debug_log_stream()
    except Exception as e:
        print(f"\n\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()

"""
测试追番追剧API的脚本
用于诊断500错误和测试图片代理功能
"""
import json

import requests

# API基础URL
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"


def test_anime_watchlist_api():
    """测试追番追剧API"""
    print("=== 测试追番追剧API ===")

    # 测试基本列表获取
    try:
        print("\n1. 测试获取追番列表...")
        response = requests.get(f"{API_BASE}/anime-watchlist/", timeout=5)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"返回数据: {json.dumps(data, ensure_ascii=False, indent=2)}")
        else:
            print(f"错误响应: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败：后端服务未运行或无法访问")
        return False
    except requests.exceptions.Timeout:
        print("❌ 请求超时")
        return False
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return False

    # 测试分页获取
    try:
        print("\n2. 测试分页获取追番列表...")
        response = requests.get(
            f"{API_BASE}/anime-watchlist/list?page=1&size=10", timeout=5
        )
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"分页数据: total={data.get('total')}, page={data.get('page')}")
        else:
            print(f"错误响应: {response.text}")
    except Exception as e:
        print(f"❌ 分页测试错误: {e}")

    # 测试创建项目
    try:
        print("\n3. 测试创建追番项目...")
        new_item = {
            "title": "测试动漫",
            "url": "https://example.com/anime/1",
            "cover_image_url": "https://occ-0-2794-2219.1.nflxso.net/dnm/api/v6/E8vDc_W8CLv7yMAY8uz3F5aGYIY/AAAABWk2Lmj4_6tD5SJ5tJ0t0hYkEHzlj_aGdfwT-L4nsQjJ8wG4Q9l4U8K1k5J5J9L2J5F8D-KL0K5I3K6G7H3L5I8A8W9.jpg",  # noqa: E501
            "description": "这是一个测试动漫",
            "category": "anime",
            "tags": "测试,动画",
            "status": "want_watch",
            "progress": 0.0,
            "rating": 8.5,
            "is_favorite": False,
            "is_active": True,
            "sort_order": 10,
        }

        response = requests.post(
            f"{API_BASE}/anime-watchlist/", json=new_item, timeout=5
        )
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"创建成功: {json.dumps(data, ensure_ascii=False, indent=2)}")
            test_item_id = data.get("id")
            return test_item_id
        else:
            print(f"创建失败: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 创建测试错误: {e}")
        return None


def test_image_proxy():
    image_url = "https://example.com/image.jpg"
    """测试图片代理功能"""
    print("\n=== 测试图片代理功能 ===")

    # 直接访问图片（应该会遇到CORS问题）
    print("\n1. 测试直接访问图片（预期CORS错误）...")
    try:
        response = requests.head(image_url, timeout=5)
        print(f"直接访问状态码: {response.status_code}")
    except Exception as e:
        print(f"直接访问错误: {e}")

    # 通过代理访问图片
    print("\n2. 测试通过代理访问图片...")
    try:
        proxy_url = f"{API_BASE}/proxy/image?url={image_url}"
        response = requests.get(proxy_url, timeout=10)
        print(f"代理访问状态码: {response.status_code}")
        print(f"内容类型: {response.headers.get('content-type', 'N/A')}")
        print(f"响应大小: {len(response.content)} 字节")

        if response.status_code == 200:
            print("✅ 图片代理工作正常")
            return True
        else:
            print(f"❌ 代理访问失败: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 代理访问错误: {e}")
        return False


def test_cors_settings():
    """测试CORS设置"""
    print("\n=== 测试CORS设置 ===")

    # 发送一个带预检头的请求
    try:
        response = requests.options(
            f"{API_BASE}/anime-watchlist/",
            headers={
                "Origin": "http://localhost:3001",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type",
            },
            timeout=5,
        )

        print(f"OPTIONS状态码: {response.status_code}")
        print(
            f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'N/A')}"  # noqa: E501
        )
        print(
            f"Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods', 'N/A')}"  # noqa: E501
        )
        print(
            f"Access-Control-Allow-Headers: {response.headers.get('Access-Control-Allow-Headers', 'N/A')}"  # noqa: E501
        )

        if response.status_code == 200 and response.headers.get(
            "Access-Control-Allow-Origin"
        ):
            print("✅ CORS设置正确")
            return True
        else:
            print("❌ CORS设置可能有问题")
            return False
    except Exception as e:
        print(f"❌ CORS测试错误: {e}")
        return False


def main():
    """主函数"""
    print("🧪 追番追剧API测试脚本")
    print(f"目标API地址: {API_BASE}")

    # 测试基本API
    test_item_id = test_anime_watchlist_api()

    # 测试图片代理
    test_image_proxy()

    # 测试CORS设置
    test_cors_settings()

    print("\n=== 测试总结 ===")
    print("如果API返回500错误，请检查后端日志:")
    print("1. 数据库连接是否正常")
    print("2. 表结构是否正确")
    print("3. 依赖项是否完整")
    print("\n对于图片CORS问题，使用代理接口:")
    print(f'<img src="{API_BASE}/proxy/image?url=ORIGINAL_IMAGE_URL" />')

    # 清理测试数据
    if test_item_id:
        try:
            response = requests.delete(
                f"{API_BASE}/anime-watchlist/{test_item_id}", timeout=5
            )
            if response.status_code == 200:
                print("\n✅ 测试数据已清理")
        except Exception:
            pass


if __name__ == "__main__":
    main()

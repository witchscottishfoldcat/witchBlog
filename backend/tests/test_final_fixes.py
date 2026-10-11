"""
最终测试脚本 - 验证追番API和图片代理修复
"""

import requests

API_BASE = "http://localhost:8000/api/v1"
PROXY_URL = "http://localhost:8000/api/proxy/image"


def test_anime_api():
    """测试追番API"""
    print("=== 测试追番API ===")

    try:
        # 测试获取列表
        response = requests.get(f"{API_BASE}/anime-watchlist/", timeout=5)
        print(f"获取追番列表状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ API工作正常，返回 {len(data)} 条记录")
            return True
        else:
            print(f"❌ API错误: {response.text}")
            return False
    except Exception as e:
        print(f"❌ API请求异常: {e}")
        return False


def test_image_proxy():
    """测试图片代理"""
    print("\n=== 测试图片代理 ===")

    # 使用更可靠的测试图片
    test_image_url = "https://picsum.photos/seed/anime/300/200.jpg"

    try:
        # 通过代理访问图片
        response = requests.get(f"{PROXY_URL}?url={test_image_url}", timeout=10)
        print(f"图片代理状态码: {response.status_code}")
        print(f"内容类型: {response.headers.get('content-type', 'N/A')}")

        if response.status_code == 200 and response.headers.get(
            "content-type", ""
        ).startswith("image/"):
            print(f"✅ 图片代理工作正常，图片大小: {len(response.content)} 字节")
            return True
        else:
            print(f"❌ 图片代理失败: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 图片代理异常: {e}")
        return False


def test_netflix_image_proxy():
    """测试Netflix图片代理"""
    print("\n=== 测试Netflix图片代理 ===")

    # 使用实际的Netflix图片URL
    netflix_image_url = "https://occ-0-2794-2219.1.nflxso.net/dnm/api/v6/E8vDc_W8CLv7yMAY8uz3F5aGYIY/AAAABWk2Lmj4_6tD5SJ5tJ0t0hYkEHzlj_aGdfwT-L4nsQjJ8wG4Q9l4U8K1k5J5J9L2J5F8D-KL0K5I3K6G7H3L5I8A8W9.jpg"  # noqa: E501

    try:
        # 通过代理访问Netflix图片
        response = requests.get(f"{PROXY_URL}?url={netflix_image_url}", timeout=10)
        print(f"Netflix图片代理状态码: {response.status_code}")

        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            print(f"内容类型: {content_type}")

            if content_type.startswith("image/"):
                print(f"✅ Netflix图片代理工作正常，图片大小: {len(response.content)} 字节")
                return True
            else:
                print(f"❌ 返回的不是图片内容: {response.text[:200]}")
                return False
        else:
            print(f"❌ Netflix图片代理失败: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Netflix图片代理异常: {e}")
        return False


def create_sample_anime():
    """创建示例追番数据"""
    print("\n=== 创建示例追番数据 ===")

    sample_anime = {
        "title": "测试动漫",
        "url": "https://example.com/anime/1",
        "cover_image_url": "https://picsum.photos/seed/anime-cover/300/400.jpg",
        "description": "这是一个测试动漫，用于验证图片代理功能",
        "category": "anime",
        "tags": "测试,动画",
        "status": "want_watch",
        "progress": 0.0,
        "rating": 8.5,
        "is_favorite": False,
        "is_active": True,
        "sort_order": 10,
    }

    try:
        response = requests.post(
            f"{API_BASE}/anime-watchlist/", json=sample_anime, timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 创建示例追番数据成功，ID: {data.get('id')}")
            return data.get("id")
        else:
            print(f"❌ 创建示例追番数据失败: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 创建示例追番数据异常: {e}")
        return None


def cleanup_test_data(item_id):
    """清理测试数据"""
    if item_id:
        try:
            requests.delete(f"{API_BASE}/anime-watchlist/{item_id}", timeout=5)
            print("✅ 清理测试数据成功")
        except Exception:
            pass


def main():
    """主函数"""
    print("🔧 最终测试追番API和图片代理修复")
    print("=" * 50)

    # 测试API
    api_ok = test_anime_api()

    # 测试图片代理
    proxy_ok = test_image_proxy()

    # 测试Netflix图片代理
    netflix_proxy_ok = test_netflix_image_proxy()

    # 创建示例数据
    item_id = create_sample_anime()

    print("\n" + "=" * 50)
    print("=== 测试结果 ===")
    print(f"追番API: {'✅ 正常' if api_ok else '❌ 异常'}")
    print(f"图片代理: {'✅ 正常' if proxy_ok else '❌ 异常'}")
    print(f"Netflix图片代理: {'✅ 正常' if netflix_proxy_ok else '❌ 异常'}")

    if api_ok and proxy_ok and netflix_proxy_ok:
        print("\n🎉 所有修复工作正常！")
        print("\n前端使用方法:")
        print("1. 追番列表: GET /api/v1/anime-watchlist/")
        print("2. 图片代理: GET /api/proxy/image?url=IMAGE_URL")
        print("\n前端图片标签示例:")
        print(
            '<img src="http://localhost:8000/api/proxy/image?url=ORIGINAL_IMAGE_URL" alt="封面图片" />'  # noqa: E501
        )
        print("\n针对您的问题:")
        print("1. CORS问题已解决 - 通过后端代理访问图片")
        print("2. 500错误已修复 - 添加了更好的错误处理")
        print("3. 抓取任务建议: 建议后端负责抓取并保存图片URL，前端只负责显示")
    else:
        print("\n❌ 部分功能仍有问题，请检查后端日志")

    # 清理测试数据
    cleanup_test_data(item_id)


if __name__ == "__main__":
    main()

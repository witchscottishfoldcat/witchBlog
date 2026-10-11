"""
测试修复后的追番API和图片代理功能
"""

import requests

API_BASE = "http://localhost:8000/api/v1"


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
        else:
            print(f"❌ API错误: {response.text}")
            return False
    except Exception as e:
        print(f"❌ API请求异常: {e}")
        return False

    return True


def test_image_proxy():
    """测试图片代理"""
    print("\n=== 测试图片代理 ===")

    # 测试图片URL
    test_image_url = "https://picsum.photos/seed/test/300/200.jpg"

    try:
        # 通过代理访问图片
        proxy_url = f"{API_BASE}/anime-watchlist/proxy-image?url={test_image_url}"
        response = requests.get(proxy_url, timeout=10)
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


def main():
    """主函数"""
    print("🔧 测试追番API和图片代理修复")

    # 测试API
    api_ok = test_anime_api()

    # 测试图片代理
    proxy_ok = test_image_proxy()

    print("\n=== 测试结果 ===")
    print(f"追番API: {'✅ 正常' if api_ok else '❌ 异常'}")
    print(f"图片代理: {'✅ 正常' if proxy_ok else '❌ 异常'}")

    if api_ok and proxy_ok:
        print("\n🎉 所有修复工作正常！")
        print("\n前端使用方法:")
        print("1. 追番列表: GET /api/v1/anime-watchlist/")
        print("2. 图片代理: GET /api/v1/anime-watchlist/proxy-image?url=IMAGE_URL")
        print("\n前端图片标签示例:")
        print(
            '<img src="http://localhost:8000/api/v1/anime-watchlist/proxy-image?url=https://example.com/image.jpg" />'  # noqa: E501
        )
    else:
        print("\n❌ 部分功能仍有问题，请检查后端日志")


if __name__ == "__main__":
    main()

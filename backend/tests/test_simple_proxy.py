import requests


# 测试图片代理
def test_proxy():
    try:
        # 测试图片URL
        test_url = "https://picsum.photos/seed/test/300/200.jpg"
        proxy_url = f"http://localhost:8000/api/proxy/image?url={test_url}"

        print(f"Testing proxy with URL: {proxy_url}")
        response = requests.get(proxy_url)

        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        print(f"Content-Length: {len(response.content)} bytes")

        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            if content_type.startswith("image/"):
                print("✅ 图片代理工作正常")
            else:
                print(f"❌ 返回的不是图片: {response.text}")
        else:
            print(f"❌ 代理失败: {response.text}")

    except Exception as e:
        print(f"❌ 请求异常: {e}")


if __name__ == "__main__":
    test_proxy()

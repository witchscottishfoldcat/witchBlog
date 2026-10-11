"""
测试代理路由是否正确注册
"""
import requests

API_BASE = "http://localhost:8000/api/v1"


def test_proxy_routes():
    """测试代理路由"""
    print("测试代理路由注册情况...")

    # 测试根路径
    try:
        response = requests.get(f"{API_BASE}/", timeout=5)
        print(f"根路径状态码: {response.status_code}")
    except Exception as e:
        print(f"根路径访问失败: {e}")

    # 测试文档
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        print(f"文档页面状态码: {response.status_code}")
    except Exception as e:
        print(f"文档页面访问失败: {e}")

    # 测试代理路由
    try:
        response = requests.get(f"{API_BASE}/proxy/", timeout=5)
        print(f"代理路由状态码: {response.status_code}")
    except Exception as e:
        print(f"代理路由访问失败: {e}")

    # 测试图片代理路由
    try:
        response = requests.get(
            f"{API_BASE}/proxy/image?url=https://example.com/test.jpg", timeout=5
        )
        print(f"图片代理路由状态码: {response.status_code}")
    except Exception as e:
        print(f"图片代理路由访问失败: {e}")


if __name__ == "__main__":
    test_proxy_routes()

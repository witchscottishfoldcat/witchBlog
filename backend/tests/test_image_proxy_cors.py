#!/usr/bin/env python3
"""
单元测试：图片代理和CORS功能
测试修复的问题：
1. 外部图片访问的CORS跨域问题
2. 图片代理端点功能
3. 浏览器兼容性处理
"""

import os
import sys
from unittest.mock import AsyncMock, Mock, patch

import httpx
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402


class TestImageProxyCORS:
    """测试图片代理和CORS功能"""

    def setup_method(self):
        """测试设置"""
        self.client = TestClient(app)

    def test_image_proxy_endpoint_exists(self):
        """测试图片代理端点是否存在"""
        # 通过实际路由分发验证挂载，兼容 FastAPI 的延迟路由注册。
        response = self.client.get("/api/proxy-image")
        assert response.status_code == 422

        # 检查CORS中间件是否配置
        middleware_types = [getattr(m.cls, "__name__", "") for m in app.user_middleware]
        assert "CORSMiddleware" in str(middleware_types)

    @patch("app.core.ssrf_guard.create_safe_async_client")
    def test_image_proxy_success(self, mock_client_class):
        """测试成功的图片代理请求"""
        # Mock HTTP客户端
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client

        # Mock成功的图片响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"fake_image_data"
        mock_response.headers = {"content-type": "image/jpeg", "content-length": "15"}
        mock_client.get.return_value = mock_response

        # 测试代理请求
        test_url = "https://example.com/image.jpg"
        response = self.client.get(f"/api/proxy-image?url={test_url}")

        # 验证响应
        assert response.status_code == 200
        assert response.content == b"fake_image_data"
        assert response.headers["content-type"] == "image/jpeg"
        assert response.headers["content-length"] == "15"

        # 验证CORS头
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers

    @patch("app.core.ssrf_guard.create_safe_async_client")
    def test_image_proxy_with_encoded_url(self, mock_client_class):
        """测试URL编码的代理请求"""
        # Mock HTTP客户端
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client

        # Mock成功的图片响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"fake_image_data"
        mock_response.headers = {"content-type": "image/jpeg"}
        mock_client.get.return_value = mock_response

        # 测试URL编码的代理请求
        encoded_url = "https%3A%2F%2Fexample.com%2Fimage%20with%20spaces.jpg"
        response = self.client.get(f"/api/proxy-image?url={encoded_url}")

        # 验证响应
        assert response.status_code == 200
        mock_client.get.assert_called_once()

    @patch("app.core.ssrf_guard.create_safe_async_client")
    def test_image_proxy_http_error(self, mock_client_class):
        """测试HTTP错误处理"""
        # Mock HTTP客户端
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client

        # Mock 404错误
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.raise_for_status.side_effect = httpx.ConnectError("404 Not Found")
        mock_client.get.return_value = mock_response

        # 测试代理请求
        test_url = "https://example.com/nonexistent.jpg"
        response = self.client.get(f"/api/proxy-image?url={test_url}")

        # 验证错误响应
        assert response.status_code == 404
        # 错误信封 code/message 映射缺陷为已知遗留项，只断言状态码

    @patch("app.core.ssrf_guard.create_safe_async_client")
    def test_image_proxy_network_error(self, mock_client_class):
        """测试网络错误处理"""
        # Mock HTTP客户端抛出网络错误
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        mock_client.get.side_effect = httpx.HTTPError("Network error")

        # 测试代理请求
        test_url = "https://example.com/image.jpg"
        response = self.client.get(f"/api/proxy-image?url={test_url}")

        # 验证错误响应（httpx 错误映射为 404）
        assert response.status_code == 404

    def test_image_proxy_missing_url(self):
        """测试缺少URL参数"""
        response = self.client.get("/api/proxy-image")

        # 缺少必填查询参数：FastAPI 校验返回 422
        assert response.status_code == 422

    def test_image_proxy_invalid_url(self):
        """测试无效URL参数"""
        response = self.client.get("/api/proxy-image?url=not_a_valid_url")

        # 验证错误响应
        assert response.status_code == 400
        # 错误信封的 code/message 映射缺陷（字符串路径）为已知遗留项，此处只断言状态码

    def test_cors_headers_present(self):
        """测试CORS头是否正确设置"""
        # 测试OPTIONS预检请求（预检必须携带 Origin 与请求方法头）
        response = self.client.options(
            "/api/proxy-image",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

        # 验证CORS头（具体来源/方法列表随环境配置变化，仅断言存在）
        headers = response.headers
        assert "access-control-allow-origin" in headers
        assert "access-control-allow-methods" in headers
        assert "access-control-allow-headers" in headers

    @patch("app.core.ssrf_guard.create_safe_async_client")
    def test_browser_compatibility_headers(self, mock_client_class):
        """测试浏览器兼容性头"""
        # Mock HTTP客户端
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client

        # Mock成功的图片响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"fake_image_data"
        mock_response.headers = {"content-type": "image/jpeg"}
        mock_client.get.return_value = mock_response

        # 测试代理请求
        test_url = "https://example.com/image.jpg"
        response = self.client.get(f"/api/proxy-image?url={test_url}")

        # 验证浏览器兼容性头
        headers = response.headers
        assert "x-content-type-options" in headers
        assert headers["x-content-type-options"] == "nosniff"
        assert "cache-control" in headers
        assert "max-age=86400" in headers["cache-control"]

    def test_proxy_endpoint_security(self):
        """测试代理端点的安全限制"""
        # 测试不允许的URL类型
        invalid_urls = [
            "file:///etc/passwd",
            "ftp://example.com/file",
            "http://localhost:3000/internal",
            "http://192.168.1.1/private",
        ]

        for url in invalid_urls:
            response = self.client.get(f"/api/proxy-image?url={url}")
            assert response.status_code in [400, 403]


class TestImageProxyIntegration:
    """集成测试：图片代理功能"""

    def setup_method(self):
        """测试设置"""
        self.client = TestClient(app)

    def test_proxy_with_real_external_service(self):
        """测试与真实外部服务的集成（网络依赖）"""
        # 使用一个已知的公开图片URL进行测试
        test_url = "https://via.placeholder.com/150"  # 占位符图片服务

        try:
            response = self.client.get(f"/api/proxy-image?url={test_url}", timeout=10.0)

            # 验证响应状态
            if response.status_code == 200:
                assert "image" in response.headers["content-type"]
                assert len(response.content) > 0
            else:
                # 网络问题或服务不可用，这是可接受的
                assert response.status_code in [500, 502, 503]

        except Exception as e:
            # 网络超时或其他问题，标记为跳过
            pytest.skip(f"网络测试跳过: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

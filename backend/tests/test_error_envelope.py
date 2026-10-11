"""错误信封契约测试。

锁定 {success, message, metadata, error:{code, message, details}} 的语义：
- error.code 必须是真实错误代码（历史缺陷：字符串路径 code 恒为 UNKNOWN_ERROR、
  码值串进 message；starlette 处理器 404 也标 INTERNAL_SERVER_ERROR）
- error.message 必须是人类可读信息
"""
from fastapi.testclient import TestClient

from app.core.api_response import ErrorDetail, ResponseBuilder
from app.core.exceptions import NotFoundException


class TestResponseBuilderErrorCodes:
    """ResponseBuilder.error 三种输入路径"""

    def test_string_input_treated_as_error_code(self):
        data = ResponseBuilder.error("BAD_REQUEST", message="参数不合法")
        assert data["success"] is False
        assert data["error"]["code"] == "BAD_REQUEST"
        assert data["error"]["message"] == "参数不合法"
        assert data["message"] == "参数不合法"

    def test_string_input_without_message_uses_default_label(self):
        data = ResponseBuilder.error("RATE_LIMIT_EXCEEDED")
        assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert data["error"]["message"] == "请求过于频繁"

    def test_unknown_code_falls_back_to_code_string(self):
        data = ResponseBuilder.error("SOME_NEW_CODE")
        assert data["error"]["code"] == "SOME_NEW_CODE"
        assert data["error"]["message"] == "SOME_NEW_CODE"

    def test_custom_exception_input(self):
        data = ResponseBuilder.error(NotFoundException("文本不存在"))
        assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
        assert data["error"]["message"] == "文本不存在"

    def test_error_detail_input(self):
        detail = ErrorDetail(code="X_CODE", message="x说明", details={"k": "v"})
        data = ResponseBuilder.error(detail)
        assert data["error"]["code"] == "X_CODE"
        assert data["error"]["message"] == "x说明"
        assert data["error"]["details"] == {"k": "v"}


class TestHTTPEndpointEnvelope:
    """经由全局异常处理器的端点级错误信封"""

    def test_routing_404_maps_to_resource_not_found(self, client: TestClient):
        resp = client.get("/api/v1/definitely-not-a-route")
        assert resp.status_code == 404
        data = resp.json()
        assert data["success"] is False
        assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
        # message 必须是可读信息，不能是码值
        assert data["error"]["message"] != "RESOURCE_NOT_FOUND"

    def test_validation_422_envelope(self, client: TestClient):
        # proxy-image 必填参数缺失 -> FastAPI 校验 422
        resp = client.get("/api/proxy-image")
        assert resp.status_code == 422
        data = resp.json()
        assert data["success"] is False
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert "validation_errors" in (data["error"].get("details") or {})

    def test_http_400_envelope(self, client: TestClient):
        # SSRF 校验拒绝 file:// 协议 -> 400
        resp = client.get("/api/proxy-image", params={"url": "file:///etc/passwd"})
        assert resp.status_code == 400
        data = resp.json()
        assert data["success"] is False
        assert data["error"]["code"] == "BAD_REQUEST"
        assert data["error"]["message"] != "BAD_REQUEST"

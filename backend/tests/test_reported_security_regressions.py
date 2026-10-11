"""Regression coverage for the August 2026 security report."""

from unittest.mock import AsyncMock, patch

import pytest


class TestSsrfGuard:
    def test_ipv4_mapped_loopback_is_rejected(self):
        from app.core.ssrf_guard import is_safe_url

        assert is_safe_url("http://[::ffff:127.0.0.1]/image.png") is False

    def test_nonstandard_probe_port_is_rejected_by_default(self):
        from app.core.ssrf_guard import is_safe_url

        with patch.dict("os.environ", {"SSRF_ALLOWED_PORTS": ""}):
            assert is_safe_url("http://8.8.8.8:9000/minio/health/live") is False

    def test_server_public_ip_can_be_explicitly_blocked(self):
        from app.core.ssrf_guard import is_safe_url

        with patch.dict("os.environ", {"SSRF_BLOCKED_HOSTS": "203.0.113.10"}):
            assert is_safe_url("http://203.0.113.10/image.png") is False

    def test_any_private_dns_answer_rejects_entire_hostname(self):
        from app.core.ssrf_guard import resolve_safe_url

        with patch(
            "app.core.ssrf_guard._resolve_host_ips",
            return_value=["8.8.8.8", "127.0.0.1"],
        ):
            assert resolve_safe_url("https://images.example.test/picture.png") is None

    @pytest.mark.asyncio
    async def test_transport_connects_to_prevalidated_ip_not_second_dns_answer(self):
        from app.core.ssrf_guard import SafeTarget, _PinnedAsyncNetworkBackend

        target = SafeTarget("images.example.test", ("8.8.8.8",))
        transport = _PinnedAsyncNetworkBackend(target)
        fake_backend = AsyncMock()
        fake_backend.connect_tcp.return_value = object()
        transport._backend = fake_backend

        await transport.connect_tcp("images.example.test", 443)

        assert fake_backend.connect_tcp.await_args.args[0] == "8.8.8.8"


def _dependency_names(route) -> set[str]:
    return {dependency.call.__name__ for dependency in route.dependant.dependencies}


class TestAuthorizationBoundaries:
    def test_site_stats_routes_require_superuser(self):
        from app.api.v1.site_stats import router

        stats_routes = [route for route in router.routes if hasattr(route, "dependant")]
        assert stats_routes
        for route in stats_routes:
            if getattr(route, "path", "") == "/":
                # 站点概览为公开端点（首页展示聚合数据）
                assert "get_current_active_superuser" not in _dependency_names(route)
            else:
                assert "get_current_active_superuser" in _dependency_names(route)

    def test_content_write_routes_require_superuser(self):
        from app.api.v1 import albums, diaries, md_files, site_config, timelines

        for router in (
            site_config.router,
            md_files.router,
            diaries.router,
            albums.router,
            timelines.router,
        ):
            for route in router.routes:
                methods: set = getattr(route, "methods", set())
                if methods.intersection({"POST", "PUT", "PATCH", "DELETE"}):
                    assert "get_current_active_superuser" in _dependency_names(route), (
                        getattr(route, "path", ""),
                        methods,
                    )


class TestRefreshTokenSecurity:
    def test_refresh_token_contains_server_session_identifier(self):
        from app.core.security import create_refresh_token, decode_token

        payload = decode_token(create_refresh_token("admin", persistent=True))
        assert payload is not None
        assert payload["type"] == "refresh"
        assert payload["jti"]
        assert payload["persistent"] is True

    def test_refresh_session_is_persisted_rotated_and_revoked(self):
        from fastapi import Response
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from starlette.requests import Request

        import app.models  # noqa: F401 - register all tables on shared metadata
        from app.api.v1.auth import REFRESH_COOKIE_NAME, refresh_access_token
        from app.core.security import get_password_hash
        from app.models.base import Base
        from app.models.refresh_session import RefreshSession
        from app.models.user import User
        from app.services.auth import AuthService

        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        db = sessionmaker(bind=engine)()
        user = User(
            username="security-admin",
            email="security@example.test",
            hashed_password=get_password_hash("test-password"),
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()

        login = AuthService.login_user(db, user.username, "test-password")
        original = db.query(RefreshSession).one()
        request = Request(
            {
                "type": "http",
                "method": "POST",
                "path": "/api/v1/auth/refresh",
                "headers": [
                    (
                        b"cookie",
                        f"{REFRESH_COOKIE_NAME}={login['refresh_token']}".encode(),
                    )
                ],
                "client": ("127.0.0.1", 12345),
                "server": ("testserver", 80),
                "scheme": "http",
                "query_string": b"",
            }
        )
        response = Response()

        result = refresh_access_token(request, response, body=None, db=db)

        db.refresh(original)
        assert result["access_token"]
        assert original.revoked_at is not None
        assert db.query(RefreshSession).count() == 2
        assert "HttpOnly" in response.headers["set-cookie"]

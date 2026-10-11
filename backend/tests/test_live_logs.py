"""实时日志端点测试

覆盖：初始加载返回最新 N 条、游标增量拉取、内部流量排除、参数校验、认证要求。
数据写入 SQLite 测试库（复用 conftest 引擎），用例间清空隔离。
"""
from datetime import datetime, timedelta

import pytest

from app.api.deps import get_current_active_superuser
from app.models.base import Base as ModelsBase
from app.models.request_log import RequestLog
from tests.conftest import TestingSessionLocal, engine


class _FakeSuperUser:
    is_superuser = True
    is_active = True


@pytest.fixture(autouse=True, scope="module")
def _prepare_request_logs_table():
    ModelsBase.metadata.create_all(
        bind=engine,
        tables=[RequestLog.__table__],  # type: ignore[list-item]
    )
    _clear_request_logs()
    yield
    _clear_request_logs()


@pytest.fixture(autouse=True)
def _isolate_request_logs():
    _clear_request_logs()
    yield
    _clear_request_logs()


def _clear_request_logs():
    db = TestingSessionLocal()
    try:
        db.query(RequestLog).delete()
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def live_client(client):
    from main import app

    app.dependency_overrides[get_current_active_superuser] = lambda: _FakeSuperUser()
    yield client
    app.dependency_overrides.pop(get_current_active_superuser, None)


def _seed_request_logs(rows):
    """写入 (ip, path, seconds_ago) 请求日志"""
    db = TestingSessionLocal()
    now = datetime.now()
    try:
        for ip, path, seconds_ago in rows:
            db.add(
                RequestLog(
                    ip_address=ip,
                    path=path,
                    method="GET",
                    referrer=None,
                    created_at=now - timedelta(seconds=seconds_ago),
                )
            )
        db.commit()
    finally:
        db.close()


class TestLiveLogs:
    def test_initial_load_returns_latest_first(self, live_client, db):
        _seed_request_logs(
            [
                ("8.8.8.8", "/a", 50),
                ("8.8.8.9", "/b", 40),
                ("8.8.8.10", "/c", 30),
            ]
        )
        resp = live_client.get("/api/v1/site-stats/live-logs", params={"limit": 2})
        assert resp.status_code == 200
        data = resp.json()
        # 初始加载返回最新的 2 条，新→旧排序
        assert [item["path"] for item in data["logs"]] == ["/c", "/b"]
        assert data["last_id"] == data["logs"][0]["id"]

    def test_cursor_returns_only_new_rows(self, live_client, db):
        _seed_request_logs(
            [
                ("8.8.8.8", "/old", 60),
                ("8.8.8.9", "/new1", 10),
            ]
        )
        first = live_client.get("/api/v1/site-stats/live-logs").json()
        cursor = first["last_id"]

        # 模拟时间推移：新增一条请求
        _seed_request_logs([("8.8.8.10", "/new2", 1)])
        second = live_client.get(
            "/api/v1/site-stats/live-logs", params={"after_id": cursor}
        ).json()
        assert [item["path"] for item in second["logs"]] == ["/new2"]
        assert second["last_id"] >= second["logs"][0]["id"] > cursor

        # 游标无新数据时返回空列表
        third = live_client.get(
            "/api/v1/site-stats/live-logs", params={"after_id": second["last_id"]}
        ).json()
        assert third["logs"] == []

    def test_excluded_ips_filtered(self, live_client, db, monkeypatch):
        from app.core.config import settings as app_settings

        monkeypatch.setattr(app_settings, "VISITOR_EXCLUDED_IPS", "testclient")
        monkeypatch.setattr(app_settings, "BACKEND_BASE_URL", "http://1.2.3.4:8000")
        _seed_request_logs(
            [
                ("testclient", "/internal", 5),
                ("1.2.3.4", "/ssr-self-call", 4),
                ("127.0.0.1", "/loopback", 3),
                ("8.8.8.8", "/real-visitor", 2),
            ]
        )
        resp = live_client.get("/api/v1/site-stats/live-logs")
        paths = [item["path"] for item in resp.json()["logs"]]
        assert paths == ["/real-visitor"]

    def test_log_item_shape(self, live_client, db):
        _seed_request_logs([("114.114.114.114", "/posts", 1)])
        resp = live_client.get("/api/v1/site-stats/live-logs")
        item = resp.json()["logs"][0]
        for key in ("id", "ip", "location", "method", "path", "time"):
            assert key in item

    @pytest.mark.parametrize("bad_limit", [0, 201, -5])
    def test_limit_out_of_range_rejected(self, live_client, bad_limit):
        resp = live_client.get(
            "/api/v1/site-stats/live-logs", params={"limit": bad_limit}
        )
        assert resp.status_code == 422

    def test_requires_authentication(self, client):
        resp = client.get("/api/v1/site-stats/live-logs")
        assert resp.status_code in (401, 403)

"""访客统计端点测试

覆盖：聚合正确性（流量/独立访客/TopIP/归属地分布）、时间范围边界、
参数校验、认证要求。数据写入 SQLite 测试库（conftest override_get_db）。
"""
import os
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
    """conftest 的 create_all 挂在另一个 Base 上，这里为本模块自建表。"""
    ModelsBase.metadata.create_all(
        bind=engine,
        tables=[RequestLog.__table__],  # type: ignore[list-item]
    )
    _clear_request_logs()
    yield
    _clear_request_logs()


@pytest.fixture(autouse=True)
def _isolate_request_logs():
    """用例间清空请求日志，避免统计断言被前序用例数据污染"""
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
def visitor_client(client):
    """在现有 client 上覆盖超管认证，避免测试依赖真实账号"""
    from main import app

    app.dependency_overrides[get_current_active_superuser] = lambda: _FakeSuperUser()
    yield client
    app.dependency_overrides.pop(get_current_active_superuser, None)


def _seed_request_logs(rows):
    """写入 (ip, path, hours_ago) 请求日志；默认 now 便于时间断言"""
    db = TestingSessionLocal()
    now = datetime.now()
    try:
        for ip, path, hours_ago in rows:
            db.add(
                RequestLog(
                    ip_address=ip,
                    path=path,
                    method="GET",
                    referrer=None,
                    created_at=now - timedelta(hours=hours_ago),
                )
            )
        db.commit()
    finally:
        db.close()


class TestVisitorStatsAggregation:
    def test_totals_and_top_ips_ordering(self, visitor_client, db):
        _seed_request_logs(
            [
                ("114.114.114.114", "/", 1),
                ("114.114.114.114", "/posts", 2),
                ("114.114.114.114", "/about", 3),
                ("192.168.1.100", "/", 1),
                ("8.8.8.8", "/", 4),
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        assert resp.status_code == 200
        data = resp.json()

        assert data["unique_visitors"] == 3
        assert data["total_requests"] == 5

        top = data["top_ips"]
        assert top[0]["ip"] == "114.114.114.114"
        assert top[0]["requests"] == 3
        # first_seen 早于 last_seen
        assert top[0]["first_seen"] < top[0]["last_seen"]

    def test_out_of_range_logs_excluded(self, visitor_client, db):
        _seed_request_logs(
            [
                ("9.9.9.9", "/", 1),  # 范围内
                ("9.9.9.10", "/", 20 * 24),  # 20 天前：7 天窗口外
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        assert resp.status_code == 200
        data = resp.json()
        assert data["unique_visitors"] == 1
        assert data["total_requests"] == 1

        # 30 天窗口应包含两条
        resp30 = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 30})
        assert resp30.json()["unique_visitors"] == 2

    def test_location_distribution_local_network(self, visitor_client, db):
        # 内网 IP 无需 qqwry.dat 即可归类，断言确定性（本机回环被排除，见 TestExcludedIps）
        _seed_request_logs(
            [
                ("192.168.1.5", "/", 2),
                ("10.0.0.8", "/", 3),
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        locations = {item["location"]: item for item in resp.json()["locations"]}
        assert "本地网络" in locations
        assert locations["本地网络"]["unique_visitors"] == 2
        assert locations["本地网络"]["requests"] == 2

    def test_province_distribution_aggregates_by_province(self, visitor_client, db):
        # 不依赖 qqwry.dat：内网归「本地网络」桶；公网 IP 由归属地服务解析
        _seed_request_logs(
            [
                ("192.168.1.5", "/", 1),
                ("10.0.0.8", "/", 2),
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        provinces = {
            item["province"]: item for item in resp.json()["province_distribution"]
        }
        assert provinces["本地网络"]["unique_visitors"] == 2
        assert provinces["本地网络"]["requests"] == 2


@pytest.mark.skipif(
    not os.path.exists("data/qqwry.dat"),
    reason="本地无 qqwry.dat 数据文件",
)
class TestVisitorStatsWithGeoLibrary:
    def test_location_distribution_geolocation(self, visitor_client, db):
        _seed_request_logs(
            [
                ("114.114.114.114", "/", 1),
                ("114.114.114.114", "/posts", 2),
                ("223.5.5.5", "/", 1),
                ("8.8.8.8", "/", 1),
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        assert resp.status_code == 200
        locations = {item["location"]: item for item in resp.json()["locations"]}

        assert locations["江苏 南京"]["requests"] == 2
        assert locations["浙江 杭州"]["unique_visitors"] == 1
        assert locations["美国"]["unique_visitors"] == 1
        # 按独立访客数降序排列
        counts = [item["unique_visitors"] for item in resp.json()["locations"]]
        assert counts == sorted(counts, reverse=True)

    def test_top_ip_carries_location(self, visitor_client, db):
        _seed_request_logs([("114.114.114.114", "/", 1)])
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        assert resp.json()["top_ips"][0]["location"] == "江苏 南京"

    def test_province_distribution_with_geo_library(self, visitor_client, db):
        _seed_request_logs(
            [
                ("114.114.114.114", "/", 1),  # 江苏 南京
                ("223.5.5.5", "/", 2),  # 浙江 杭州
                ("8.8.8.8", "/", 3),  # 美国
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        provinces = {
            item["province"]: item for item in resp.json()["province_distribution"]
        }
        assert provinces["江苏"]["unique_visitors"] == 1
        assert provinces["浙江"]["requests"] == 1
        assert provinces["海外"]["unique_visitors"] == 1

    def test_country_distribution_with_geo_library(self, visitor_client, db):
        _seed_request_logs(
            [
                ("114.114.114.114", "/", 1),  # 江苏 南京 → 中国
                ("223.5.5.5", "/", 2),  # 浙江 杭州 → 中国
                ("8.8.8.8", "/", 3),  # 美国
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        countries = {
            item["country"]: item for item in resp.json()["country_distribution"]
        }
        assert countries["中国"]["unique_visitors"] == 2
        assert countries["中国"]["requests"] == 2
        assert countries["美国"]["unique_visitors"] == 1
        assert countries["美国"]["requests"] == 1

    def test_country_distribution_local_network(self, visitor_client, db):
        _seed_request_logs(
            [
                ("192.168.1.5", "/", 1),
                ("10.0.0.8", "/", 1),
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors", params={"days": 7})
        countries = {
            item["country"]: item for item in resp.json()["country_distribution"]
        }
        assert countries["本地网络"]["unique_visitors"] == 2


class TestVisitorStatsValidation:
    def test_requires_authentication(self, client):
        # 不带超管 override 的裸 client（无 Authorization 头）
        resp = client.get("/api/v1/site-stats/visitors")
        assert resp.status_code in (401, 403)

    @pytest.mark.parametrize("bad_days", [0, -1, 31, 999])
    def test_days_out_of_range_rejected(self, visitor_client, bad_days):
        resp = visitor_client.get(
            "/api/v1/site-stats/visitors", params={"days": bad_days}
        )
        assert resp.status_code == 422

    def test_default_days_is_7(self, visitor_client, db):
        _seed_request_logs([("114.114.114.114", "/", 6 * 24)])
        resp = visitor_client.get("/api/v1/site-stats/visitors")
        assert resp.status_code == 200
        assert resp.json()["days"] == 7


class TestExcludedIps:
    """服务器自身与内部调用不应计入游客统计"""

    def test_loopback_excluded_by_default(self, visitor_client, db):
        _seed_request_logs(
            [
                ("127.0.0.1", "/", 1),
                ("8.8.8.8", "/", 1),
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors")
        data = resp.json()
        assert data["unique_visitors"] == 1
        assert [item["ip"] for item in data["top_ips"]] == ["8.8.8.8"]

    def test_backend_base_url_host_excluded(self, visitor_client, db, monkeypatch):
        from app.core.config import settings as app_settings

        monkeypatch.setattr(app_settings, "BACKEND_BASE_URL", "http://1.2.3.4:8000")
        _seed_request_logs(
            [
                ("1.2.3.4", "/", 1),
                ("1.2.3.4", "/posts", 2),
                ("8.8.8.8", "/", 1),
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors")
        data = resp.json()
        assert data["unique_visitors"] == 1
        assert data["total_requests"] == 1

    def test_env_extra_excluded_ips(self, visitor_client, db, monkeypatch):
        from app.core.config import settings as app_settings

        monkeypatch.setattr(
            app_settings, "VISITOR_EXCLUDED_IPS", "testclient , 9.9.9.9"
        )
        _seed_request_logs(
            [
                ("testclient", "/", 1),
                ("9.9.9.9", "/", 1),
                ("8.8.8.8", "/", 1),
            ]
        )
        resp = visitor_client.get("/api/v1/site-stats/visitors")
        assert resp.json()["unique_visitors"] == 1

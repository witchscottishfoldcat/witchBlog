"""站点配置前台缓存刷新端点测试

覆盖 POST /api/v1/site-config/revalidate-frontend：
- 匿名 401、普通用户 403（仅超管可触发）
- 未配置 FRONTEND_BASE_URL / FRONTEND_REVALIDATE_SECRET 时 400（fail fast，
  不允许静默成功让后台误以为缓存已刷新）
- 配置齐全时代理调用前台 /api/site-config/revalidate 并透传结果
- 前台返回非 200 或网络异常时 502

注意：自建内存引擎（conftest 建表对模型 Base 无效），不用 lifespan。
"""
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.base import Base as ModelsBase
from app.models.user import User
from main import app

REVALIDATE_API = "/api/v1/site-config/revalidate-frontend"

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

ADMIN_USERNAME = "admin_revalidate"
ADMIN_PASSWORD = "AdminPass123!"
USER_USERNAME = "normal_revalidate"
USER_PASSWORD = "UserPass123!"


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _seed_users():
    db = TestingSessionLocal()
    try:
        if not db.query(User).filter(User.username == ADMIN_USERNAME).first():
            db.add(
                User(
                    username=ADMIN_USERNAME,
                    email="admin_revalidate@example.com",
                    hashed_password=get_password_hash(ADMIN_PASSWORD),
                    is_active=True,
                    is_superuser=True,
                )
            )
        if not db.query(User).filter(User.username == USER_USERNAME).first():
            db.add(
                User(
                    username=USER_USERNAME,
                    email="normal_revalidate@example.com",
                    hashed_password=get_password_hash(USER_PASSWORD),
                    is_active=True,
                    is_superuser=False,
                )
            )
        db.commit()
    finally:
        db.close()


def _login(client: TestClient, username: str, password: str) -> dict:
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
    )
    assert resp.status_code == 200, f"登录失败: {resp.status_code} {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture(scope="module")
def client():
    ModelsBase.metadata.create_all(bind=engine)
    # 记录先前的 get_db 覆盖（conftest 的全局覆盖）：teardown 必须恢复而非 pop，
    # 否则后续模块会静默失去覆盖、连上真实数据库
    previous_get_db_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = _override_get_db
    _seed_users()
    yield TestClient(app)
    if previous_get_db_override is not None:
        app.dependency_overrides[get_db] = previous_get_db_override
    else:
        app.dependency_overrides.pop(get_db, None)
    ModelsBase.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def admin_header(client: TestClient) -> dict:
    return _login(client, ADMIN_USERNAME, ADMIN_PASSWORD)


@pytest.fixture(scope="module")
def user_header(client: TestClient) -> dict:
    return _login(client, USER_USERNAME, USER_PASSWORD)


def test_reject_anonymous(client: TestClient):
    resp = client.post(REVALIDATE_API)
    assert resp.status_code == 401


def test_reject_non_superuser(client: TestClient, user_header: dict):
    resp = client.post(REVALIDATE_API, headers=user_header)
    assert resp.status_code == 403


def test_fails_fast_when_not_configured(
    client: TestClient, admin_header: dict, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "FRONTEND_BASE_URL", "")
    monkeypatch.setattr(settings, "FRONTEND_REVALIDATE_SECRET", "")
    resp = client.post(REVALIDATE_API, headers=admin_header)
    assert resp.status_code == 400
    # 全局异常处理器会改写响应体结构，只断言消息文本存在
    assert "FRONTEND_BASE_URL" in resp.text


def _mock_post(status_code: int = 200, payload: dict | None = None) -> AsyncMock:
    resp_mock = MagicMock()
    resp_mock.status_code = status_code
    resp_mock.json = MagicMock(return_value=payload or {"success": True})
    return AsyncMock(return_value=resp_mock)


def test_proxies_to_frontend_and_passes_through(
    client: TestClient, admin_header: dict, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "FRONTEND_BASE_URL", "http://frontend.test/")
    monkeypatch.setattr(settings, "FRONTEND_REVALIDATE_SECRET", "unit-secret")
    payload = {"success": True, "revalidated": 25}
    post_mock = _mock_post(200, payload)

    with patch("app.api.v1.site_config.httpx.AsyncClient.post", post_mock):
        resp = client.post(REVALIDATE_API, headers=admin_header)

    assert resp.status_code == 200
    assert resp.json() == payload
    # 请求发给前台 revalidate 路由，secret 放在请求体中
    assert post_mock.await_count == 1
    assert post_mock.await_args is not None
    args, kwargs = post_mock.await_args
    assert args[0] == "http://frontend.test/api/site-config/revalidate"
    assert kwargs["json"] == {"secret": "unit-secret"}


def test_maps_frontend_auth_failure_to_502(
    client: TestClient, admin_header: dict, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "FRONTEND_BASE_URL", "http://frontend.test")
    monkeypatch.setattr(settings, "FRONTEND_REVALIDATE_SECRET", "wrong-secret")

    with patch(
        "app.api.v1.site_config.httpx.AsyncClient.post",
        _mock_post(401),
    ):
        resp = client.post(REVALIDATE_API, headers=admin_header)

    assert resp.status_code == 502
    assert "REVALIDATE_SECRET" in resp.text


def test_maps_network_error_to_502(
    client: TestClient, admin_header: dict, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "FRONTEND_BASE_URL", "http://frontend.test")
    monkeypatch.setattr(settings, "FRONTEND_REVALIDATE_SECRET", "unit-secret")

    with patch(
        "app.api.v1.site_config.httpx.AsyncClient.post",
        AsyncMock(side_effect=httpx.ConnectError("connection refused")),
    ):
        resp = client.post(REVALIDATE_API, headers=admin_header)

    assert resp.status_code == 502
    assert "网络错误" in resp.text

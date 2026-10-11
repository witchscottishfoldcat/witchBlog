import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Offline tests must not load an operator's production environment file.
# Live service checks remain an explicit opt-in with WITCHCAT_LIVE_TESTS=1.
if not os.getenv("WITCHCAT_LIVE_TESTS"):
    os.environ["ENV_FILE"] = ".env.test"
    os.environ["ENVIRONMENT"] = "development"
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.middleware import request_stats as _request_stats
from app.middleware.request_stats import RequestStatsMiddleware
from app.models.user import User
from main import app

# 测试数据库URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """覆盖数据库依赖"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def _discard_request_log(item):
    """测试流量不进入请求日志队列：后台消费者写的是 app 级数据库（真实库），
    入队会把测试请求记录污染进生产 request_logs"""
    return None


_request_stats._REQUEST_LOG_QUEUE.put_nowait = _discard_request_log  # type: ignore[method-assign]  # noqa: E501
# 建表探测走 MySQL 方言（SHOW TABLES）且连真实库，测试环境下跳过
RequestStatsMiddleware._create_request_logs_table = (  # type: ignore[method-assign]
    lambda self: None
)


@pytest.fixture(scope="session")
def db():
    """创建测试数据库"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client(db):
    """创建测试客户端"""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user():
    """测试用户数据"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
    }


@pytest.fixture
def test_text():
    """测试文本数据"""
    return {
        "title": "测试文本",
        "content": "这是一个测试文本内容，用于测试API功能。",
        "author": "测试作者",
        "category": "test",
        "tags": ["测试", "API"],
        "is_public": True,
    }


def seed_user(
    username: str = "testuser",
    email: str = "test@example.com",
    password: str = "testpassword123",
    full_name: str = "Test User",
    is_superuser: bool = False,
) -> int:
    """直接在测试库播种用户。

    /auth/register 默认关闭（ENABLE_OPEN_REGISTRATION=False）、/users/ 仅超管可用，
    测试无法通过公开端点建用户，走 DB 直插。
    """
    db = TestingSessionLocal()
    try:
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_superuser=is_superuser,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user.id
    finally:
        db.close()


def remove_user(user_id: int) -> None:
    db = TestingSessionLocal()
    try:
        db.query(User).filter(User.id == user_id).delete()
        db.commit()
    finally:
        db.close()


def login_headers(client: TestClient, username: str, password: str) -> dict:
    """登录并返回 Authorization 头"""
    resp = client.post(
        "/api/v1/auth/login", data={"username": username, "password": password}
    )
    assert resp.status_code == 200, f"登录失败: {resp.status_code} {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture
def seeded_user(db):
    """播种普通测试用户，用例结束后清理"""
    uid = seed_user()
    try:
        yield {
            "id": uid,
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
        }
    finally:
        remove_user(uid)


@pytest.fixture
def user_headers(client, seeded_user):
    """普通用户的认证头"""
    return login_headers(client, seeded_user["username"], seeded_user["password"])

"""链接随机接口路由回归测试

回归背景：GET /links/random 曾被先声明的 GET /links/{link_id} 遮蔽，
请求永远 422（link_id int 解析失败）。路由顺序修复后必须保持可达。

注意：
- conftest 的建表 fixture 使用 app.core.database.Base（无模型注册），
  对实际继承 app.models.base.Base 的模型无效，故此处自建引擎并按模型 Base 建表。
- 不以上下文管理器方式使用 TestClient：避免触发应用 lifespan
  （启动逻辑会连接 MySQL/MinIO 等外部服务）；路由分发不依赖 lifespan。
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.models.base import Base as ModelsBase
from main import app

# 内存 SQLite + StaticPool：TestClient 在独立线程处理请求，
# 必须共享单一连接，否则各线程各见一个空库
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    ModelsBase.metadata.create_all(bind=engine)
    # 记录先前的 get_db 覆盖（conftest 的全局覆盖）：teardown 必须恢复而非 pop，
    # 否则后续模块会静默失去覆盖、连上真实数据库
    previous_get_db_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    if previous_get_db_override is not None:
        app.dependency_overrides[get_db] = previous_get_db_override
    else:
        app.dependency_overrides.pop(get_db, None)
    ModelsBase.metadata.drop_all(bind=engine)


def test_random_route_is_reachable(client: TestClient):
    response = client.get("/api/v1/links/random")
    assert response.status_code == 200
    assert response.json() == []


def test_random_route_with_custom_category(client: TestClient):
    response = client.get("/api/v1/links/random", params={"category": "论坛"})
    assert response.status_code == 200


def test_random_route_with_builtin_category(client: TestClient):
    response = client.get("/api/v1/links/random", params={"category": "friend"})
    assert response.status_code == 200


def test_random_route_with_empty_category_query(client: TestClient):
    response = client.get("/api/v1/links/random", params={"category": ""})
    assert response.status_code == 200


def test_random_by_category_route(client: TestClient):
    response = client.get("/api/v1/links/random/论坛")
    assert response.status_code == 200


def test_random_by_category_route_rejects_overlong(client: TestClient):
    response = client.get("/api/v1/links/random/" + "超" * 51)
    assert response.status_code == 400


def test_get_link_by_id_still_resolves(client: TestClient):
    response = client.get("/api/v1/links/999999")
    assert response.status_code == 404
    # 全局异常处理器会改写响应体结构，只断言消息文本存在
    assert "链接不存在" in response.text

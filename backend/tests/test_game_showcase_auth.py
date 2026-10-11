"""游戏展示 API 鉴权与 R18 过滤回归测试

回归背景（2026-09-19 安全修复，含独立评审补漏）：
1. GET /api/v1/game-showcase/* 曾完全无鉴权，且 is_r18 查询参数直接透传，
   后台设为隐藏的 R18 游戏可被匿名枚举。修复后所有 GET 必须超级管理员。
2. 公开路由 /games 的列表与概览虽过滤 R18，但 /games/{id} 详情、
   /games/random、/games/stats 三个端点此前同样泄露 R18 内容（逐 ID
   枚举即可拿到）。修复后公开路由全部路径强制 is_r18=False。

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
from app.core.security import get_password_hash
from app.models.base import Base as ModelsBase
from app.models.game_showcase import GameShowcase as GameShowcaseModel
from app.models.user import User
from main import app

# 内存 SQLite + StaticPool：TestClient 在独立线程处理请求，
# 必须共享单一连接，否则各线程各见一个空库
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

ADMIN_USERNAME = "admin_r18"
ADMIN_PASSWORD = "AdminPass123!"
USER_USERNAME = "normal_r18"
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
                    email="admin_r18@example.com",
                    hashed_password=get_password_hash(ADMIN_PASSWORD),
                    is_active=True,
                    is_superuser=True,
                )
            )
        if not db.query(User).filter(User.username == USER_USERNAME).first():
            db.add(
                User(
                    username=USER_USERNAME,
                    email="normal_r18@example.com",
                    hashed_password=get_password_hash(USER_PASSWORD),
                    is_active=True,
                    is_superuser=False,
                )
            )
        # 种入公开/隐藏游戏各一：公开路由任何路径都不得暴露 R18 那条
        if db.query(GameShowcaseModel).count() == 0:
            db.add(
                GameShowcaseModel(
                    title="公开游戏",
                    platform="pc",
                    category="rpg",
                    status="playing",
                    play_time=60,
                    is_active=True,
                    is_r18=False,
                )
            )
            db.add(
                GameShowcaseModel(
                    title="隐藏R18游戏",
                    platform="pc",
                    category="rpg",
                    status="playing",
                    play_time=120,
                    is_active=True,
                    is_r18=True,
                )
            )
        db.commit()
    finally:
        db.close()


def _get_r18_game() -> GameShowcaseModel:
    db = TestingSessionLocal()
    try:
        item = (
            db.query(GameShowcaseModel)
            .filter(GameShowcaseModel.title == "隐藏R18游戏")
            .first()
        )
        assert item is not None, "前置数据缺失：隐藏R18游戏"
        return item
    finally:
        db.close()


def _login(client: TestClient, username: str, password: str) -> str:
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
    )
    assert resp.status_code == 200, f"登录失败: {resp.status_code} {resp.text}"
    return resp.json()["access_token"]


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


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
    return _auth_header(_login(client, ADMIN_USERNAME, ADMIN_PASSWORD))


@pytest.fixture(scope="module")
def user_header(client: TestClient) -> dict:
    return _auth_header(_login(client, USER_USERNAME, USER_PASSWORD))


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/game-showcase/",
        "/api/v1/game-showcase/list",
        "/api/v1/game-showcase/stats",
        "/api/v1/game-showcase/stats/status",
        "/api/v1/game-showcase/stats/platform",
        "/api/v1/game-showcase/stats/category",
        "/api/v1/game-showcase/999999",
    ],
)
def test_admin_reads_reject_anonymous(client: TestClient, path: str):
    """后台读取接口匿名必须 401（此前 R18 内容匿名可查）"""
    resp = client.get(path)
    assert resp.status_code == 401, f"{path} 匿名访问返回 {resp.status_code}"


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/game-showcase/",
        "/api/v1/game-showcase/list",
        "/api/v1/game-showcase/stats",
        "/api/v1/game-showcase/999999",
    ],
)
def test_admin_reads_reject_non_superuser(
    client: TestClient, user_header: dict, path: str
):
    """普通登录用户不是超级管理员，必须 403"""
    resp = client.get(path, headers=user_header)
    assert resp.status_code == 403, f"{path} 普通用户访问返回 {resp.status_code}"


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/game-showcase/",
        "/api/v1/game-showcase/list",
        "/api/v1/game-showcase/stats",
        "/api/v1/game-showcase/stats/status",
        "/api/v1/game-showcase/stats/platform",
        "/api/v1/game-showcase/stats/category",
        "/api/v1/game-showcase/999999",
    ],
)
def test_admin_reads_allow_superuser(client: TestClient, admin_header: dict, path: str):
    """超级管理员仍可正常使用后台读取接口（不存在的 id 返回 404 而非 401/403）"""
    resp = client.get(path, headers=admin_header)
    assert resp.status_code in (200, 404), f"{path} 超管访问返回 {resp.status_code}"
    if path.endswith("999999"):
        assert resp.status_code == 404


def test_public_games_route_stays_anonymous(client: TestClient):
    """公开路由 /games 不受影响，匿名仍可访问"""
    resp = client.get("/api/v1/games/")
    assert resp.status_code == 200


# ==================== 公开路由 R18 过滤（评审补漏 F1） ====================


def test_public_detail_hides_r18(client: TestClient):
    """匿名逐 ID 枚举 /games/{id} 不得拿到 R18 游戏（此前仅查 is_active）"""
    r18 = _get_r18_game()
    resp = client.get(f"/api/v1/games/{r18.id}")
    assert resp.status_code == 404


def test_public_detail_still_shows_normal_game(client: TestClient):
    """非 R18 游戏详情不受影响"""
    db = TestingSessionLocal()
    try:
        normal = (
            db.query(GameShowcaseModel)
            .filter(GameShowcaseModel.title == "公开游戏")
            .first()
        )
    finally:
        db.close()
    assert normal is not None, "前置数据缺失：公开游戏"
    resp = client.get(f"/api/v1/games/{normal.id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "公开游戏"


def test_public_random_excludes_r18(client: TestClient):
    """/games/random 此前只过滤 is_active，R18 会出现在随机推荐里"""
    r18 = _get_r18_game()
    resp = client.get("/api/v1/games/random", params={"count": 20})
    assert resp.status_code == 200
    assert r18.id not in [g["id"] for g in resp.json()]


def test_public_stats_exclude_r18(client: TestClient):
    """/games/stats 此前未过滤，计数会包含隐藏的 R18 游戏"""
    resp = client.get("/api/v1/games/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_games"] == 1
    assert stats["total_play_time"] == 60
    assert all(s["platform"] != "r18-only" for s in stats["platform_stats"])


def test_public_overview_and_list_exclude_r18(client: TestClient):
    """/games/ 概览与 /games/list 此前已正确过滤，钉住防止回归"""
    r18 = _get_r18_game()

    overview = client.get("/api/v1/games/")
    assert overview.status_code == 200
    body = overview.json()
    assert body["stats"]["total_games"] == 1
    for section in ("recent_games", "playing_games", "favorite_games"):
        assert r18.id not in [g["id"] for g in body[section]]

    listing = client.get("/api/v1/games/list", params={"page": 1, "size": 20})
    assert listing.status_code == 200
    assert r18.id not in [g["id"] for g in listing.json()["items"]]


def test_admin_still_reads_r18_game(client: TestClient, admin_header: dict):
    """超管经后台接口仍能读取 R18 游戏（过滤只针对公开面）"""
    r18 = _get_r18_game()
    resp = client.get(f"/api/v1/game-showcase/{r18.id}", headers=admin_header)
    assert resp.status_code == 200
    assert resp.json()["is_r18"] is True

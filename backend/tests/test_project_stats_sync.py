"""sync_project_repo_stats 项目仓库统计同步测试

覆盖：正常更新、幂等（数值未变不写入）、单仓失败隔离、
私有仓库跳过、不支持平台跳过、owner/仓库名缺失时回退 URL 解析。
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.core.database as database_module
import app.tasks.project_tasks as project_tasks_module
from app.core.database import Base
from app.models.project_info import ProjectInfo
from app.tasks.project_tasks import sync_project_repo_stats


@pytest.fixture()
def sqlite_session_factory(monkeypatch):
    """内存库 + 仅建 project_info 表，并把任务的 SessionLocal 指过去"""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # __table__ 的静态类型是 FromClause，create_all 的 tables 参数需要 Table
    Base.metadata.create_all(
        bind=engine,
        tables=[ProjectInfo.__table__],  # type: ignore[list-item]
    )
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    monkeypatch.setattr(database_module, "SessionLocal", session_factory)
    yield session_factory
    engine.dispose()


def _make_project(**overrides) -> ProjectInfo:
    """构造一条 github 仓库记录，字段可按用例覆盖"""
    defaults = dict(
        name="示例项目",
        url="https://github.com/foo/bar",
        platform="github",
        owner="foo",
        repository_name="bar",
        stars_count=1,
        forks_count=2,
        is_private=0,
    )
    defaults.update(overrides)
    # url 有唯一约束：未显式指定时按仓库名生成，避免多行种子冲突
    if "url" not in overrides:
        defaults["url"] = f"https://github.com/foo/{defaults['repository_name']}"
    return ProjectInfo(**defaults)


def _seed(session_factory, projects):
    db = session_factory()
    db.add_all(projects)
    db.commit()
    ids = [p.id for p in projects]
    db.close()
    return ids


def test_sync_updates_stars_and_forks(sqlite_session_factory, monkeypatch):
    """数值变化时写入新 star/fork，返回信息包含更新统计"""
    ids = _seed(
        sqlite_session_factory,
        [
            _make_project(stars_count=1, forks_count=2),
            _make_project(
                name="Gitee 项目",
                url="https://gitee.com/a/b",
                platform="gitee",
                owner="a",
                repository_name="b",
            ),
        ],
    )

    monkeypatch.setattr(
        project_tasks_module,
        "_fetch_repo_stats",
        lambda platform, owner, repo: (42, 7),
    )

    result = sync_project_repo_stats()
    assert "更新 2" in result

    db = sqlite_session_factory()
    try:
        for pid in ids:
            row = db.query(ProjectInfo).filter(ProjectInfo.id == pid).first()
            assert row.stars_count == 42
            assert row.forks_count == 7
    finally:
        db.close()


def test_sync_is_idempotent_when_counts_unchanged(sqlite_session_factory, monkeypatch):
    """数值未变时不计入更新"""
    _seed(sqlite_session_factory, [_make_project(stars_count=10, forks_count=20)])

    monkeypatch.setattr(
        project_tasks_module,
        "_fetch_repo_stats",
        lambda platform, owner, repo: (10, 20),
    )

    result = sync_project_repo_stats()
    assert "更新 0" in result


def test_sync_continues_when_single_repo_fails(sqlite_session_factory, monkeypatch):
    """单个仓库拉取失败不影响其余仓库，失败行保留旧值"""

    def fake_fetch(platform: str, owner: str, repo: str):
        if repo == "boom":
            return None
        return (99, 9)

    ids = _seed(
        sqlite_session_factory,
        [
            _make_project(repository_name="ok", stars_count=1, forks_count=1),
            _make_project(repository_name="boom", stars_count=5, forks_count=5),
        ],
    )

    monkeypatch.setattr(project_tasks_module, "_fetch_repo_stats", fake_fetch)

    result = sync_project_repo_stats()
    assert "更新 1" in result
    assert "失败 1" in result

    db = sqlite_session_factory()
    try:
        ok_row = db.query(ProjectInfo).filter(ProjectInfo.id == ids[0]).first()
        boom_row = db.query(ProjectInfo).filter(ProjectInfo.id == ids[1]).first()
        assert (ok_row.stars_count, ok_row.forks_count) == (99, 9)
        assert (boom_row.stars_count, boom_row.forks_count) == (5, 5)
    finally:
        db.close()


def test_sync_skips_private_projects(sqlite_session_factory, monkeypatch):
    """私有仓库公开 API 拉不到，直接跳过不发请求"""
    _seed(sqlite_session_factory, [_make_project(is_private=1)])

    calls = []

    def fake_fetch(platform: str, owner: str, repo: str):
        calls.append((platform, owner, repo))
        return (1, 1)

    monkeypatch.setattr(project_tasks_module, "_fetch_repo_stats", fake_fetch)

    result = sync_project_repo_stats()
    assert "跳过 1" in result
    assert calls == []


def test_sync_skips_unsupported_platform(sqlite_session_factory, monkeypatch):
    """未知平台无对应 API，跳过且不抛错"""
    _seed(
        sqlite_session_factory,
        [_make_project(platform="gitlab", url="https://gitlab.com/foo/bar")],
    )

    monkeypatch.setattr(
        project_tasks_module,
        "_fetch_repo_stats",
        lambda platform, owner, repo: (1, 1),
    )

    result = sync_project_repo_stats()
    assert "跳过 1" in result


def test_sync_resolves_owner_from_url_when_missing(sqlite_session_factory, monkeypatch):
    """owner/仓库名缺失时从项目 URL 解析（复用 parse_project_url 白名单）"""
    _seed(
        sqlite_session_factory,
        [
            _make_project(
                owner=None,
                repository_name=None,
                url="https://github.com/foo/bar",
            )
        ],
    )

    calls = []

    def fake_fetch(platform: str, owner: str, repo: str):
        calls.append((platform, owner, repo))
        return (3, 4)

    monkeypatch.setattr(project_tasks_module, "_fetch_repo_stats", fake_fetch)

    result = sync_project_repo_stats()
    assert "更新 1" in result
    assert calls == [("github", "foo", "bar")]

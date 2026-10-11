"""refresh_minio_urls 分页刷新回归测试

回归背景：旧实现 `.limit(100)` 无排序无游标，每小时重复刷新同样的
前 100 条；文件数超过一批后，后续文件的 URL 永远不会被刷新。
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.core.database as database_module
from app.core.database import Base
from app.models.md_file import MDFile
from app.services.minio_service import minio_service
from app.tasks.minio_tasks import URL_REFRESH_BATCH_SIZE, refresh_minio_urls


@pytest.fixture()
def sqlite_session_factory(monkeypatch):
    """内存库 + 仅建 md_files 表，并把任务的 SessionLocal 指过去"""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # __table__ 的静态类型是 FromClause，create_all 的 tables 参数需要 Table
    Base.metadata.create_all(
        bind=engine,
        tables=[MDFile.__table__],  # type: ignore[list-item]
    )
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    monkeypatch.setattr(database_module, "SessionLocal", session_factory)
    yield session_factory
    engine.dispose()


def _make_file(index: int) -> MDFile:
    return MDFile(
        title=f"文章 {index}",
        original_filename=f"post-{index}.md",
        object_name=f"md/post-{index}.md",
        bucket_name="witchcat-files",
        owner_id=1,
    )


def test_refresh_covers_all_files_beyond_one_batch(sqlite_session_factory, monkeypatch):
    """超过两批的文件全部被刷新，而不是永远只有前一批"""
    total = URL_REFRESH_BATCH_SIZE * 2 + 17
    db = sqlite_session_factory()
    db.add_all([_make_file(i) for i in range(total)])
    db.commit()
    db.close()

    monkeypatch.setattr(
        minio_service, "get_file_url", lambda name: f"https://proxy.test/oss/{name}"
    )

    updated = refresh_minio_urls()

    assert updated == total
    db = sqlite_session_factory()
    try:
        files = db.query(MDFile).order_by(MDFile.id).all()
        assert len(files) == total
        for f in files:
            assert f.file_url == f"https://proxy.test/oss/{f.object_name}"
    finally:
        db.close()


def test_refresh_is_idempotent_when_urls_already_current(
    sqlite_session_factory, monkeypatch
):
    """URL 已是最新时重复执行不产生写入"""
    db = sqlite_session_factory()
    db.add_all([_make_file(i) for i in range(5)])
    db.commit()
    db.close()

    monkeypatch.setattr(
        minio_service, "get_file_url", lambda name: f"https://proxy.test/oss/{name}"
    )
    assert refresh_minio_urls() == 5
    assert refresh_minio_urls() == 0


def test_refresh_continues_when_single_file_fails(sqlite_session_factory, monkeypatch):
    """单个文件刷新失败不影响其余文件"""

    def fake_url(name: str) -> str:
        if "boom" in name:
            raise RuntimeError("presign failed")
        return f"https://proxy.test/oss/{name}"

    db = sqlite_session_factory()
    ok = _make_file(1)
    bad = _make_file(2)
    bad.object_name = "md/boom.md"
    db.add_all([ok, bad])
    db.commit()
    bad_id = bad.id
    db.close()

    monkeypatch.setattr(minio_service, "get_file_url", fake_url)
    updated = refresh_minio_urls()

    assert updated == 1
    db = sqlite_session_factory()
    try:
        bad_row = db.query(MDFile).filter(MDFile.id == bad_id).first()
        assert bad_row.file_url is None  # 失败行保持原值
    finally:
        db.close()

"""MD 文件归档功能测试（服务层，hermetic）。

原版测试直连生产库且依赖真实 MinIO 与已移除的 `md_file_service` 单例；
本版改为：测试库 + 假 MinIO + 当前 `MDFileService` 类 API，
保留原场景全部步骤（创建→读内容→归档→原件删除→归档内容→列表→删归档→确认）。
"""

import pytest

from app.core.exceptions import NotFoundException
from app.schemas.md_file import MDFileCreate
from app.services.md_file import MDFileService
from app.services.md_file_archive import MDFileArchiveService
from tests.conftest import TestingSessionLocal

CONTENT = "# 测试归档文件\n\n" "这是一个测试文件，用于验证归档功能是否正常工作。\n\n" "## 测试内容\n\n这是一个测试段落。"


class _FakeMinio:
    """按 object_name 存取内容的内存 MinIO 替身"""

    def __init__(self):
        self._store = {}

    def upload_content(self, content, filename, folder, is_public=False, **kwargs):
        object_name = f"{folder}/{filename}"
        data = content.encode("utf-8") if isinstance(content, str) else content
        self._store[object_name] = data
        return {"object_name": object_name, "size": len(data), "etag": "fake"}

    def get_file_content(self, object_name):
        return self._store[object_name].decode("utf-8")

    def get_file_url(self, object_name, presigned=False):
        return f"http://fake-minio/{object_name}"

    def remove_object(self, object_name):
        self._store.pop(object_name, None)

    def delete_file(self, object_name):
        self._store.pop(object_name, None)
        return True


@pytest.fixture
def db_session(db):
    """真实测试会话（conftest 的 db fixture 只负责建表/删表，yield None）"""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def md_service():
    svc = MDFileService()
    svc.minio_service = _FakeMinio()  # type: ignore[assignment]
    return svc


@pytest.fixture
def archive_service(md_service):
    svc = MDFileArchiveService()
    # 归档流程读取原件内容与写入归档位置走同一个假存储
    svc.minio_service = md_service.minio_service
    return svc


def test_archive_function(db_session, md_service, archive_service):
    """归档全流程：创建→内容→归档→原件删除→归档内容→列表→删除归档→确认"""
    # 1. 创建测试文件
    file_data = MDFileCreate(
        title="测试归档文件",
        description="这是一个用于测试归档功能的文件",
        content=CONTENT,
        filename="test_archive.md",
        tags="测试,归档",
        is_public=True,
    )
    test_file = md_service.create_file(db_session, file_data, owner_id=1)
    assert test_file.id is not None
    assert test_file.title == "测试归档文件"

    # 2. 读取文件内容
    content = md_service.get_file_content(db_session, test_file.id, user_id=1)
    assert content == CONTENT

    # 3. 归档
    archive_record = archive_service.archive_file(
        db_session, test_file.id, "测试归档功能", user_id=1
    )
    assert archive_record.title == test_file.title
    assert archive_record.archive_reason == "测试归档功能"
    assert archive_record.archive_date is not None

    # 4. 原文件已删除
    with pytest.raises(NotFoundException):
        md_service.get_file(db_session, test_file.id, user_id=1)

    # 5. 归档内容与原件一致
    archive_content = archive_service.get_archive_content(
        db_session, archive_record.id, user_id=1
    )
    assert archive_content == content

    # 6. 归档列表包含该记录
    archives, total = archive_service.get_archives(db_session, owner_id=1)
    assert total >= 1
    assert any(a.id == archive_record.id for a in archives)

    # 7. 删除归档
    assert (
        archive_service.delete_archive(db_session, archive_record.id, user_id=1) is True
    )

    # 8. 归档已删除
    with pytest.raises(NotFoundException):
        archive_service.get_archive(db_session, archive_record.id, user_id=1)


def test_archive_permission_guard(db_session, md_service, archive_service):
    """非所有者读取他人私有归档记录应被拒绝"""
    file_data = MDFileCreate(
        title="权限测试文件",
        content=CONTENT,
        filename="perm_test.md",
        is_public=False,
    )
    test_file = md_service.create_file(db_session, file_data, owner_id=1)

    archive_record = archive_service.archive_file(
        db_session, test_file.id, "权限测试", user_id=1
    )
    with pytest.raises(NotFoundException, match="不存在或无权访问"):
        archive_service.get_archive(db_session, archive_record.id, user_id=2)

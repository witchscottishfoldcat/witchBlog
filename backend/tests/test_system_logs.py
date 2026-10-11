"""后端日志实时查看测试

覆盖：环形缓冲服务（append/read_after 游标、容量淘汰、消息截断）、
/system-logs/tail 端点（认证、游标增量、真实 loguru 日志流入）。
"""
import time

import pytest
from loguru import logger as loguru_logger

from app.api.deps import get_current_active_superuser
from app.core.log_buffer import LogBuffer, install_log_buffer_sink


class _FakeSuperUser:
    is_superuser = True
    is_active = True


class TestLogBuffer:
    def test_append_and_read_all(self):
        buffer = LogBuffer(maxlen=10)
        buffer.append(time="t1", level="INFO", logger_name="m", message="a")
        buffer.append(time="t2", level="WARNING", logger_name="m", message="b")
        entries, last_seq = buffer.read_after(0, 100)
        assert [e["message"] for e in entries] == ["a", "b"]
        assert last_seq == 2

    def test_cursor_returns_only_newer(self):
        buffer = LogBuffer(maxlen=10)
        for i in range(3):
            buffer.append(time=f"t{i}", level="INFO", logger_name="m", message=f"m{i}")
        entries, last_seq = buffer.read_after(1, 100)
        assert [e["seq"] for e in entries] == [2, 3]
        assert last_seq == 3

    def test_empty_read_keeps_cursor(self):
        buffer = LogBuffer(maxlen=10)
        buffer.append(time="t", level="INFO", logger_name="m", message="x")
        entries, last_seq = buffer.read_after(1, 100)
        assert entries == []
        assert last_seq == 1

    def test_maxlen_drops_oldest(self):
        buffer = LogBuffer(maxlen=5)
        for i in range(8):
            buffer.append(time=f"t{i}", level="INFO", logger_name="m", message=f"m{i}")
        entries, last_seq = buffer.read_after(0, 100)
        assert [e["message"] for e in entries] == ["m3", "m4", "m5", "m6", "m7"]
        assert last_seq == 8

    def test_limit_returns_latest_slice(self):
        buffer = LogBuffer(maxlen=100)
        for i in range(10):
            buffer.append(time=f"t{i}", level="INFO", logger_name="m", message=f"m{i}")
        entries, last_seq = buffer.read_after(0, 3)
        assert [e["message"] for e in entries] == ["m7", "m8", "m9"]
        assert last_seq == 10

    def test_message_truncated(self):
        buffer = LogBuffer(maxlen=10)
        buffer.append(time="t", level="INFO", logger_name="m", message="x" * 5000)
        entries, _ = buffer.read_after(0, 10)
        assert len(entries[0]["message"]) <= 2000


class _FakeSuperUserFixture:
    is_superuser = True
    is_active = True


@pytest.fixture()
def logs_client(client):
    from main import app

    app.dependency_overrides[
        get_current_active_superuser
    ] = lambda: _FakeSuperUserFixture()
    install_log_buffer_sink()
    yield client
    app.dependency_overrides.pop(get_current_active_superuser, None)


class TestSystemLogsEndpoint:
    def test_requires_authentication(self, client):
        resp = client.get("/api/v1/system-logs/tail")
        assert resp.status_code in (401, 403)

    def test_tail_captures_emitted_log(self, logs_client):
        token = f"live-probe-{time.time()}"
        loguru_logger.warning(f"[probe] {token}")
        time.sleep(0.05)
        resp = logs_client.get(
            "/api/v1/system-logs/tail", params={"after_seq": 0, "limit": 500}
        )
        assert resp.status_code == 200
        data = resp.json()
        messages = [e["message"] for e in data["entries"]]
        assert any(token in m for m in messages)

    def test_cursor_incremental(self, logs_client):
        marker = f"cursor-probe-{time.time()}"
        loguru_logger.info(f"[before] {marker}")
        time.sleep(0.05)
        first = logs_client.get(
            "/api/v1/system-logs/tail", params={"after_seq": 0, "limit": 500}
        ).json()
        cursor = first["last_seq"]

        loguru_logger.info(f"[after] {marker}")
        time.sleep(0.05)
        second = logs_client.get(
            "/api/v1/system-logs/tail", params={"after_seq": cursor, "limit": 500}
        ).json()
        joined = " ".join(e["message"] for e in second["entries"])
        assert f"[after] {marker}" in joined
        assert f"[before] {marker}" not in joined

    def test_entry_shape(self, logs_client):
        loguru_logger.error(f"shape-probe-{time.time()}")
        time.sleep(0.05)
        resp = logs_client.get("/api/v1/system-logs/tail", params={"limit": 500})
        entry = resp.json()["entries"][-1]
        for key in ("seq", "time", "level", "logger", "message"):
            assert key in entry

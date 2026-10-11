"""Startup behavior with every external operation replaced by a test adapter."""

import socket
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.core import database, db_manager, unified_logging
from app.services import init_service as initialization
from app.services.minio_policy_service import minio_policy_service


@pytest.fixture
def isolated_startup(monkeypatch):
    adapters = SimpleNamespace(
        logging=Mock(),
        tables=Mock(),
        fallback=Mock(),
        policies=Mock(return_value=True),
    )
    monkeypatch.setattr(initialization, "logger", Mock())
    monkeypatch.setattr(unified_logging, "init_logging", adapters.logging)
    monkeypatch.setattr(db_manager, "ensure_database_tables", adapters.tables)
    monkeypatch.setattr(database.Base.metadata, "create_all", adapters.fallback)
    monkeypatch.setattr(minio_policy_service, "setup_all_policies", adapters.policies)
    forbidden = Mock(side_effect=AssertionError("Startup tests must not perform I/O"))
    monkeypatch.setattr(socket.socket, "connect", forbidden)
    monkeypatch.setattr(database.engine, "connect", forbidden)
    yield initialization.InitService(), adapters
    forbidden.assert_not_called()


@pytest.mark.asyncio
async def test_startup_uses_adapters_and_does_not_repeat_storage_changes(
    isolated_startup,
):
    service, adapters = isolated_startup
    assert await service.initialize_all() is True
    assert [result.phase for result in service.results] == [
        initialization.InitPhase.LOGGING,
        initialization.InitPhase.DATABASE,
        initialization.InitPhase.STORAGE,
    ]
    assert await service.initialize_all() is True
    adapters.tables.assert_called_once_with(database.engine)
    adapters.policies.assert_called_once_with()
    adapters.fallback.assert_not_called()
    assert service.failed_results == []


@pytest.mark.parametrize(
    "policy_error", [False, RuntimeError("test storage unavailable")]
)
@pytest.mark.asyncio
async def test_storage_failure_is_reported_without_hiding_it(
    isolated_startup, policy_error
):
    service, adapters = isolated_startup
    if isinstance(policy_error, Exception):
        adapters.policies.side_effect = policy_error
    else:
        adapters.policies.return_value = policy_error
    assert await service.initialize_all() is False
    assert len(service.failed_results) == 1
    assert service.failed_results[0].phase == initialization.InitPhase.STORAGE


def test_logging_failure_is_a_failed_initialization_result(isolated_startup):
    service, adapters = isolated_startup
    error = RuntimeError("test logging unavailable")
    adapters.logging.side_effect = error
    result = service.init_logging()
    assert result.success is False
    assert result.error is error
    assert service.all_success is False


@pytest.mark.parametrize(
    "fallback_error", [None, RuntimeError("test database unavailable")]
)
def test_database_fallback_reports_its_actual_outcome(isolated_startup, fallback_error):
    service, adapters = isolated_startup
    adapters.tables.side_effect = RuntimeError("test table check unavailable")
    adapters.fallback.side_effect = fallback_error
    result = service.init_database()
    adapters.fallback.assert_called_once_with(bind=database.engine)
    assert result.success is (fallback_error is None)
    if fallback_error is None:
        assert result.details["fallback"] is True
    else:
        assert result.error is fallback_error


@pytest.mark.asyncio
async def test_shutdown_clears_startup_state(isolated_startup):
    service, _ = isolated_startup
    await service.initialize_all()
    await service.shutdown()
    assert service.results == []
    assert service._initialized is False


@pytest.mark.asyncio
async def test_startup_information_describes_success_and_failure(
    isolated_startup, monkeypatch
):
    service, adapters = isolated_startup
    assert "(无初始化记录)" in service.get_startup_message()
    monkeypatch.setattr(initialization.settings, "HOST", "0.0.0.0")
    adapters.policies.return_value = False
    await service.initialize_all()
    message = service.get_startup_message()
    assert "http://127.0.0.1:" in message
    assert "✓" in message and "✗" in message
    assert service.get_startup_info()["environment"] == "development"
    service.log_startup_info()

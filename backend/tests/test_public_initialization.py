"""Public export regression: initialization requires an operator-supplied password."""

from argparse import Namespace

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.schemas.link import LinkUpdate
from main import app, init_service
from scripts.maintenance import create_admin_user, init_db


def password_args(password=None, non_interactive=True):
    return Namespace(
        password=password, non_interactive=non_interactive, username="admin"
    )


def test_noninteractive_initialization_refuses_missing_password(capsys):
    with pytest.raises(SystemExit) as error:
        create_admin_user.resolve_password(password_args())
    assert error.value.code == 1
    assert "--password" in capsys.readouterr().out


def test_short_password_is_rejected():
    with pytest.raises(SystemExit):
        create_admin_user.resolve_password(password_args("short"))


def test_operator_password_is_used_without_echo(capsys):
    supplied = "TestOnly-PublicExport-Password"
    assert create_admin_user.resolve_password(password_args(supplied)) == supplied
    assert supplied not in capsys.readouterr().out


def test_interactive_password_must_match(monkeypatch):
    monkeypatch.setattr(create_admin_user, "_can_prompt", lambda: True)
    answers = iter(["TestOnly-FirstPassword", "TestOnly-OtherPassword"])
    monkeypatch.setattr(create_admin_user.getpass, "getpass", lambda _: next(answers))
    with pytest.raises(SystemExit):
        create_admin_user.resolve_password(password_args(non_interactive=False))


def test_no_console_does_not_attempt_password_prompt(monkeypatch):
    monkeypatch.setattr(create_admin_user, "_can_prompt", lambda: False)

    def unexpected_prompt(_):
        pytest.fail("Noninteractive execution must not prompt")

    monkeypatch.setattr(create_admin_user.getpass, "getpass", unexpected_prompt)
    with pytest.raises(SystemExit):
        create_admin_user.resolve_password(password_args(non_interactive=False))


def test_password_is_validated_before_database_mutation(monkeypatch):
    monkeypatch.setattr(init_db, "parse_args", password_args)

    def unexpected_mutation():
        pytest.fail("Missing password must be rejected before creating tables")

    monkeypatch.setattr(init_db, "create_tables", unexpected_mutation)
    with pytest.raises(SystemExit):
        init_db.main()


def test_link_image_update_accepts_storage_type():
    update = LinkUpdate(image_url="https://example.com/image.png")
    update.image_type = "minio"
    assert update.model_dump(exclude_unset=True)["image_type"] == "minio"


def test_link_image_update_rejects_unknown_storage_type():
    with pytest.raises(ValidationError):
        LinkUpdate(image_type="unsupported")


def test_offline_client_does_not_initialize_external_services(monkeypatch):
    async def forbidden_initialize():
        pytest.fail("Offline route tests must not initialize external services")

    monkeypatch.setattr(init_service, "initialize_all", forbidden_initialize)
    with TestClient(app) as client:
        assert client.get("/docs").status_code == 200


def test_shared_client_uses_offline_lifespan(client):
    assert app.router.lifespan_context.__name__ == "offline_lifespan"
    assert client.get("/docs").status_code == 200
    assert init_service._initialized is False

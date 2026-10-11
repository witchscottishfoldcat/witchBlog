"""链接分类校验测试

后台管理端允许自由填写链接分类（如"论坛"），
内置分类（friend/video/other）与自定义分类同等合法。
"""
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.v1.links import _validate_category_or_400
from app.schemas.link import (
    DEFAULT_LINK_CATEGORY,
    LINK_CATEGORY_MAX_LENGTH,
    LinkCreate,
    LinkUpdate,
    normalize_category,
)


@pytest.mark.parametrize("category", ["friend", "video", "other", "论坛", "博客导航"])
def test_create_link_accepts_builtin_and_custom_category(category):
    link = LinkCreate(name="测试", url="https://example.com", category=category)
    assert link.category == category


def test_create_link_strips_category_whitespace():
    link = LinkCreate(name="测试", url="https://example.com", category=" 论坛 ")
    assert link.category == "论坛"


def test_create_link_empty_category_falls_back_to_default():
    link = LinkCreate(name="测试", url="https://example.com", category="  ")
    assert link.category == DEFAULT_LINK_CATEGORY
    assert DEFAULT_LINK_CATEGORY == "friend"


def test_create_link_rejects_category_longer_than_column():
    with pytest.raises(ValidationError):
        LinkCreate(
            name="测试",
            url="https://example.com",
            category="超" * (LINK_CATEGORY_MAX_LENGTH + 1),
        )


def test_create_link_accepts_category_exactly_at_column_limit():
    link = LinkCreate(
        name="测试",
        url="https://example.com",
        category="超" * LINK_CATEGORY_MAX_LENGTH,
    )
    assert link.category == "超" * LINK_CATEGORY_MAX_LENGTH


def test_update_link_accepts_custom_category():
    link = LinkUpdate(category="论坛")
    assert link.category == "论坛"


def test_update_link_none_category_means_no_change():
    assert LinkUpdate().category is None


def test_update_link_rejects_category_longer_than_column():
    with pytest.raises(ValidationError):
        LinkUpdate(category="超" * (LINK_CATEGORY_MAX_LENGTH + 1))


def test_normalize_category_rejects_empty_without_default():
    with pytest.raises(ValueError):
        normalize_category("  ")


def test_normalize_category_rejects_empty_string_value():
    with pytest.raises(ValueError):
        normalize_category("")


def test_endpoint_guard_accepts_custom_category():
    assert _validate_category_or_400("论坛") == "论坛"
    assert _validate_category_or_400("friend") == "friend"


def test_endpoint_guard_rejects_empty_category():
    with pytest.raises(HTTPException) as exc_info:
        _validate_category_or_400("  ")
    assert exc_info.value.status_code == 400


def test_endpoint_guard_rejects_overlong_category():
    with pytest.raises(HTTPException) as exc_info:
        _validate_category_or_400("超" * (LINK_CATEGORY_MAX_LENGTH + 1))
    assert exc_info.value.status_code == 400

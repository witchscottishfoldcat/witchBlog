import pytest

pytest.skip(
    "texts 路由已在 api.py 中废弃禁用（include_router 被注释），测试待路由重启后恢复",
    allow_module_level=True,
)

import itertools  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402

from tests.conftest import login_headers, seed_user  # noqa: E402

_user_seq = itertools.count()


def get_auth_headers(client: TestClient, test_user=None):
    """获取认证头：每次播种独立用户，避免唯一约束冲突（注册端点默认关闭）"""
    username = f"textuser{next(_user_seq)}"
    seed_user(
        username=username,
        email=f"{username}@example.com",
        password="testpassword123",
    )
    return login_headers(client, username, "testpassword123")


def test_create_text(client: TestClient, test_user, test_text):
    """测试创建文本"""
    headers = get_auth_headers(client, test_user)

    response = client.post("/api/v1/texts/", json=test_text, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_text["title"]
    assert data["content"] == test_text["content"]
    assert data["author"] == test_text["author"]
    assert "id" in data
    assert data["word_count"] > 0
    assert data["char_count"] > 0


def test_get_texts(client: TestClient, test_user, test_text):
    """测试获取文本列表"""
    headers = get_auth_headers(client, test_user)

    # 创建文本
    client.post("/api/v1/texts/", json=test_text, headers=headers)

    # 获取文本列表
    response = client.get("/api/v1/texts/", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == test_text["title"]


def test_get_text(client: TestClient, test_user, test_text):
    """测试获取单个文本"""
    headers = get_auth_headers(client, test_user)

    # 创建文本
    create_response = client.post("/api/v1/texts/", json=test_text, headers=headers)
    text_id = create_response.json()["id"]

    # 获取文本
    response = client.get(f"/api/v1/texts/{text_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == text_id
    assert data["title"] == test_text["title"]


def test_update_text(client: TestClient, test_user, test_text):
    """测试更新文本"""
    headers = get_auth_headers(client, test_user)

    # 创建文本
    create_response = client.post("/api/v1/texts/", json=test_text, headers=headers)
    text_id = create_response.json()["id"]

    # 更新文本
    update_data = {"title": "Updated Title"}
    response = client.put(f"/api/v1/texts/{text_id}", json=update_data, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"


def test_delete_text(client: TestClient, test_user, test_text):
    """测试删除文本"""
    headers = get_auth_headers(client, test_user)

    # 创建文本
    create_response = client.post("/api/v1/texts/", json=test_text, headers=headers)
    text_id = create_response.json()["id"]

    # 删除文本
    response = client.delete(f"/api/v1/texts/{text_id}", headers=headers)

    assert response.status_code == 200

    # 验证文本已删除
    get_response = client.get(f"/api/v1/texts/{text_id}", headers=headers)
    assert get_response.status_code == 404


def test_analyze_text(client: TestClient, test_user, test_text):
    """测试文本分析"""
    headers = get_auth_headers(client, test_user)

    # 创建文本
    create_response = client.post("/api/v1/texts/", json=test_text, headers=headers)
    text_id = create_response.json()["id"]

    # 分析文本
    response = client.post(f"/api/v1/texts/{text_id}/analyze", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "word_count" in data
    assert "char_count" in data
    assert "keywords" in data
    assert "reading_time_minutes" in data


def test_search_texts(client: TestClient, test_user, test_text):
    """测试搜索文本"""
    headers = get_auth_headers(client, test_user)

    # 创建文本
    client.post("/api/v1/texts/", json=test_text, headers=headers)

    # 搜索文本
    response = client.get("/api/v1/texts/search?q=测试", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "测试" in data[0]["content"] or "测试" in data[0]["title"]

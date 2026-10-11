from fastapi.testclient import TestClient

from tests.conftest import login_headers, seed_user


def test_create_user(client: TestClient, db):
    """测试创建用户（超管经 /users/ 创建，超管由 DB 播种）"""
    seed_user(
        username="admin_creator",
        email="admin_creator@example.com",
        password="adminpass123",
        is_superuser=True,
    )
    headers = login_headers(client, "admin_creator", "adminpass123")
    payload = {
        "username": "created_user",
        "email": "created_user@example.com",
        "password": "testpassword123",
        "full_name": "Created User",
    }
    response = client.post("/api/v1/users/", json=payload, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == payload["username"]
    assert data["email"] == payload["email"]
    assert data["full_name"] == payload["full_name"]
    assert "id" in data
    assert "password" not in data  # 确保密码不被返回


def test_create_user_duplicate_username(client: TestClient, db):
    """测试创建重复用户名的用户"""
    seed_user(
        username="admin_dup",
        email="admin_dup@example.com",
        password="adminpass123",
        is_superuser=True,
    )
    headers = login_headers(client, "admin_dup", "adminpass123")
    payload = {
        "username": "dup_user",
        "email": "dup_user@example.com",
        "password": "testpassword123",
        "full_name": "Dup User",
    }
    first = client.post("/api/v1/users/", json=payload, headers=headers)
    assert first.status_code == 200

    # 尝试创建相同用户名的用户
    response = client.post("/api/v1/users/", json=payload, headers=headers)

    assert response.status_code == 400


def test_get_current_user(client: TestClient, user_headers, seeded_user):
    """测试获取当前用户信息"""
    response = client.get("/api/v1/users/me", headers=user_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == seeded_user["id"]
    assert data["username"] == seeded_user["username"]


def test_update_current_user(client: TestClient, user_headers):
    """测试更新当前用户信息"""
    update_data = {"full_name": "Updated Name"}
    response = client.put("/api/v1/users/me", json=update_data, headers=user_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"

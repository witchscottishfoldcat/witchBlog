from fastapi.testclient import TestClient


def test_login_success(client: TestClient, seeded_user):
    """测试登录成功（用户由 conftest 直接播种）"""
    login_data = {
        "username": seeded_user["username"],
        "password": seeded_user["password"],
    }
    response = client.post("/api/v1/auth/login", data=login_data)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client: TestClient):
    """测试登录失败"""
    login_data = {"username": "nonexistent", "password": "wrongpassword"}
    response = client.post("/api/v1/auth/login", data=login_data)

    assert response.status_code == 401


def test_test_token(client: TestClient, seeded_user):
    """测试令牌验证"""
    login_data = {
        "username": seeded_user["username"],
        "password": seeded_user["password"],
    }
    login_response = client.post("/api/v1/auth/login", data=login_data)
    token = login_response.json()["access_token"]

    # 测试令牌
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/v1/auth/test-token", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == seeded_user["username"]
    assert data["email"] == seeded_user["email"]

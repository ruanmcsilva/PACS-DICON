import pytest
from fastapi.testclient import TestClient

def test_health_endpoint(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "running" in data["message"]

def test_login_incorrect_credentials(client: TestClient):
    response = client.post(
        "/api/core/auth/login",
        data={"username": "wronguser", "password": "wrongpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect username or password"

def test_login_success(client: TestClient):
    response = client.post(
        "/api/core/auth/login",
        data={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_protected_routes_unauthorized(client: TestClient):
    # Try accessing a protected route without a token (should return 401 Unauthorized now)
    response = client.get("/api/pacs/studies")
    assert response.status_code == 401

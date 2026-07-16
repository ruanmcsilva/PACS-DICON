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

def test_dicom_nodes_crud(client: TestClient):
    # 1. Get auth token
    login_response = client.post(
        "/api/core/auth/login",
        data={"username": "admin", "password": "admin"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get list
    response = client.get("/api/pacs/dicom-nodes", headers=headers)
    assert response.status_code == 200
    nodes = response.json()
    assert isinstance(nodes, list)

    # 3. Create a new node
    node_payload = {
        "name": "Tomografo Sala 1",
        "ae_title": "CT_SALA1",
        "ip_address": "192.168.1.100",
        "port": 104
    }
    create_response = client.post("/api/pacs/dicom-nodes", json=node_payload, headers=headers)
    assert create_response.status_code == 200
    created_node = create_response.json()
    assert created_node["ae_title"] == "CT_SALA1"
    assert "id" in created_node

    # 4. Create duplicate (should fail)
    duplicate_response = client.post("/api/pacs/dicom-nodes", json=node_payload, headers=headers)
    assert duplicate_response.status_code == 400

    # 5. Delete the node
    node_id = created_node["id"]
    delete_response = client.delete(f"/api/pacs/dicom-nodes/{node_id}", headers=headers)
    assert delete_response.status_code == 200

    # 6. Delete again (should fail with 404)
    delete_response_2 = client.delete(f"/api/pacs/dicom-nodes/{node_id}", headers=headers)
    assert delete_response_2.status_code == 404

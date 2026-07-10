import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    # Using 'with' block triggers the lifespan startup and shutdown events
    with TestClient(app) as c:
        yield c

import pytest
from fastapi.testclient import TestClient
from app.main import app

# TestClient with lifespan context will trigger the FastAPI lifespan
# This ensures app.state is properly initialized

def test_read_root():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert data["name"] == "Deep OS API"

def test_system_status():
    with TestClient(app) as client:
        response = client.get("/api/system/status")
        assert response.status_code == 200
        data = response.json()
        assert "cpu" in data
        assert "ram" in data
        assert "disk" in data
        assert "pressure" in data

def test_processes_list():
    with TestClient(app) as client:
        response = client.get("/api/processes/")
        assert response.status_code == 200
        data = response.json()
        assert "processes" in data
        assert isinstance(data["processes"], list)
        assert len(data["processes"]) > 0  # Should have at least some processes

def test_prediction():
    with TestClient(app) as client:
        response = client.get("/api/prediction/")
        assert response.status_code == 200
        data = response.json()
        assert "predicted_app" in data
        assert "confidence" in data
        assert "reasons" in data

def test_focus_mode_get():
    with TestClient(app) as client:
        response = client.get("/api/focus/")
        assert response.status_code == 200
        data = response.json()
        assert "enabled" in data
        assert "level" in data

def test_focus_mode_post():
    with TestClient(app) as client:
        response = client.post("/api/focus/", json={"enabled": True, "level": 2})
        assert response.status_code == 200
        data = response.json()
        assert data["enabled"] == True
        assert data["level"] == 2

def test_settings_get():
    with TestClient(app) as client:
        response = client.get("/api/settings/")
        assert response.status_code == 200
        data = response.json()
        assert "settings" in data
        assert "CPU_THRESHOLD_WARNING" in data["settings"]

def test_applications_list():
    with TestClient(app) as client:
        response = client.get("/api/applications/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

def test_recommendations_list():
    with TestClient(app) as client:
        response = client.get("/api/recommendations/")
        assert response.status_code == 200

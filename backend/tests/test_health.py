from fastapi.testclient import TestClient


def test_health_check_endpoint(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "MeetMind" in data["app_name"]
    assert "database" in data
    assert "asr_provider" in data
    assert "llm_provider" in data
    assert "timestamp" in data

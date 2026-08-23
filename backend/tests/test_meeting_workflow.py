import io
from fastapi.testclient import TestClient


def test_full_meeting_lifecycle(client: TestClient, sample_wav_bytes):
    # 1. Upload audio
    audio_stream = io.BytesIO(sample_wav_bytes)
    upload_res = client.post(
        "/api/meetings/upload",
        files={"file": ("q3_sync.wav", audio_stream, "audio/wav")}
    )
    assert upload_res.status_code == 201
    meeting_id = upload_res.json()["id"]

    # 2. Process meeting (calls ASR & LLM pipelines)
    process_res = client.post(f"/api/meetings/{meeting_id}/process")
    assert process_res.status_code == 200
    meeting_data = process_res.json()

    assert meeting_data["id"] == meeting_id
    assert meeting_data["status"] == "COMPLETED"
    assert meeting_data["transcript_text"] is not None
    assert len(meeting_data["transcript_text"]) > 0
    assert meeting_data["executive_summary"] is not None
    assert len(meeting_data["decisions"]) >= 1
    assert len(meeting_data["action_items"]) >= 1

    # 3. Retrieve meeting detail
    detail_res = client.get(f"/api/meetings/{meeting_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == meeting_id

    # 4. List meetings
    list_res = client.get("/api/meetings")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    assert any(m["id"] == meeting_id for m in items)

    # 5. Check stats
    stats_res = client.get("/api/meetings/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_meetings"] >= 1
    assert stats["completed_meetings"] >= 1

    # 6. Delete meeting
    del_res = client.delete(f"/api/meetings/{meeting_id}")
    assert del_res.status_code == 200

    # Verify deleted
    get_res = client.get(f"/api/meetings/{meeting_id}")
    assert get_res.status_code == 404


def test_create_demo_meeting(client: TestClient):
    demo_res = client.post("/api/meetings/demo")
    assert demo_res.status_code == 201
    data = demo_res.json()
    assert data["status"] == "COMPLETED"
    assert "Roadmap" in data["title"]
    assert len(data["action_items"]) >= 3
    assert len(data["decisions"]) >= 2

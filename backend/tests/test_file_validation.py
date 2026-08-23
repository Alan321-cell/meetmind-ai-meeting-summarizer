import io
from fastapi.testclient import TestClient


def test_upload_invalid_file_extension(client: TestClient):
    fake_txt = io.BytesIO(b"This is not audio data.")
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("meeting_notes.txt", fake_txt, "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_upload_empty_file(client: TestClient):
    empty_audio = io.BytesIO(b"")
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("empty_recording.mp3", empty_audio, "audio/mpeg")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_valid_audio(client: TestClient, sample_wav_bytes):
    audio_stream = io.BytesIO(sample_wav_bytes)
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("team_standup.wav", audio_stream, "audio/wav")}
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["original_filename"] == "team_standup.wav"
    assert data["status"] == "PENDING"

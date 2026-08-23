from fastapi.testclient import TestClient


def test_update_action_item_status_and_fields(client: TestClient):
    # 1. Create a demo meeting with action items
    demo_res = client.post("/api/meetings/demo")
    meeting_id = demo_res.json()["id"]
    action_items = demo_res.json()["action_items"]
    assert len(action_items) > 0

    first_item = action_items[0]
    item_id = first_item["id"]
    assert first_item["status"] in ["PENDING", "IN_PROGRESS"]

    # 2. Update status to COMPLETED
    patch_res = client.patch(
        f"/api/meetings/{meeting_id}/action-items/{item_id}",
        json={"status": "COMPLETED", "priority": "CRITICAL"}
    )
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["status"] == "COMPLETED"
    assert updated_data["priority"] == "CRITICAL"

    # 3. Verify changes persist in meeting detail
    detail_res = client.get(f"/api/meetings/{meeting_id}")
    matching = [a for a in detail_res.json()["action_items"] if a["id"] == item_id]
    assert len(matching) == 1
    assert matching[0]["status"] == "COMPLETED"

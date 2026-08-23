import pytest
from app.services.summarization_service import SummarizationService
from app.schemas.meeting import MeetingAnalysisResult


def test_clean_and_parse_clean_json():
    raw_json = """
    {
      "title": "API Refactor Sync",
      "executive_summary": "Discussed migration from REST to gRPC for internal microservices.",
      "summary_markdown": "### Summary\\nMigrating to gRPC.",
      "key_decisions": ["Adopt protobuf definitions in central schema repo"],
      "discussion_points": [
        {"topic": "gRPC Benchmarks", "highlights": ["3x throughput increase"]}
      ],
      "action_items": [
        {
          "task": "Create proto repository",
          "assignee": "Alex",
          "deadline": "Friday",
          "priority": "HIGH"
        }
      ],
      "key_metrics": {"meeting_type": "Architecture"}
    }
    """
    result = SummarizationService._parse_and_validate_json(raw_json, "test transcript", "audio.mp3")
    assert isinstance(result, MeetingAnalysisResult)
    assert result.title == "API Refactor Sync"
    assert len(result.action_items) == 1
    assert result.action_items[0].assignee == "Alex"
    assert result.action_items[0].priority == "HIGH"


def test_clean_and_parse_markdown_wrapped_json():
    wrapped_json = """```json
    {
      "title": "Wrapped Title",
      "executive_summary": "Executive summary text",
      "summary_markdown": "Markdown summary",
      "key_decisions": ["Decision 1"],
      "discussion_points": [],
      "action_items": [],
      "key_metrics": {}
    }
    ```"""
    result = SummarizationService._parse_and_validate_json(wrapped_json, "test transcript", "audio.mp3")
    assert result.title == "Wrapped Title"
    assert result.key_decisions == ["Decision 1"]


def test_empty_transcript_handling():
    result = SummarizationService._generate_empty_transcript_result()
    assert result.title == "Empty Meeting Transcript"
    assert len(result.action_items) == 0

import os
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.logging import logger
from app.schemas.meeting import (
    MeetingUploadResponse,
    MeetingListItemResponse,
    MeetingDetailResponse,
    ActionItemResponse,
    ActionItemUpdate,
    StatsResponse
)
from app.services.meeting_service import MeetingService

router = APIRouter()


@router.post("/upload", response_model=MeetingUploadResponse, status_code=status.HTTP_201_CREATED, summary="Upload Meeting Audio")
async def upload_meeting_audio(
    file: UploadFile = File(..., description="Audio file (MP3, WAV, M4A, WebM, etc.)"),
    db: Session = Depends(get_db)
):
    """
    Validates and stores meeting audio file, initializing a database record in PENDING state.
    """
    meeting = await MeetingService.create_meeting(db, file)
    return MeetingUploadResponse(
        id=meeting.id,
        title=meeting.title,
        original_filename=meeting.original_filename,
        file_size_bytes=meeting.file_size_bytes,
        status=meeting.status,
        message="Audio file uploaded successfully. Ready for transcription and AI analysis."
    )


@router.post("/{meeting_id}/process", response_model=MeetingDetailResponse, summary="Execute Transcription & AI Analysis Pipeline")
async def process_meeting(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """
    Executes the end-to-end processing pipeline:
    1. Speech-to-Text Transcription via Whisper ASR
    2. Executive Summarization, Key Decisions & Action Items extraction via LLM
    3. Storage of structured data
    """
    meeting = await MeetingService.process_meeting_pipeline(db, meeting_id)
    return meeting


@router.post("/demo", response_model=MeetingDetailResponse, status_code=status.HTTP_201_CREATED, summary="Create Instant Demo Meeting")
def create_demo_meeting(db: Session = Depends(get_db)):
    """
    Creates a pre-analyzed demo meeting with structured summary, decisions, action items, and transcript for instant UI testing.
    """
    meeting = MeetingService.create_demo_meeting(db)
    return meeting


@router.get("/stats", response_model=StatsResponse, summary="Get Meeting & Action Item Metrics")
def get_stats(db: Session = Depends(get_db)):
    """
    Aggregates metrics for total meetings, audio duration processed, and action item completion status.
    """
    return MeetingService.get_stats(db)


@router.get("", response_model=List[MeetingListItemResponse], summary="List Meetings")
def list_meetings(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Limit for pagination"),
    search: Optional[str] = Query(None, description="Search query by title, filename, or summary"),
    status: Optional[str] = Query(None, description="Filter by status (COMPLETED, PENDING, FAILED, ALL)"),
    db: Session = Depends(get_db)
):
    """
    Retrieves meeting history with search and status filtering.
    """
    return MeetingService.list_meetings(db, skip=skip, limit=limit, search=search, status_filter=status)


@router.get("/{meeting_id}", response_model=MeetingDetailResponse, summary="Get Meeting Details")
def get_meeting_detail(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves full meeting details including transcript segments, executive summary, key decisions, and action items.
    """
    return MeetingService.get_meeting(db, meeting_id)


@router.get("/{meeting_id}/audio", summary="Stream / Download Stored Audio")
def get_meeting_audio(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """
    Streams the uploaded audio file for playback in the web player.
    """
    meeting = MeetingService.get_meeting(db, meeting_id)
    full_path = settings.BASE_DIR / meeting.file_path

    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found on disk."
        )

    # Determine media type
    ext = full_path.suffix.lower()
    media_types = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
        ".mp4": "video/mp4",
        ".webm": "audio/webm",
        ".ogg": "audio/ogg",
        ".flac": "audio/flac",
        ".aac": "audio/aac"
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(
        path=str(full_path),
        media_type=media_type,
        filename=meeting.original_filename
    )


@router.patch("/{meeting_id}/action-items/{item_id}", response_model=ActionItemResponse, summary="Update Action Item")
def update_action_item(
    meeting_id: str,
    item_id: str,
    update_data: ActionItemUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates action item attributes such as completion status, assignee, priority, or deadline.
    """
    return MeetingService.update_action_item(db, meeting_id, item_id, update_data)


@router.delete("/{meeting_id}", status_code=status.HTTP_200_OK, summary="Delete Meeting")
def delete_meeting(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """
    Permanently deletes a meeting record, its associated action items, and stored audio file from disk.
    """
    MeetingService.delete_meeting(db, meeting_id)
    return {"status": "success", "message": f"Meeting '{meeting_id}' and associated files have been permanently deleted."}

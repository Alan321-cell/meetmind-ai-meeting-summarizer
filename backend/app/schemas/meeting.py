from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# --- Action Item Schemas ---

class ActionItemBase(BaseModel):
    task: str = Field(..., description="Description of the action item or task")
    assignee: Optional[str] = Field(default="Unassigned", description="Person responsible for the task")
    deadline: Optional[str] = Field(default=None, description="Due date or time constraint")
    priority: str = Field(default="MEDIUM", description="LOW | MEDIUM | HIGH | CRITICAL")
    status: str = Field(default="PENDING", description="PENDING | IN_PROGRESS | COMPLETED")


class ActionItemCreate(ActionItemBase):
    pass


class ActionItemUpdate(BaseModel):
    task: Optional[str] = None
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class ActionItemResponse(ActionItemBase):
    id: str
    meeting_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Transcript & Discussion Structure Schemas ---

class TranscriptSegment(BaseModel):
    id: int
    start: float
    end: float
    speaker: Optional[str] = "Speaker"
    text: str


class DiscussionPoint(BaseModel):
    topic: str
    highlights: List[str] = []


# --- LLM Structured Output Schema ---

class ExtractedActionItem(BaseModel):
    task: str
    assignee: Optional[str] = "Unassigned"
    deadline: Optional[str] = None
    priority: str = "MEDIUM"


class MeetingAnalysisResult(BaseModel):
    title: str = Field(..., description="Action-oriented or concise descriptive title of the meeting")
    executive_summary: str = Field(..., description="High-level 2-4 sentence executive overview of the meeting")
    summary_markdown: str = Field(..., description="Detailed structured meeting minutes in markdown format")
    key_decisions: List[str] = Field(default=[], description="Explicit decisions made during the meeting")
    discussion_points: List[DiscussionPoint] = Field(default=[], description="Categorized discussion points and highlights")
    action_items: List[ExtractedActionItem] = Field(default=[], description="Actionable tasks with assignees and deadlines")
    key_metrics: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Meeting metadata, sentiment, or key themes")


# --- Meeting API Request / Response Schemas ---

class MeetingListItemResponse(BaseModel):
    id: str
    title: str
    original_filename: str
    file_size_bytes: int
    duration_seconds: float
    status: str
    current_step: Optional[str] = None
    executive_summary: Optional[str] = None
    action_items_count: int = 0
    decisions_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MeetingDetailResponse(BaseModel):
    id: str
    title: str
    original_filename: str
    file_path: str
    file_size_bytes: int
    duration_seconds: float
    status: str
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    transcript_text: Optional[str] = None
    transcript_segments: Optional[List[TranscriptSegment]] = None
    executive_summary: Optional[str] = None
    summary_markdown: Optional[str] = None
    decisions: Optional[List[str]] = None
    discussion_points: Optional[List[DiscussionPoint]] = None
    key_metrics: Optional[Dict[str, Any]] = None
    action_items: List[ActionItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MeetingUploadResponse(BaseModel):
    id: str
    title: str
    original_filename: str
    file_size_bytes: int
    status: str
    message: str


class MeetingUpdateRequest(BaseModel):
    title: Optional[str] = None


# --- System & Health Schemas ---

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    database: str
    asr_provider: str
    llm_provider: str
    openai_configured: bool
    groq_configured: bool
    timestamp: datetime


class StatsResponse(BaseModel):
    total_meetings: int
    completed_meetings: int
    failed_meetings: int
    total_duration_seconds: float
    total_action_items: int
    completed_action_items: int
    pending_action_items: int

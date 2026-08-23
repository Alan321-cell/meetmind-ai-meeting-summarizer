import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, default="Untitled Meeting")
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Float, nullable=False, default=0.0)

    # Status: PENDING, UPLOADING, TRANSCRIBING, ANALYZING, COMPLETED, FAILED
    status = Column(String(30), nullable=False, default="PENDING", index=True)
    current_step = Column(String(100), nullable=True, default="Ready for processing")
    error_message = Column(Text, nullable=True)

    # Transcription & Analysis output
    transcript_text = Column(Text, nullable=True)
    transcript_segments = Column(JSON, nullable=True)  # List of segment dicts (id, start, end, text, speaker)
    executive_summary = Column(Text, nullable=True)
    summary_markdown = Column(Text, nullable=True)
    decisions = Column(JSON, nullable=True)           # List of decision strings
    discussion_points = Column(JSON, nullable=True)   # List of dicts with topic and highlights
    key_metrics = Column(JSON, nullable=True)         # Word count, speaking metrics, etc.

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # One-to-many relationship with ActionItem
    action_items = relationship(
        "ActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="ActionItem.created_at.asc()"
    )

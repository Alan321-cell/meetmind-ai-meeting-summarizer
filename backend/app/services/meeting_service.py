import uuid
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from fastapi import UploadFile, HTTPException, status

from app.models.meeting import Meeting
from app.models.action_item import ActionItem
from app.schemas.meeting import (
    MeetingListItemResponse,
    MeetingDetailResponse,
    ActionItemUpdate,
    StatsResponse,
    MeetingAnalysisResult
)
from app.services.audio_service import AudioService
from app.services.transcription_service import TranscriptionService
from app.services.summarization_service import SummarizationService
from app.core.logging import logger


class MeetingService:

    @classmethod
    async def create_meeting(cls, db: Session, file: UploadFile) -> Meeting:
        """
        Validates uploaded file, writes it to disk, and creates initial database entry.
        """
        rel_path, clean_filename, file_size, duration = await AudioService.save_uploaded_file(file)

        meeting = Meeting(
            id=str(uuid.uuid4()),
            title=f"Meeting: {clean_filename}",
            original_filename=clean_filename,
            file_path=rel_path,
            file_size_bytes=file_size,
            duration_seconds=duration,
            status="PENDING",
            current_step="Uploaded. Ready for transcription."
        )

        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        logger.info(f"Created meeting record {meeting.id} for file '{clean_filename}'")
        return meeting

    @classmethod
    async def process_meeting_pipeline(cls, db: Session, meeting_id: str) -> Meeting:
        """
        Full orchestration pipeline:
        1. Status: TRANSCRIBING -> Speech-to-Text (ASR)
        2. Status: ANALYZING -> LLM Summarization, Decisions, Action Items extraction
        3. Status: COMPLETED -> Save all structures to DB
        """
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")

        try:
            # Step 1: Transcription
            meeting.status = "TRANSCRIBING"
            meeting.current_step = "Transcribing audio with Whisper ASR..."
            db.commit()
            db.refresh(meeting)

            transcript_text, segments, a_duration = await TranscriptionService.transcribe_audio(meeting.file_path)
            
            meeting.transcript_text = transcript_text
            meeting.transcript_segments = segments
            if a_duration > 0:
                meeting.duration_seconds = a_duration

            # Step 2: LLM Analysis & Action Extraction
            meeting.status = "ANALYZING"
            meeting.current_step = "Analyzing transcript & extracting key decisions with LLM..."
            db.commit()
            db.refresh(meeting)

            analysis: MeetingAnalysisResult = await SummarizationService.analyze_meeting(
                transcript_text=transcript_text,
                filename=meeting.original_filename
            )

            meeting.title = analysis.title
            meeting.executive_summary = analysis.executive_summary
            meeting.summary_markdown = analysis.summary_markdown
            meeting.decisions = analysis.key_decisions
            meeting.discussion_points = [p.model_dump() if hasattr(p, "model_dump") else p.dict() for p in analysis.discussion_points]
            meeting.key_metrics = analysis.key_metrics

            # Clear existing action items if re-processing
            db.query(ActionItem).filter(ActionItem.meeting_id == meeting.id).delete()

            # Insert newly extracted action items
            for item in analysis.action_items:
                ai = ActionItem(
                    id=str(uuid.uuid4()),
                    meeting_id=meeting.id,
                    task=item.task,
                    assignee=item.assignee or "Unassigned",
                    deadline=item.deadline,
                    priority=item.priority,
                    status="PENDING"
                )
                db.add(ai)

            # Step 3: Complete
            meeting.status = "COMPLETED"
            meeting.current_step = "Processing completed successfully."
            meeting.error_message = None
            db.commit()
            db.refresh(meeting)

            logger.info(f"Successfully processed meeting {meeting.id} ('{meeting.title}')")
            return meeting

        except Exception as e:
            logger.error(f"Failed to process meeting {meeting_id}: {e}", exc_info=True)
            meeting.status = "FAILED"
            meeting.current_step = "Processing encountered an error."
            meeting.error_message = str(e)
            db.commit()
            db.refresh(meeting)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Meeting processing failed: {str(e)}"
            )

    @classmethod
    def get_meeting(cls, db: Session, meeting_id: str) -> Meeting:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(status_code=404, detail=f"Meeting with ID '{meeting_id}' not found.")
        return meeting

    @classmethod
    def list_meetings(
        cls,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[MeetingListItemResponse]:
        query = db.query(Meeting)

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Meeting.status == status_filter.upper())

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Meeting.title.ilike(search_pattern)) |
                (Meeting.original_filename.ilike(search_pattern)) |
                (Meeting.executive_summary.ilike(search_pattern))
            )

        query = query.order_by(desc(Meeting.created_at)).offset(skip).limit(limit)
        meetings = query.all()

        results = []
        for m in meetings:
            act_count = len(m.action_items) if m.action_items else 0
            dec_count = len(m.decisions) if m.decisions else 0
            results.append(
                MeetingListItemResponse(
                    id=m.id,
                    title=m.title,
                    original_filename=m.original_filename,
                    file_size_bytes=m.file_size_bytes,
                    duration_seconds=m.duration_seconds,
                    status=m.status,
                    current_step=m.current_step,
                    executive_summary=m.executive_summary,
                    action_items_count=act_count,
                    decisions_count=dec_count,
                    created_at=m.created_at,
                    updated_at=m.updated_at
                )
            )
        return results

    @classmethod
    def delete_meeting(cls, db: Session, meeting_id: str) -> bool:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(status_code=404, detail=f"Meeting with ID '{meeting_id}' not found.")

        file_path = meeting.file_path
        db.delete(meeting)
        db.commit()

        # Delete stored audio file
        AudioService.delete_stored_file(file_path)
        logger.info(f"Deleted meeting {meeting_id} and removed associated audio.")
        return True

    @classmethod
    def update_action_item(
        cls,
        db: Session,
        meeting_id: str,
        item_id: str,
        update_data: ActionItemUpdate
    ) -> ActionItem:
        action_item = db.query(ActionItem).filter(
            ActionItem.id == item_id,
            ActionItem.meeting_id == meeting_id
        ).first()

        if not action_item:
            raise HTTPException(status_code=404, detail="Action item not found.")

        if update_data.task is not None:
            action_item.task = update_data.task
        if update_data.assignee is not None:
            action_item.assignee = update_data.assignee
        if update_data.deadline is not None:
            action_item.deadline = update_data.deadline
        if update_data.priority is not None:
            action_item.priority = update_data.priority
        if update_data.status is not None:
            action_item.status = update_data.status

        action_item.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(action_item)
        return action_item

    @classmethod
    def get_stats(cls, db: Session) -> StatsResponse:
        total_meetings = db.query(func.count(Meeting.id)).scalar() or 0
        completed_meetings = db.query(func.count(Meeting.id)).filter(Meeting.status == "COMPLETED").scalar() or 0
        failed_meetings = db.query(func.count(Meeting.id)).filter(Meeting.status == "FAILED").scalar() or 0
        total_duration = db.query(func.sum(Meeting.duration_seconds)).scalar() or 0.0

        total_actions = db.query(func.count(ActionItem.id)).scalar() or 0
        completed_actions = db.query(func.count(ActionItem.id)).filter(ActionItem.status == "COMPLETED").scalar() or 0
        pending_actions = total_actions - completed_actions

        return StatsResponse(
            total_meetings=total_meetings,
            completed_meetings=completed_meetings,
            failed_meetings=failed_meetings,
            total_duration_seconds=float(total_duration),
            total_action_items=total_actions,
            completed_action_items=completed_actions,
            pending_action_items=pending_actions
        )

    @classmethod
    def create_demo_meeting(cls, db: Session) -> Meeting:
        """
        Creates a rich sample meeting for instant evaluation and demo walk-throughs.
        """
        meeting_id = str(uuid.uuid4())
        meeting = Meeting(
            id=meeting_id,
            title="Q3 Product Roadmap & Cloud Architecture Sync",
            original_filename="q3_architecture_sync.mp3",
            file_path="sample_data/q3_architecture_sync.mp3",
            file_size_bytes=2450000,
            duration_seconds=345.0,
            status="COMPLETED",
            current_step="Processing completed successfully.",
            executive_summary=(
                "The engineering and product leadership teams aligned on Q3 strategic milestones. "
                "The team finalized the migration to a high-throughput Redis caching cluster and selected Ory Kratos for zero-trust authentication. "
                "Critical action items were assigned across DevOps, Backend, and QA to ensure a flawless staging rollout by next Friday."
            ),
            summary_markdown=(
                "### 🎯 Strategic Objective\n"
                "Review Q3 architectural milestones, establish caching benchmarks, and finalize authentication service selection.\n\n"
                "### 📋 Key Discussion Highlights\n"
                "- **Redis Caching Tier**: Benchmarking in staging demonstrated a 45% latency drop on intensive queries. Failover clustering is in progress.\n"
                "- **Auth Modernization**: Evaluated Auth0 vs. Ory Kratos. Selected Ory Kratos for strict data sovereignty and compliance.\n"
                "- **QA Automation**: End-to-end regression suites will be drafted for the upcoming customer billing dashboard.\n\n"
                "### 💡 Consensus & Next Steps\n"
                "Terraform configurations will be finalized this week, followed by architecture RFC review on Tuesday."
            ),
            decisions=[
                "Adopt self-hosted Ory Kratos for all production authentication to comply with regional data sovereignty regulations.",
                "Standardize on Redis 7.2 cluster for distributed session caching and rate-limiting.",
                "Freeze frontend feature branch on Thursday 5 PM for QA stabilization testing."
            ],
            discussion_points=[
                {
                    "topic": "High-Throughput Caching Architecture",
                    "highlights": [
                        "Observed a 45% reduction in 95th-percentile response times during load testing.",
                        "Configuring multi-region replication and automatic Redis Sentinel failover."
                    ]
                },
                {
                    "topic": "Authentication & Security Compliance",
                    "highlights": [
                        "Self-hosted Ory Kratos selected over third-party SaaS for data privacy guarantees.",
                        "Identity schemas mapped to existing user databases with zero downtime migration."
                    ]
                },
                {
                    "topic": "Sprint Quality Assurance & Release Criteria",
                    "highlights": [
                        "Automated Playwright test coverage target set at 85% for core customer workflows."
                    ]
                }
            ],
            transcript_text=(
                "Alex (Lead): Good morning everyone. Today we are deciding on our Q3 caching infrastructure and authentication provider. "
                "Maria (DevOps): The Redis caching tests in staging yielded a 45% latency drop. We are confident in deploying Redis 7.2 with automatic failover. "
                "David (Backend): On the identity side, we evaluated Auth0 versus self-hosted Ory Kratos. To ensure strict data privacy and sovereignty, we recommend Ory Kratos. "
                "Alex (Lead): Agreed. The decision is finalized: Ory Kratos for auth, Redis for caching. "
                "Maria, please finalize the Terraform scripts by Friday. David, please submit the architecture RFC by Tuesday morning. "
                "Sarah, coordinate with QA for the end-to-end regression test suite by Thursday. Meeting adjourned!"
            ),
            transcript_segments=[
                {
                    "id": 1,
                    "start": 0.0,
                    "end": 12.5,
                    "speaker": "Alex (Engineering Lead)",
                    "text": "Good morning everyone. Today we are deciding on our Q3 caching infrastructure and authentication provider."
                },
                {
                    "id": 2,
                    "start": 13.0,
                    "end": 35.0,
                    "speaker": "Maria (DevOps Lead)",
                    "text": "The Redis caching tests in staging yielded a 45% latency drop. We are confident in deploying Redis 7.2 with automatic failover."
                },
                {
                    "id": 3,
                    "start": 35.5,
                    "end": 62.0,
                    "speaker": "David (Backend Architect)",
                    "text": "On the identity side, we evaluated Auth0 versus self-hosted Ory Kratos. To ensure strict data privacy and sovereignty, we recommend Ory Kratos."
                },
                {
                    "id": 4,
                    "start": 62.5,
                    "end": 90.0,
                    "speaker": "Alex (Engineering Lead)",
                    "text": "Agreed. The decision is finalized: Ory Kratos for auth, Redis for caching. Maria, please finalize the Terraform scripts by Friday."
                },
                {
                    "id": 5,
                    "start": 90.5,
                    "end": 120.0,
                    "speaker": "Alex (Engineering Lead)",
                    "text": "David, please submit the architecture RFC by Tuesday morning. Sarah, coordinate with QA for the end-to-end regression test suite by Thursday. Meeting adjourned!"
                }
            ],
            key_metrics={
                "meeting_type": "Architecture Review & Sprint Planning",
                "sentiment": "Decisive & Collaborative",
                "key_topics_count": 3
            }
        )

        db.add(meeting)

        actions = [
            ActionItem(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                task="Finalize Redis 7.2 cluster Terraform configurations and failover scripts",
                assignee="Maria",
                deadline="Friday",
                priority="HIGH",
                status="IN_PROGRESS"
            ),
            ActionItem(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                task="Submit Ory Kratos architecture RFC and schema migration plan",
                assignee="David",
                deadline="Tuesday Morning",
                priority="HIGH",
                status="PENDING"
            ),
            ActionItem(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                task="Coordinate with QA team to draft Playwright regression suite for customer dashboard",
                assignee="Sarah",
                deadline="Thursday 3 PM",
                priority="MEDIUM",
                status="PENDING"
            )
        ]

        for a in actions:
            db.add(a)

        db.commit()
        db.refresh(meeting)
        logger.info(f"Created demo meeting {meeting_id}")
        return meeting

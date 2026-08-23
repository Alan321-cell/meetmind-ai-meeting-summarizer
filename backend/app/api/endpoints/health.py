from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.api.deps import get_db
from app.schemas.meeting import HealthResponse
from app.services.transcription_service import TranscriptionService
from app.services.summarization_service import SummarizationService

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="System Health & Provider Diagnostics")
def check_health(db: Session = Depends(get_db)):
    """
    Performs real-time diagnostics on database connectivity, ASR provider, and LLM provider configuration.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    asr_provider = TranscriptionService.get_active_provider()
    llm_provider = SummarizationService.get_active_provider()

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=db_status,
        asr_provider=asr_provider,
        llm_provider=llm_provider,
        openai_configured=bool(settings.OPENAI_API_KEY),
        groq_configured=bool(settings.GROQ_API_KEY),
        timestamp=datetime.utcnow()
    )

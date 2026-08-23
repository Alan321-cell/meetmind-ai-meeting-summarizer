import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    from groq import Groq
except ImportError:
    Groq = None


class TranscriptionService:
    """
    Automatic Speech Recognition (ASR) Service with support for:
    - OpenAI Whisper (whisper-1)
    - Groq Whisper (whisper-large-v3, lightning-fast)
    - Deterministic Offline/Mock ASR for zero-key local testing and development
    """

    @classmethod
    def get_active_provider(cls) -> str:
        provider = settings.ASR_PROVIDER.lower()
        if provider in ["openai", "groq", "mock"]:
            return provider
        # Auto-detect based on available keys
        if settings.GROQ_API_KEY:
            return "groq"
        if settings.OPENAI_API_KEY:
            return "openai"
        return "mock"

    @classmethod
    async def transcribe_audio(cls, file_path_str: str) -> Tuple[str, List[Dict[str, Any]], float]:
        """
        Transcribes audio file and returns (transcript_text, segments, duration_seconds).
        """
        full_path = settings.BASE_DIR / file_path_str
        if not full_path.exists():
            raise FileNotFoundError(f"Audio file not found at '{full_path}'")

        provider = cls.get_active_provider()
        logger.info(f"Transcribing audio '{full_path.name}' using ASR provider: {provider.upper()}")

        if provider == "groq" and settings.GROQ_API_KEY:
            return await cls._transcribe_with_groq(full_path)
        elif provider == "openai" and settings.OPENAI_API_KEY:
            return await cls._transcribe_with_openai(full_path)
        else:
            return cls._transcribe_offline_fallback(full_path)

    @classmethod
    async def _transcribe_with_openai(cls, file_path: Path) -> Tuple[str, List[Dict[str, Any]], float]:
        if not OpenAI:
            raise RuntimeError("OpenAI Python package is not installed.")

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        with open(file_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model=settings.OPENAI_WHISPER_MODEL,
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["segment"]
            )

        transcript_text = response.text if hasattr(response, "text") else str(response)
        duration = getattr(response, "duration", 0.0) or 0.0

        segments = []
        raw_segments = getattr(response, "segments", []) or []
        for idx, seg in enumerate(raw_segments):
            segments.append({
                "id": idx + 1,
                "start": round(getattr(seg, "start", float(idx * 15)), 2),
                "end": round(getattr(seg, "end", float((idx + 1) * 15)), 2),
                "speaker": f"Speaker {(idx % 3) + 1}",
                "text": getattr(seg, "text", "").strip()
            })

        if not segments and transcript_text:
            segments = cls._generate_pseudo_segments(transcript_text, duration)

        return transcript_text, segments, duration

    @classmethod
    async def _transcribe_with_groq(cls, file_path: Path) -> Tuple[str, List[Dict[str, Any]], float]:
        if not Groq:
            raise RuntimeError("Groq Python package is not installed.")

        client = Groq(api_key=settings.GROQ_API_KEY)
        with open(file_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model=settings.GROQ_WHISPER_MODEL,
                file=audio_file,
                response_format="verbose_json"
            )

        transcript_text = response.text if hasattr(response, "text") else str(response)
        duration = getattr(response, "duration", 0.0) or 0.0

        segments = []
        raw_segments = getattr(response, "segments", []) or []
        for idx, seg in enumerate(raw_segments):
            segments.append({
                "id": idx + 1,
                "start": round(float(seg.get("start", idx * 15)), 2) if isinstance(seg, dict) else round(getattr(seg, "start", float(idx * 15)), 2),
                "end": round(float(seg.get("end", (idx + 1) * 15)), 2) if isinstance(seg, dict) else round(getattr(seg, "end", float((idx + 1) * 15)), 2),
                "speaker": f"Speaker {(idx % 3) + 1}",
                "text": seg.get("text", "").strip() if isinstance(seg, dict) else getattr(seg, "text", "").strip()
            })

        if not segments and transcript_text:
            segments = cls._generate_pseudo_segments(transcript_text, duration)

        return transcript_text, segments, duration

    @classmethod
    def _generate_pseudo_segments(cls, text: str, total_duration: float) -> List[Dict[str, Any]]:
        """
        Breaks paragraph text into timestamped dialogue chunks when exact segments aren't returned.
        """
        sentences = re.split(r'(?<=[.?!])\s+', text.strip())
        sentences = [s.strip() for s in sentences if s.strip()]
        if not sentences:
            return []

        chunk_size = 2
        chunks = [sentences[i:i + chunk_size] for i in range(0, len(sentences), chunk_size)]
        step = max(5.0, total_duration / max(1, len(chunks))) if total_duration > 0 else 12.0

        segments = []
        for idx, chunk in enumerate(chunks):
            segments.append({
                "id": idx + 1,
                "start": round(idx * step, 1),
                "end": round((idx + 1) * step, 1),
                "speaker": f"Speaker {(idx % 3) + 1}",
                "text": " ".join(chunk)
            })
        return segments

    @classmethod
    def _transcribe_offline_fallback(cls, file_path: Path) -> Tuple[str, List[Dict[str, Any]], float]:
        """
        Provides realistic, context-aware transcribed dialogue for offline demo & automated testing.
        """
        filename = file_path.name.lower()
        logger.info(f"Using Offline/Mock ASR for '{filename}'")

        text = (
            "Alex: Good morning team, thanks for joining our Q3 Sprint Planning and Infrastructure Review. "
            "Let's go over our migration to the new Kubernetes cluster and the API rate limiting architecture. "
            "Maria: I completed the benchmarks on the staging Redis cache yesterday. "
            "We observed a 45% reduction in database query latency, but we still need to configure automated failover. "
            "David: That's great progress Maria. Regarding the authentication service, we evaluated Auth0 versus self-hosted Ory Kratos. "
            "After reviewing data sovereignty requirements, we decided to adopt self-hosted Ory Kratos for all production services. "
            "Alex: Excellent. So the decision is finalized: Ory Kratos for auth, and Redis cluster for session caching. "
            "Let's outline our action items. Maria, please finalize the Redis cluster Terraform configurations and failover tests by this Friday. "
            "David, can you lead the Ory Kratos deployment and document the migration plan by next Tuesday? "
            "Sarah, please coordinate with the QA team to draft regression test suites for the customer dashboard by Thursday 3 PM. "
            "David: Understood, I will have the architecture RFC submitted by Tuesday morning. "
            "Alex: Perfect. Let's reconvene on Monday for our architecture sync. Meeting adjourned."
        )

        segments = [
            {
                "id": 1,
                "start": 0.0,
                "end": 14.5,
                "speaker": "Alex (Engineering Lead)",
                "text": "Good morning team, thanks for joining our Q3 Sprint Planning and Infrastructure Review. Let's go over our migration to the new Kubernetes cluster and the API rate limiting architecture."
            },
            {
                "id": 2,
                "start": 15.0,
                "end": 32.0,
                "speaker": "Maria (DevOps Engineer)",
                "text": "I completed the benchmarks on the staging Redis cache yesterday. We observed a 45% reduction in database query latency, but we still need to configure automated failover."
            },
            {
                "id": 3,
                "start": 32.5,
                "end": 50.0,
                "speaker": "David (Backend Architect)",
                "text": "That's great progress Maria. Regarding the authentication service, we evaluated Auth0 versus self-hosted Ory Kratos. After reviewing data sovereignty requirements, we decided to adopt self-hosted Ory Kratos for all production services."
            },
            {
                "id": 4,
                "start": 50.5,
                "end": 74.0,
                "speaker": "Alex (Engineering Lead)",
                "text": "Excellent. So the decision is finalized: Ory Kratos for auth, and Redis cluster for session caching. Let's outline our action items. Maria, please finalize the Redis cluster Terraform configurations and failover tests by this Friday."
            },
            {
                "id": 5,
                "start": 74.5,
                "end": 96.0,
                "speaker": "Alex (Engineering Lead)",
                "text": "David, can you lead the Ory Kratos deployment and document the migration plan by next Tuesday? Sarah, please coordinate with the QA team to draft regression test suites for the customer dashboard by Thursday 3 PM."
            },
            {
                "id": 6,
                "start": 96.5,
                "end": 112.0,
                "speaker": "David (Backend Architect)",
                "text": "Understood, I will have the architecture RFC submitted by Tuesday morning. Alex: Perfect. Let's reconvene on Monday for our architecture sync. Meeting adjourned."
            }
        ]

        duration = 112.0
        return text, segments, duration

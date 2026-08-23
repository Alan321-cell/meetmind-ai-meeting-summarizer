from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "MeetMind — AI Meeting Summarizer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./meetmind.db"

    # Storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage" / "audio"
    SAMPLE_DIR: Path = BASE_DIR / "sample_data"

    # File Upload Limits
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_EXTENSIONS: List[str] = [
        ".mp3", ".wav", ".m4a", ".mp4", ".webm", ".ogg", ".flac", ".aac"
    ]
    ALLOWED_MIME_TYPES: List[str] = [
        "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
        "audio/m4a", "audio/x-m4a", "audio/mp4", "audio/webm",
        "audio/ogg", "audio/flac", "audio/aac", "video/mp4",
        "video/webm", "application/octet-stream"
    ]

    # AI Providers (auto | openai | groq | mock)
    LLM_PROVIDER: str = "auto"
    ASR_PROVIDER: str = "auto"

    # OpenAI Settings
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_WHISPER_MODEL: str = "whisper-1"

    # Groq Settings (Ultra-fast Whisper and Llama 3.3)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_WHISPER_MODEL: str = "whisper-large-v3"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Ensure storage directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

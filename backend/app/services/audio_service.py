import os
import re
import uuid
import shutil
from pathlib import Path
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.core.logging import logger

try:
    import mutagen
    from mutagen.mp3 import MP3
    from mutagen.wave import WAVE
except ImportError:
    mutagen = None


class AudioService:
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent path traversal or unsafe characters.
        """
        clean_name = os.path.basename(filename)
        clean_name = re.sub(r"[^a-zA-Z0-9._-]", "_", clean_name)
        return clean_name or "meeting_audio.mp3"

    @classmethod
    def validate_upload(cls, file: UploadFile) -> Tuple[str, str]:
        """
        Validates file existence, extension, and content type.
        Returns (clean_filename, extension).
        """
        if not file or not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided or filename is missing."
            )

        clean_filename = cls.sanitize_filename(file.filename)
        _, ext = os.path.splitext(clean_filename)
        ext = ext.lower()

        if ext not in settings.ALLOWED_EXTENSIONS:
            allowed_str = ", ".join(settings.ALLOWED_EXTENSIONS)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {allowed_str}"
            )

        return clean_filename, ext

    @classmethod
    async def save_uploaded_file(cls, file: UploadFile) -> Tuple[str, str, int, float]:
        """
        Streams and saves uploaded file to storage directory, validating file size and non-emptiness.
        Returns: (saved_relative_path, original_filename, file_size_bytes, duration_seconds)
        """
        clean_filename, ext = cls.validate_upload(file)
        unique_filename = f"{uuid.uuid4().hex}_{clean_filename}"
        target_path = settings.STORAGE_DIR / unique_filename

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        total_bytes = 0

        try:
            with open(target_path, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):  # 1MB chunks
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        # Clean up partial file
                        buffer.close()
                        if target_path.exists():
                            target_path.unlink()
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
                        )
                    buffer.write(chunk)
        except HTTPException:
            raise
        except Exception as e:
            if target_path.exists():
                target_path.unlink()
            logger.error(f"Error saving uploaded audio file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save audio file: {str(e)}"
            )

        if total_bytes == 0:
            if target_path.exists():
                target_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )

        # Extract duration
        duration = cls.extract_audio_duration(target_path)

        relative_path = str(target_path.relative_to(settings.BASE_DIR))
        logger.info(f"Saved audio file '{clean_filename}' ({total_bytes} bytes, ~{duration:.1f}s) to '{relative_path}'")
        return relative_path, clean_filename, total_bytes, duration

    @staticmethod
    def extract_audio_duration(file_path: Path) -> float:
        """
        Extract audio duration in seconds using mutagen.
        Falls back to estimated duration if mutagen metadata is unavailable.
        """
        try:
            if mutagen:
                audio_info = mutagen.File(str(file_path))
                if audio_info and audio_info.info and hasattr(audio_info.info, "length"):
                    return float(audio_info.info.length)
        except Exception as e:
            logger.warning(f"Could not read audio duration with mutagen: {e}")

        # Fallback approximation based on average bitrate (e.g. 128kbps = 16KB/s)
        try:
            size_bytes = os.path.getsize(file_path)
            # Default rough estimate ~ 16KB per sec for typical speech
            estimated_sec = max(5.0, round(size_bytes / 16000.0, 1))
            return float(estimated_sec)
        except Exception:
            return 30.0

    @staticmethod
    def delete_stored_file(file_path_str: Optional[str]) -> bool:
        """
        Deletes stored audio file if it exists.
        """
        if not file_path_str:
            return False
        try:
            full_path = settings.BASE_DIR / file_path_str
            if full_path.exists() and full_path.is_file():
                full_path.unlink()
                logger.info(f"Deleted audio file: {full_path}")
                return True
        except Exception as e:
            logger.warning(f"Failed to delete audio file '{file_path_str}': {e}")
        return False

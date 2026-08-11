"""
File Validator — Deterministic file security and validation.

Responsibilities:
    - MIME type validation (magic bytes, NOT browser-supplied)
    - Extension whitelist
    - File size limits
    - Secure filename generation
    - Content hash (SHA-256) for idempotency
    - Duplicate detection
"""
from __future__ import annotations

import hashlib
import os
import uuid
from dataclasses import dataclass
from pathlib import Path

from app.config import settings

# ── Constants ─────────────────────────────────────────────────

ALLOWED_EXTENSIONS: dict[str, str] = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/plain",
    ".json": "application/json",
    ".csv": "text/csv",
}

ALLOWED_MIME_TYPES: set[str] = set(ALLOWED_EXTENSIONS.values())

# Magic bytes signatures for common formats
MAGIC_SIGNATURES: dict[bytes, str] = {
    b"%PDF": "application/pdf",
    b"PK\x03\x04": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


# ── Result Types ──────────────────────────────────────────────

@dataclass
class FileValidationResult:
    valid: bool
    error_code: str | None = None
    error_message: str | None = None
    detected_mime: str | None = None
    extension: str | None = None
    content_hash: str | None = None
    file_size: int = 0
    secure_filename: str | None = None
    storage_path: str | None = None


# ── Validator ─────────────────────────────────────────────────

def validate_file(
    filename: str,
    content: bytes,
    employee_id: str,
) -> FileValidationResult:
    """
    Validate an uploaded file for security and compliance.
    Returns a FileValidationResult with all metadata needed for storage.
    """
    # 1. Check file size
    file_size = len(content)
    if file_size == 0:
        return FileValidationResult(
            valid=False,
            error_code="EMPTY_FILE",
            error_message="The uploaded file is empty.",
        )

    if file_size > MAX_FILE_SIZE_BYTES:
        return FileValidationResult(
            valid=False,
            error_code="FILE_TOO_LARGE",
            error_message=f"File exceeds the {settings.MAX_FILE_SIZE_MB}MB limit ({file_size / (1024*1024):.1f}MB).",
        )

    # 2. Check extension
    ext = _get_extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        return FileValidationResult(
            valid=False,
            error_code="UNSUPPORTED_FORMAT",
            error_message=f"File type '{ext}' is not supported. Supported: {', '.join(ALLOWED_EXTENSIONS.keys())}",
        )

    # 3. Detect MIME type from magic bytes
    detected_mime = _detect_mime_from_bytes(content, ext)

    # 4. Verify MIME type matches extension
    expected_mime = ALLOWED_EXTENSIONS[ext]
    if detected_mime and detected_mime != expected_mime:
        # For text-based formats, be lenient (txt, md, csv, json can all appear as text/plain)
        text_mimes = {"text/plain", "text/csv", "application/json"}
        if not (detected_mime in text_mimes and expected_mime in text_mimes):
            return FileValidationResult(
                valid=False,
                error_code="MIME_MISMATCH",
                error_message=f"File content does not match the '{ext}' extension.",
            )

    # 5. Generate content hash for duplicate detection
    content_hash = hashlib.sha256(content).hexdigest()

    # 6. Generate secure storage filename
    storage_id = str(uuid.uuid4())
    secure_name = f"{storage_id}{ext}"
    storage_path = os.path.join(employee_id, secure_name)

    return FileValidationResult(
        valid=True,
        detected_mime=detected_mime or expected_mime,
        extension=ext,
        content_hash=content_hash,
        file_size=file_size,
        secure_filename=secure_name,
        storage_path=storage_path,
    )


def check_duplicate(content_hash: str, employee_id: str, supabase_client) -> dict | None:
    """Check if a file with the same hash already exists for this employee."""
    result = (
        supabase_client.table("knowledge_sources")
        .select("id, name, status")
        .eq("employee_id", employee_id)
        .eq("content_hash", content_hash)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


def store_file(content: bytes, storage_path: str) -> str:
    """Store file to local filesystem. Returns the absolute path."""
    upload_dir = Path(settings.UPLOAD_DIR)
    full_path = upload_dir / storage_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_bytes(content)
    return str(full_path)


def delete_stored_file(storage_path: str) -> None:
    """Delete a stored file from local filesystem."""
    upload_dir = Path(settings.UPLOAD_DIR)
    full_path = upload_dir / storage_path
    if full_path.exists():
        full_path.unlink()


# ── Helpers ───────────────────────────────────────────────────

def _get_extension(filename: str) -> str:
    """Extract and normalize the file extension."""
    _, ext = os.path.splitext(filename.lower())
    return ext


def _detect_mime_from_bytes(content: bytes, ext: str) -> str | None:
    """
    Detect MIME type from magic bytes.
    Falls back to extension-based detection for text formats.
    """
    # Try python-magic if available (more accurate)
    try:
        import magic
        detected = magic.from_buffer(content[:2048], mime=True)
        if detected:
            return detected
    except ImportError:
        pass  # Graceful fallback if libmagic is not installed
    except Exception:
        pass

    # Check magic byte signatures
    header = content[:8]
    for sig, mime in MAGIC_SIGNATURES.items():
        if header.startswith(sig):
            return mime

    # For text-based formats, verify content is valid text
    if ext in {".txt", ".md", ".csv", ".json"}:
        try:
            content[:4096].decode("utf-8")
            return ALLOWED_EXTENSIONS.get(ext, "text/plain")
        except UnicodeDecodeError:
            return None

    return None

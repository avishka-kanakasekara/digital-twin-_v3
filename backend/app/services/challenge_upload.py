"""Validate and store challenge step submission files."""
from __future__ import annotations

import uuid
from pathlib import Path

TEXT_EXTENSIONS = {".txt", ".md", ".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".csv", ".html", ".css", ".sql", ".java", ".go", ".rs", ".c", ".cpp", ".h", ".yaml", ".yml", ".xml", ".sh"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
FILE_EXTENSIONS = TEXT_EXTENSIONS | IMAGE_EXTENSIONS | {".pdf", ".docx"}

MAX_BYTES = 10 * 1024 * 1024


def save_submission_file(employee_id: str, filename: str, content: bytes) -> dict:
    if not content:
        raise ValueError("The uploaded file is empty.")
    if len(content) > MAX_BYTES:
        raise ValueError(f"File exceeds {MAX_BYTES // (1024 * 1024)}MB limit.")

    ext = Path(filename or "upload").suffix.lower()
    if ext not in FILE_EXTENSIONS:
        raise ValueError(f"File type '{ext or 'unknown'}' is not allowed.")

    safe_name = f"{uuid.uuid4().hex}_{Path(filename).name.replace(' ', '_')}"
    storage_path = f"challenges/{employee_id}/{safe_name}"
    from app.services.onelake_storage_service import save_bytes

    save_bytes(storage_path, content, _mime_for_ext(ext))
    mime_type = _mime_for_ext(ext)
    is_image = ext in IMAGE_EXTENSIONS

    text_content = ""
    if ext in TEXT_EXTENSIONS or ext == ".pdf":
        try:
            if ext == ".pdf":
                text_content = f"[PDF document uploaded: {filename}, {len(content)} bytes]"
            else:
                text_content = content.decode("utf-8", errors="replace")
        except Exception:
            text_content = f"[File uploaded: {filename}]"
    elif is_image:
        text_content = f"[Image uploaded: {filename}]"
    else:
        text_content = f"[File uploaded: {filename}, {len(content)} bytes]"

    return {
        "storage_path": storage_path,
        "filename": filename,
        "mime_type": mime_type,
        "is_image": is_image,
        "content": text_content[:12000],
        "size": len(content),
    }


def read_submission_file(storage_path: str) -> tuple[bytes, str]:
    from app.services.onelake_storage_service import read_bytes
    from app.db.errors import StorageError

    try:
        content = read_bytes(storage_path)
    except StorageError as exc:
        raise FileNotFoundError("Uploaded file not found.") from exc
    ext = Path(storage_path).suffix.lower()
    return content, _mime_for_ext(ext)


def _mime_for_ext(ext: str) -> str:
    return {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".json": "application/json",
    }.get(ext, "text/plain")

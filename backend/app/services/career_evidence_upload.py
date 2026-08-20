from __future__ import annotations

import uuid
from pathlib import Path

from app.config import settings

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".txt", ".md", ".json", ".csv",
    ".png", ".jpg", ".jpeg", ".gif", ".webp",
}
MAX_BYTES = 10 * 1024 * 1024


def save_career_evidence(employee_id: str, filename: str, content: bytes) -> dict:
    if not content:
        raise ValueError("The uploaded file is empty.")
    if len(content) > MAX_BYTES:
        raise ValueError("File exceeds 10MB limit.")

    ext = Path(filename or "evidence").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '{ext or 'unknown'}' is not allowed.")

    safe_name = f"{uuid.uuid4().hex}_{Path(filename or 'evidence').name.replace(' ', '_')}"
    rel_dir = Path("career-evidence") / employee_id
    upload_root = Path(settings.UPLOAD_DIR) / rel_dir
    upload_root.mkdir(parents=True, exist_ok=True)
    full_path = upload_root / safe_name
    full_path.write_bytes(content)

    preview = ""
    if ext in {".txt", ".md", ".json", ".csv"}:
        preview = content.decode("utf-8", errors="replace")[:12000]
    elif ext in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
        preview = f"[Image evidence uploaded: {filename}]"
    else:
        preview = f"[File evidence uploaded: {filename}]"

    return {
        "file_ref": str(rel_dir / safe_name),
        "filename": filename,
        "content_preview": preview,
        "size": len(content),
    }

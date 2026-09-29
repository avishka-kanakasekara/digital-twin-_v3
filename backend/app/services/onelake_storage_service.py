"""
File storage for knowledge documents, challenge submissions, and career evidence.

When OneLake workspace and lakehouse settings are present, files are stored
through the ADLS-compatible OneLake endpoint with Microsoft Entra credentials.
Otherwise files stay on the local upload directory so development matches the
previous filesystem behavior. The browser never receives storage credentials.
"""

from __future__ import annotations

import logging
from pathlib import Path

from app.config import settings
from app.db.errors import StorageError

logger = logging.getLogger("edt.storage")

ROOT_FOLDER = "EmployeeDigitalTwin"


def save_bytes(relative_path: str, content: bytes, content_type: str | None = None) -> str:
    path = _safe_relative(relative_path)
    if settings.onelake_enabled:
        _onelake_upload(path, content, content_type)
        return path
    full = _local_path(path)
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_bytes(content)
    return path


def read_bytes(relative_path: str) -> bytes:
    path = _safe_relative(relative_path)
    if settings.onelake_enabled:
        return _onelake_download(path)
    full = _local_path(path)
    if not full.exists():
        raise StorageError("File not found", status_code=404)
    return full.read_bytes()


def delete_file(relative_path: str) -> None:
    path = _safe_relative(relative_path)
    if settings.onelake_enabled:
        _onelake_delete(path)
        return
    full = _local_path(path)
    if full.exists():
        full.unlink()


def file_exists(relative_path: str) -> bool:
    path = _safe_relative(relative_path)
    if settings.onelake_enabled:
        return _onelake_exists(path)
    return _local_path(path).exists()


def list_files(prefix: str) -> list[str]:
    path = _safe_relative(prefix) if prefix else ""
    if settings.onelake_enabled:
        return _onelake_list(path)
    root = _local_path(path) if path else Path(settings.UPLOAD_DIR)
    if not root.exists():
        return []
    base = Path(settings.UPLOAD_DIR)
    return [str(item.relative_to(base)) for item in root.rglob("*") if item.is_file()]


def _safe_relative(relative_path: str) -> str:
    if relative_path is None or not str(relative_path).strip():
        raise StorageError("File path is required")
    raw = str(relative_path).replace("\\", "/").strip()
    if raw.startswith("/") or ".." in Path(raw).parts:
        raise StorageError("Invalid file path")
    parts = [part for part in raw.split("/") if part and part not in {".", ".."}]
    if not parts:
        raise StorageError("Invalid file path")
    return "/".join(parts)


def _local_path(relative_path: str) -> Path:
    root = Path(settings.UPLOAD_DIR).resolve()
    full = (root / relative_path).resolve()
    if root != full and root not in full.parents:
        raise StorageError("Invalid file path")
    return full


def _credential():
    from azure.identity import DefaultAzureCredential

    return DefaultAzureCredential(exclude_interactive_browser_credential=False)


def _filesystem():
    from azure.storage.filedatalake import DataLakeServiceClient

    service = DataLakeServiceClient(account_url=settings.ONELAKE_ACCOUNT_URL, credential=_credential())
    # OneLake filesystem name is the Fabric workspace name.
    return service.get_file_system_client(settings.ONELAKE_WORKSPACE)


def _onelake_file(relative_path: str):
    lakehouse = settings.ONELAKE_LAKEHOUSE
    if not lakehouse.endswith(".Lakehouse"):
        lakehouse = f"{lakehouse}.Lakehouse"
    remote = f"{lakehouse}/Files/{ROOT_FOLDER}/{relative_path}"
    return _filesystem().get_file_client(remote)


def _onelake_upload(relative_path: str, content: bytes, content_type: str | None) -> None:
    try:
        file_client = _onelake_file(relative_path)
        file_client.upload_data(content, overwrite=True)
        if content_type:
            file_client.set_metadata({"content_type": content_type})
    except StorageError:
        raise
    except Exception as exc:
        logger.exception("OneLake upload failed")
        raise StorageError("OneLake upload failed") from exc


def _onelake_download(relative_path: str) -> bytes:
    try:
        return _onelake_file(relative_path).download_file().readall()
    except Exception as exc:
        logger.exception("OneLake download failed")
        raise StorageError("File not found", status_code=404) from exc


def _onelake_delete(relative_path: str) -> None:
    try:
        _onelake_file(relative_path).delete_file()
    except Exception:
        logger.info("OneLake delete skipped for missing file")


def _onelake_exists(relative_path: str) -> bool:
    try:
        return _onelake_file(relative_path).exists()
    except Exception:
        return False


def _onelake_list(prefix: str) -> list[str]:
    try:
        lakehouse = settings.ONELAKE_LAKEHOUSE
        if not lakehouse.endswith(".Lakehouse"):
            lakehouse = f"{lakehouse}.Lakehouse"
        directory = f"{lakehouse}/Files/{ROOT_FOLDER}/{prefix}".rstrip("/")
        paths = _filesystem().get_paths(path=directory, recursive=True)
        root = f"{lakehouse}/Files/{ROOT_FOLDER}/"
        found = []
        for item in paths:
            if getattr(item, "is_directory", False):
                continue
            name = item.name
            if name.startswith(root):
                found.append(name[len(root):])
        return found
    except Exception as exc:
        logger.exception("OneLake list failed")
        raise StorageError("OneLake list failed") from exc

"""
Knowledge pipeline Pydantic schemas — request/response models.
"""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class KnowledgeSourceResponse(BaseModel):
    id: str
    employee_id: str
    name: str
    original_filename: str | None = None
    type: str | None = None
    source_type: str | None = None
    status: str = "UPLOADED"
    processing_stage: str | None = None
    file_size: int | None = None
    mime_type: str | None = None
    coverage: int = 0
    skills_extracted: int = 0
    projects_found: int = 0
    confidence: int = 0
    connected: bool = True
    error_code: str | None = None
    error_message: str | None = None
    analysis_result: dict | None = None
    last_synced: datetime | None = None
    processed_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    source_id: str
    status: str
    message: str
    skills_added: int = 0
    skills_updated: int = 0
    projects_added: int = 0
    certifications_added: int = 0
    conflicts: int = 0


class KnowledgeAnalysisResponse(BaseModel):
    source_id: str
    document_type: str | None = None
    skills_discovered: list[dict] = []
    projects_discovered: list[dict] = []
    certifications_discovered: list[dict] = []
    experience_discovered: list[dict] = []
    education_discovered: list[dict] = []
    achievements: list[str] = []


class ChangeProposalResponse(BaseModel):
    operation: str
    entity_type: str
    entity_key: str
    old_value: dict | None = None
    new_value: dict | None = None
    confidence: float = 0.0
    reason: str = ""
    requires_approval: bool = False


class UpdateEventResponse(BaseModel):
    id: str
    operation: str
    entity_type: str
    entity_key: str
    confidence: float | None = None
    reason: str | None = None
    approval_status: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

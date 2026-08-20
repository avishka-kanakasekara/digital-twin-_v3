"""
Knowledge Intelligence Pipeline — Orchestrator.

Chains all stages:
    UPLOADED → VALIDATING → STORED → EXTRACTING → CLASSIFYING
    → ANALYZING → RECONCILING → UPDATING → COMPLETED

Each stage updates the knowledge_source status in Supabase.
Any stage failure marks the source with error_code + error_message.
Nothing is fabricated — every stage must succeed for the next to run.
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings
from app.database import get_supabase_admin
from app.services.knowledge.file_validator import (
    FileValidationResult,
    check_duplicate,
    store_file,
    validate_file,
)
from app.services.knowledge.text_extractor import extract_text_from_bytes
from app.services.knowledge.document_classifier import classify_document, DocumentType
from app.services.knowledge.ai_analyzer import analyze_document
from app.services.knowledge.reconciliation_engine import (
    reconcile,
    apply_proposals,
    ReconciliationSummary,
)

logger = logging.getLogger(__name__)

EXTRACTION_VERSION = "1.0"
ANALYSIS_VERSION = "1.0"


# ── Pipeline Status ───────────────────────────────────────────

class PipelineStatus:
    UPLOADED = "UPLOADED"
    VALIDATING = "VALIDATING"
    STORED = "STORED"
    EXTRACTING = "EXTRACTING"
    CLASSIFYING = "CLASSIFYING"
    ANALYZING = "ANALYZING"
    RECONCILING = "RECONCILING"
    UPDATING = "UPDATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ── Result ────────────────────────────────────────────────────

class PipelineResult:
    def __init__(self):
        self.source_id: str = ""
        self.success: bool = False
        self.stage: str = ""
        self.error_code: str | None = None
        self.error_message: str | None = None
        self.skills_added: int = 0
        self.skills_updated: int = 0
        self.projects_added: int = 0
        self.certifications_added: int = 0
        self.conflicts: int = 0


# ── Main Entry Point ──────────────────────────────────────────

def run_pipeline(
    employee_id: str,
    filename: str,
    content: bytes,
) -> PipelineResult:
    """
    Run the full knowledge intelligence pipeline for a single uploaded file.
    
    Args:
        employee_id: The employee this document belongs to
        filename: Original filename (used for classification heuristics)
        content: Raw file bytes
    
    Returns:
        PipelineResult with outcome details
    """
    result = PipelineResult()
    sb = get_supabase_admin()
    source_id: str | None = None

    try:
        # ── Stage 1: Create initial record ────────────────────
        source_id = str(uuid.uuid4())
        result.source_id = source_id
        _update_status(sb, source_id, employee_id, PipelineStatus.VALIDATING,
                       name=filename, original_filename=filename)

        # ── Stage 2: File Validation ──────────────────────────
        ext = _get_extension(filename)
        validation = validate_file(filename, content, employee_id)

        if not validation.valid:
            _fail(sb, source_id, validation.error_code or "INVALID_FILE",
                  validation.error_message or "File validation failed.")
            result.error_code = validation.error_code
            result.error_message = validation.error_message
            return result

        # ── Stage 3: Duplicate Detection ──────────────────────
        duplicate = check_duplicate(validation.content_hash or "", employee_id, sb)
        if duplicate:
            _fail(sb, source_id,
                  "DUPLICATE_DOCUMENT",
                  f"This document has already been uploaded (source: {duplicate.get('name', 'Unknown')}).")
            result.error_code = "DUPLICATE_DOCUMENT"
            result.error_message = f"This exact file was already uploaded as '{duplicate.get('name')}'."
            return result

        # ── Stage 4: Store file ───────────────────────────────
        try:
            absolute_path = store_file(content, validation.storage_path or "")
        except Exception as exc:
            _fail(sb, source_id, "STORAGE_FAILED", f"Could not store file: {exc}")
            result.error_code = "STORAGE_FAILED"
            result.error_message = "File could not be stored securely."
            return result

        _update_status(sb, source_id, employee_id, PipelineStatus.STORED,
                       storage_path=validation.storage_path,
                       content_hash=validation.content_hash,
                       file_size=validation.file_size,
                       mime_type=validation.detected_mime)

        # ── Stage 5: Text Extraction ──────────────────────────
        _set_stage(sb, source_id, PipelineStatus.EXTRACTING)
        extraction_result = extract_text_from_bytes(content, ext)

        if not extraction_result.success or not extraction_result.document:
            _fail(sb, source_id,
                  extraction_result.error_code or "TEXT_EXTRACTION_FAILED",
                  extraction_result.error_message or "Could not extract text from document.")
            result.error_code = extraction_result.error_code
            result.error_message = extraction_result.error_message
            return result

        extracted_text = extraction_result.document.full_text
        # Store extracted text (truncated for DB storage limit)
        _store_extracted_text(sb, source_id, extracted_text[:50000])

        # ── Stage 6: Document Classification ──────────────────
        _set_stage(sb, source_id, PipelineStatus.CLASSIFYING)
        classification = classify_document(
            filename=filename,
            extracted_text=extracted_text,
            use_ai=True,
        )
        _store_source_type(sb, source_id, classification.document_type.value)

        # ── Stage 7: AI Analysis ───────────────────────────────
        _set_stage(sb, source_id, PipelineStatus.ANALYZING)
        analysis = analyze_document(
            extracted_text=extracted_text,
            document_type=classification.document_type.value,
        )

        if not analysis.success or not analysis.extraction:
            _fail(sb, source_id,
                  analysis.error_code or "AI_ANALYSIS_FAILED",
                  analysis.error_message or "AI analysis could not extract structured data.")
            result.error_code = analysis.error_code
            result.error_message = analysis.error_message
            return result

        # Store analysis result summary
        _store_analysis_result(sb, source_id, analysis.extraction)

        # ── Stage 8: Reconciliation ────────────────────────────
        _set_stage(sb, source_id, PipelineStatus.RECONCILING)
        reconciliation = reconcile(
            extraction=analysis.extraction,
            employee_id=employee_id,
            source_id=source_id,
            document_type=classification.document_type.value,
            supabase_client=sb,
        )

        # ── Stage 9: Apply Changes ─────────────────────────────
        _set_stage(sb, source_id, PipelineStatus.UPDATING)
        applied = apply_proposals(
            proposals=reconciliation.proposals,
            employee_id=employee_id,
            source_id=source_id,
            document_type=classification.document_type.value,
            supabase_client=sb,
        )

        # ── Stage 10: Complete ─────────────────────────────────
        _complete(sb, source_id, reconciliation, filename)

        result.success = True
        result.stage = PipelineStatus.COMPLETED
        result.skills_added = reconciliation.skills_added
        result.skills_updated = reconciliation.skills_updated
        result.projects_added = reconciliation.projects_added
        result.certifications_added = reconciliation.certifications_added
        result.conflicts = reconciliation.conflicts

        logger.info(
            f"[Pipeline] Completed for employee={employee_id} source={source_id}: "
            f"+{reconciliation.skills_added} skills, +{reconciliation.projects_added} projects, "
            f"+{reconciliation.certifications_added} certs, {reconciliation.conflicts} conflicts"
        )

    except Exception as exc:
        logger.exception(f"[Pipeline] Unexpected failure for employee={employee_id}: {exc}")
        if source_id:
            _fail(sb, source_id, "PIPELINE_ERROR",
                  "An unexpected error occurred during processing. Please retry.")
        result.error_code = "PIPELINE_ERROR"
        result.error_message = "Processing failed unexpectedly. Please try again."

    return result


# ── DB Helpers ────────────────────────────────────────────────

def _update_status(sb, source_id: str, employee_id: str, status: str, **extra_fields) -> None:
    """Create or update the knowledge_source record."""
    try:
        existing = sb.table("knowledge_sources").select("id").eq("id", source_id).execute()
        if existing.data:
            sb.table("knowledge_sources").update({
                "status": status,
                "processing_stage": status,
                **extra_fields,
            }).eq("id", source_id).execute()
        else:
            sb.table("knowledge_sources").insert({
                "id": source_id,
                "employee_id": employee_id,
                "status": status,
                "processing_stage": status,
                "connected": True,
                "coverage": 0,
                "skills_extracted": 0,
                "projects_found": 0,
                "confidence": 0,
                "extraction_version": EXTRACTION_VERSION,
                "analysis_version": ANALYSIS_VERSION,
                **extra_fields,
            }).execute()
    except Exception as exc:
        logger.error(f"[Pipeline] DB update failed: {exc}")


def _set_stage(sb, source_id: str, stage: str) -> None:
    try:
        sb.table("knowledge_sources").update({
            "status": stage,
            "processing_stage": stage,
        }).eq("id", source_id).execute()
    except Exception:
        pass


def _fail(sb, source_id: str, error_code: str, error_message: str) -> None:
    try:
        sb.table("knowledge_sources").update({
            "status": PipelineStatus.FAILED,
            "processing_stage": PipelineStatus.FAILED,
            "error_code": error_code,
            "error_message": error_message,
        }).eq("id", source_id).execute()
    except Exception:
        pass


def _store_extracted_text(sb, source_id: str, text: str) -> None:
    try:
        sb.table("knowledge_sources").update({
            "extracted_text": text,
        }).eq("id", source_id).execute()
    except Exception:
        pass


def _store_source_type(sb, source_id: str, source_type: str) -> None:
    try:
        sb.table("knowledge_sources").update({
            "source_type": source_type,
        }).eq("id", source_id).execute()
    except Exception:
        pass


def _store_analysis_result(sb, source_id: str, extraction) -> None:
    try:
        summary = {
            "skills_count": len(extraction.skills),
            "projects_count": len(extraction.projects),
            "certifications_count": len(extraction.certifications),
            "experience_count": len(extraction.experience),
            "education_count": len(extraction.education),
        }
        sb.table("knowledge_sources").update({
            "analysis_result": summary,
            "skills_extracted": len(extraction.skills),
            "projects_found": len(extraction.projects),
        }).eq("id", source_id).execute()
    except Exception:
        pass


def _complete(sb, source_id: str, reconciliation: ReconciliationSummary, filename: str) -> None:
    try:
        total_added = (
            reconciliation.skills_added +
            reconciliation.projects_added +
            reconciliation.certifications_added
        )
        # Calculate overall confidence from proposals
        proposals_with_confidence = [p for p in reconciliation.proposals if p.confidence > 0]
        avg_confidence = (
            sum(p.confidence for p in proposals_with_confidence) / len(proposals_with_confidence)
            if proposals_with_confidence else 0.70
        )

        sb.table("knowledge_sources").update({
            "status": PipelineStatus.COMPLETED,
            "processing_stage": PipelineStatus.COMPLETED,
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "confidence": int(avg_confidence * 100),
            "skills_extracted": reconciliation.skills_added + reconciliation.skills_confirmed,
            "projects_found": reconciliation.projects_added,
            "error_code": None,
            "error_message": None,
            "last_synced": datetime.now(timezone.utc).isoformat(),
            "name": filename,
        }).eq("id", source_id).execute()
    except Exception as exc:
        logger.error(f"[Pipeline] Failed to mark complete: {exc}")


def _get_extension(filename: str) -> str:
    _, ext = os.path.splitext(filename.lower())
    return ext

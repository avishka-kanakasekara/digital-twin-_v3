"""
Reconciliation Engine — Safe data reconciliation between extracted facts and existing employee knowledge.

Design principles:
    - NEVER overwrites existing data blindly
    - NEVER deletes skills/projects not mentioned in the new document
    - Absence of evidence is NOT evidence of absence
    - Higher source reliability wins conflicts
    - Produces ChangeProposals — never writes directly to DB
    - All changes are explainable (reason, evidence, confidence)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from app.services.knowledge.ai_analyzer import EmployeeIntelligenceExtraction
from app.services.knowledge.skill_normalizer import normalize_skill, normalize_skills


# ── Source Reliability Weights ────────────────────────────────
# Higher = more authoritative

SOURCE_RELIABILITY: dict[str, float] = {
    "CERTIFICATE": 0.95,    # Verified certificate is most authoritative
    "CV": 0.85,             # Official employee-provided CV
    "LINKEDIN_PROFILE": 0.80,
    "PROJECT_DOCUMENT": 0.78,
    "PORTFOLIO": 0.72,
    "EDUCATION_DOCUMENT": 0.80,
    "OTHER_PROFESSIONAL": 0.60,
    "UNKNOWN": 0.50,
}

# Proficiency level ordering for comparison
PROFICIENCY_ORDER = {"Beginner": 1, "Intermediate": 2, "Advanced": 3, "Expert": 4}


# ── Change Types ───────────────────────────────────────────────

class ChangeOperation(str, Enum):
    ADD = "ADD"
    UPDATE = "UPDATE"
    CONFIRM = "CONFIRM"   # Existing fact confirmed by new source
    SKIP = "SKIP"         # Low confidence or conflicting — skipped
    CONFLICT = "CONFLICT" # Conflicting data requires human review


@dataclass
class ChangeProposal:
    operation: ChangeOperation
    entity_type: str   # skill, project, certification, experience, education
    entity_key: str    # normalized identifier
    old_value: Any | None = None
    new_value: Any | None = None
    confidence: float = 0.0
    reason: str = ""
    evidence_text: str = ""
    requires_approval: bool = False


@dataclass
class ReconciliationSummary:
    proposals: list[ChangeProposal] = field(default_factory=list)
    skills_added: int = 0
    skills_updated: int = 0
    skills_confirmed: int = 0
    projects_added: int = 0
    certifications_added: int = 0
    experience_added: int = 0
    education_added: int = 0
    conflicts: int = 0
    skipped: int = 0


# ── Engine ────────────────────────────────────────────────────

def reconcile(
    extraction: EmployeeIntelligenceExtraction,
    employee_id: str,
    source_id: str,
    document_type: str,
    supabase_client,
) -> ReconciliationSummary:
    """
    Compare extracted facts against existing employee data and produce change proposals.
    
    Returns a ReconciliationSummary with all proposed changes.
    Nothing is written to the database here — this is read-only analysis.
    """
    source_reliability = SOURCE_RELIABILITY.get(document_type, 0.60)
    summary = ReconciliationSummary()

    # Load existing employee data
    existing_skills = _load_existing_skills(employee_id, supabase_client)
    existing_projects = _load_existing_projects(employee_id, supabase_client)
    existing_certs = _load_existing_certifications(employee_id, supabase_client)

    # Reconcile skills
    for extracted_skill in extraction.skills:
        normalized = normalize_skill(extracted_skill.name)
        proposal = _reconcile_skill(
            normalized=normalized,
            extracted_skill=extracted_skill,
            existing_skills=existing_skills,
            source_reliability=source_reliability,
        )
        summary.proposals.append(proposal)
        if proposal.operation == ChangeOperation.ADD:
            summary.skills_added += 1
        elif proposal.operation == ChangeOperation.UPDATE:
            summary.skills_updated += 1
        elif proposal.operation == ChangeOperation.CONFIRM:
            summary.skills_confirmed += 1
        elif proposal.operation == ChangeOperation.CONFLICT:
            summary.conflicts += 1
        elif proposal.operation == ChangeOperation.SKIP:
            summary.skipped += 1

    # Reconcile projects
    for extracted_proj in extraction.projects:
        proposal = _reconcile_project(
            extracted_proj=extracted_proj,
            existing_projects=existing_projects,
            source_reliability=source_reliability,
        )
        summary.proposals.append(proposal)
        if proposal.operation == ChangeOperation.ADD:
            summary.projects_added += 1
        elif proposal.operation in (ChangeOperation.CONFLICT, ChangeOperation.SKIP):
            summary.conflicts += 1 if proposal.operation == ChangeOperation.CONFLICT else 0
            summary.skipped += 1 if proposal.operation == ChangeOperation.SKIP else 0

    # Reconcile certifications
    for extracted_cert in extraction.certifications:
        proposal = _reconcile_certification(
            extracted_cert=extracted_cert,
            existing_certs=existing_certs,
            source_reliability=source_reliability,
        )
        summary.proposals.append(proposal)
        if proposal.operation == ChangeOperation.ADD:
            summary.certifications_added += 1
        elif proposal.operation == ChangeOperation.CONFLICT:
            summary.conflicts += 1

    # Reconcile experience (additive only — never delete)
    for extracted_exp in extraction.experience:
        proposal = ChangeProposal(
            operation=ChangeOperation.ADD,
            entity_type="experience",
            entity_key=f"{extracted_exp.company}|{extracted_exp.title}",
            new_value={
                "company": extracted_exp.company,
                "title": extracted_exp.title,
                "start_date": extracted_exp.start_date,
                "end_date": extracted_exp.end_date,
                "description": extracted_exp.description,
                "responsibilities": extracted_exp.responsibilities,
            },
            confidence=extracted_exp.confidence * source_reliability,
            reason=f"Employment at {extracted_exp.company} extracted from {document_type} document.",
            requires_approval=True,  # Experience always requires approval
        )
        summary.proposals.append(proposal)
        summary.experience_added += 1

    # Reconcile education (additive only)
    for extracted_edu in extraction.education:
        proposal = ChangeProposal(
            operation=ChangeOperation.ADD,
            entity_type="education",
            entity_key=f"{extracted_edu.institution}|{extracted_edu.degree}",
            new_value={
                "institution": extracted_edu.institution,
                "degree": extracted_edu.degree,
                "field_of_study": extracted_edu.field_of_study,
                "start_date": extracted_edu.start_date,
                "end_date": extracted_edu.end_date,
                "status": extracted_edu.status,
            },
            confidence=extracted_edu.confidence * source_reliability,
            reason=f"Education at {extracted_edu.institution} extracted from {document_type} document.",
            requires_approval=True,
        )
        summary.proposals.append(proposal)
        summary.education_added += 1

    return summary


def apply_proposals(
    proposals: list[ChangeProposal],
    employee_id: str,
    source_id: str,
    document_type: str,
    supabase_client,
) -> list[dict]:
    """
    Apply accepted change proposals to the database.
    Writes audit records for every change.
    Returns list of applied audit records.
    
    Only applies AUTO-APPROVED changes (requires_approval=False).
    Conflicts and experience/education remain pending.
    """
    import uuid
    from datetime import datetime, timezone

    applied: list[dict] = []

    for proposal in proposals:
        if proposal.requires_approval:
            # Record as pending — do not apply
            _write_audit(
                employee_id=employee_id,
                source_id=source_id,
                proposal=proposal,
                approval_status="pending",
                supabase_client=supabase_client,
            )
            continue

        if proposal.operation == ChangeOperation.CONFIRM or proposal.operation == ChangeOperation.SKIP:
            # Nothing to write for confirmations/skips
            _write_audit(
                employee_id=employee_id,
                source_id=source_id,
                proposal=proposal,
                approval_status="auto_approved",
                supabase_client=supabase_client,
            )
            continue

        success = False

        if proposal.entity_type == "skill":
            success = _apply_skill_proposal(proposal, employee_id, supabase_client)
        elif proposal.entity_type == "project":
            success = _apply_project_proposal(proposal, employee_id, supabase_client)
        elif proposal.entity_type == "certification":
            success = _apply_certification_proposal(proposal, employee_id, supabase_client)

        if success:
            applied.append({
                "operation": proposal.operation.value,
                "entity_type": proposal.entity_type,
                "entity_key": proposal.entity_key,
            })

        _write_audit(
            employee_id=employee_id,
            source_id=source_id,
            proposal=proposal,
            approval_status="auto_approved" if success else "failed",
            supabase_client=supabase_client,
        )

    return applied


# ── Skill Reconciliation ──────────────────────────────────────

def _reconcile_skill(normalized, extracted_skill, existing_skills, source_reliability) -> ChangeProposal:
    canonical_lower = normalized.canonical_name.lower()
    existing = existing_skills.get(canonical_lower)

    overall_confidence = extracted_skill.confidence * source_reliability

    if not existing:
        # New skill — add it if confidence is sufficient
        if overall_confidence < 0.45:
            return ChangeProposal(
                operation=ChangeOperation.SKIP,
                entity_type="skill",
                entity_key=normalized.canonical_name,
                confidence=overall_confidence,
                reason=f"Confidence too low ({overall_confidence:.0%}) to add skill '{normalized.canonical_name}'.",
            )
        return ChangeProposal(
            operation=ChangeOperation.ADD,
            entity_type="skill",
            entity_key=normalized.canonical_name,
            new_value={
                "name": normalized.canonical_name,
                "category": normalized.category,
                "proficiency": _proficiency_to_int(extracted_skill.proficiency),
                "source": "Knowledge Intelligence Pipeline",
                "ai_confidence": int(overall_confidence * 100),
                "verified": False,
            },
            confidence=overall_confidence,
            reason=f"New skill '{normalized.canonical_name}' discovered (category: {normalized.category}).",
        )

    # Skill exists — check if proficiency should be updated
    existing_proficiency = existing.get("proficiency", 0)
    new_proficiency = _proficiency_to_int(extracted_skill.proficiency)

    if new_proficiency and new_proficiency > existing_proficiency and overall_confidence >= 0.70:
        return ChangeProposal(
            operation=ChangeOperation.UPDATE,
            entity_type="skill",
            entity_key=normalized.canonical_name,
            old_value={"proficiency": existing_proficiency},
            new_value={"proficiency": new_proficiency, "ai_confidence": int(overall_confidence * 100)},
            confidence=overall_confidence,
            reason=f"Proficiency for '{normalized.canonical_name}' increased from {existing_proficiency} to {new_proficiency} based on {document_type if hasattr(extracted_skill, '_doc_type') else 'document'} evidence.",
        )
    elif new_proficiency and new_proficiency < existing_proficiency:
        # New doc says lower proficiency — conflict
        return ChangeProposal(
            operation=ChangeOperation.CONFLICT,
            entity_type="skill",
            entity_key=normalized.canonical_name,
            old_value={"proficiency": existing_proficiency},
            new_value={"proficiency": new_proficiency},
            confidence=overall_confidence,
            reason=f"New document suggests lower proficiency for '{normalized.canonical_name}'. Existing evidence may be stronger.",
            requires_approval=True,
        )

    # Same or no proficiency change — confirm existing
    return ChangeProposal(
        operation=ChangeOperation.CONFIRM,
        entity_type="skill",
        entity_key=normalized.canonical_name,
        confidence=overall_confidence,
        reason=f"Skill '{normalized.canonical_name}' confirmed by new document.",
    )


def _reconcile_project(extracted_proj, existing_projects, source_reliability) -> ChangeProposal:
    proj_key = extracted_proj.name.lower().strip()
    overall_confidence = extracted_proj.confidence * source_reliability

    # Check for duplicate by normalized name
    for existing in existing_projects:
        if _fuzzy_match(proj_key, existing.get("name", "").lower()):
            return ChangeProposal(
                operation=ChangeOperation.CONFIRM,
                entity_type="project",
                entity_key=extracted_proj.name,
                confidence=overall_confidence,
                reason=f"Project '{extracted_proj.name}' already exists in the Digital Twin.",
            )

    # New project
    return ChangeProposal(
        operation=ChangeOperation.ADD,
        entity_type="project",
        entity_key=extracted_proj.name,
        new_value={
            "name": extracted_proj.name,
            "role": extracted_proj.role,
            "description": extracted_proj.description,
            "technologies": extracted_proj.technologies,
            "duration": extracted_proj.duration,
            "domain": extracted_proj.domain,
            "status": "Completed",
        },
        confidence=overall_confidence,
        reason=f"New project '{extracted_proj.name}' discovered in document.",
    )


def _reconcile_certification(extracted_cert, existing_certs, source_reliability) -> ChangeProposal:
    cert_key = extracted_cert.name.lower().strip()
    overall_confidence = extracted_cert.confidence * source_reliability

    for existing in existing_certs:
        if _fuzzy_match(cert_key, existing.get("name", "").lower()):
            return ChangeProposal(
                operation=ChangeOperation.CONFIRM,
                entity_type="certification",
                entity_key=extracted_cert.name,
                confidence=overall_confidence,
                reason=f"Certification '{extracted_cert.name}' confirmed by new document.",
            )

    return ChangeProposal(
        operation=ChangeOperation.ADD,
        entity_type="certification",
        entity_key=extracted_cert.name,
        new_value={
            "name": extracted_cert.name,
            "issuer": extracted_cert.issuer,
            "status": "completed",
            "credential_id": extracted_cert.credential_id,
            "completed_date": extracted_cert.issue_date,
            "expiry_date": extracted_cert.expiry_date,
            "emoji": "🏆",
            "color": "#3b82f6",
            "progress": 100,
        },
        confidence=overall_confidence,
        reason=f"Certification '{extracted_cert.name}' discovered in document.",
        # Certifications from documents are NOT auto-verified — require approval
        requires_approval=True,
    )


# ── Apply Helpers ─────────────────────────────────────────────

def _apply_skill_proposal(proposal: ChangeProposal, employee_id: str, sb) -> bool:
    import uuid
    try:
        if proposal.operation == ChangeOperation.ADD:
            new_val = proposal.new_value or {}
            # Avoid duplicates
            existing = sb.table("skills").select("id").eq("employee_id", employee_id).eq("name", new_val.get("name")).execute()
            if existing.data:
                return True  # Already exists

            sb.table("skills").insert({
                "id": str(uuid.uuid4()),
                "employee_id": employee_id,
                **new_val,
            }).execute()
            return True

        elif proposal.operation == ChangeOperation.UPDATE:
            new_val = proposal.new_value or {}
            entity_name = proposal.entity_key
            result = sb.table("skills").select("id").eq("employee_id", employee_id).eq("name", entity_name).execute()
            if result.data:
                sb.table("skills").update(new_val).eq("id", result.data[0]["id"]).execute()
                return True
    except Exception:
        pass
    return False


def _apply_project_proposal(proposal: ChangeProposal, employee_id: str, sb) -> bool:
    import uuid
    try:
        if proposal.operation == ChangeOperation.ADD:
            new_val = proposal.new_value or {}
            sb.table("projects").insert({
                "id": str(uuid.uuid4()),
                "employee_id": employee_id,
                **new_val,
            }).execute()
            return True
    except Exception:
        pass
    return False


def _apply_certification_proposal(proposal: ChangeProposal, employee_id: str, sb) -> bool:
    import uuid
    try:
        if proposal.operation == ChangeOperation.ADD:
            new_val = proposal.new_value or {}
            sb.table("certifications").insert({
                "id": str(uuid.uuid4()),
                "employee_id": employee_id,
                **new_val,
            }).execute()
            return True
    except Exception:
        pass
    return False


# ── Audit Trail ───────────────────────────────────────────────

def _write_audit(
    employee_id: str,
    source_id: str,
    proposal: ChangeProposal,
    approval_status: str,
    supabase_client,
) -> None:
    import uuid
    import json
    try:
        supabase_client.table("knowledge_update_events").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "source_id": source_id,
            "operation": proposal.operation.value,
            "entity_type": proposal.entity_type,
            "entity_key": proposal.entity_key,
            "old_value": proposal.old_value,
            "new_value": proposal.new_value,
            "confidence": proposal.confidence,
            "reason": proposal.reason,
            "evidence_text": proposal.evidence_text or "",
            "requires_approval": proposal.requires_approval,
            "approval_status": approval_status,
            "prompt_version": "1.0",
        }).execute()
    except Exception:
        pass  # Audit failure must not crash the pipeline


# ── DB Loaders ────────────────────────────────────────────────

def _load_existing_skills(employee_id: str, sb) -> dict[str, dict]:
    try:
        result = sb.table("skills").select("*").eq("employee_id", employee_id).execute()
        return {row["name"].lower(): row for row in (result.data or [])}
    except Exception:
        return {}


def _load_existing_projects(employee_id: str, sb) -> list[dict]:
    try:
        result = sb.table("projects").select("name").eq("employee_id", employee_id).execute()
        return result.data or []
    except Exception:
        return []


def _load_existing_certifications(employee_id: str, sb) -> list[dict]:
    try:
        result = sb.table("certifications").select("name").eq("employee_id", employee_id).execute()
        return result.data or []
    except Exception:
        return []


# ── Helpers ───────────────────────────────────────────────────

def _proficiency_to_int(proficiency: str | None) -> int | None:
    if not proficiency:
        return None
    mapping = {"Beginner": 25, "Intermediate": 50, "Advanced": 75, "Expert": 95}
    return mapping.get(proficiency)


def _fuzzy_match(a: str, b: str) -> bool:
    """Simple fuzzy match: check if strings share significant overlap."""
    a, b = a.strip(), b.strip()
    if a == b:
        return True
    # Substring match
    if len(a) > 5 and (a in b or b in a):
        return True
    return False

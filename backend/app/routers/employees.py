from __future__ import annotations
"""
Employees router — CRUD for employee profiles, twin summary, skills, knowledge pipeline.
Uses Supabase as the database backend.
"""

import uuid
from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile, status

from app.database import get_supabase_admin
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    TwinSummaryResponse,
)
from app.schemas.skill import SkillCreate, SkillUpdate, SkillResponse
from app.schemas.knowledge import KnowledgeSourceResponse, UploadResponse

router = APIRouter(prefix="/api/employees", tags=["Employees"])


# ─── Employee CRUD ────────────────────────────────────────────

@router.get("", response_model=EmployeeListResponse)
def list_employees(
    skip: int = 0,
    limit: int = 50,
    department: str | None = None,
):
    """List all employees with optional department filter."""
    sb = get_supabase_admin()

    query = sb.table("employees").select("*", count="exact")
    if department:
        query = query.eq("department", department)

    result = query.order("full_name").range(skip, skip + limit - 1).execute()
    return EmployeeListResponse(employees=result.data, total=result.count or len(result.data))


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str):
    """Get a single employee by ID."""
    sb = get_supabase_admin()
    result = sb.table("employees").select("*").eq("id", employee_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return result.data[0]


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(data: EmployeeCreate):
    """Create a new employee (admin use — separate from register)."""
    from app.utils.auth import hash_password

    sb = get_supabase_admin()
    employee_id = str(uuid.uuid4())

    emp_data = {
        "id": employee_id,
        "employee_code": data.employee_code,
        "full_name": data.full_name,
        "email": data.email,
        "password_hash": hash_password(data.password) if data.password else None,
        "initials": data.initials or "".join(w[0].upper() for w in data.full_name.split()[:2]),
        "department": data.department,
        "role": data.role,
        "team": data.team,
        "manager_name": data.manager_name,
        "location": data.location,
        "timezone_str": data.timezone_str,
        "phone": data.phone,
        "education": data.education,
        "languages": data.languages,
        "biography": data.biography,
        "headline": data.headline,
        "avatar_url": data.avatar_url,
        "years_experience": data.years_experience,
        "years_in_company": data.years_in_company,
        "employment_type": data.employment_type,
        "employment_status": data.employment_status or "Active",
    }
    result = sb.table("employees").insert(emp_data).execute()

    # Auto-create gamification profile
    sb.table("gamification_profiles").insert({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
    }).execute()

    return result.data[0]


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: str, data: EmployeeUpdate):
    """Partially update an employee profile."""
    sb = get_supabase_admin()

    # Check exists
    existing = sb.table("employees").select("*").eq("id", employee_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return existing.data[0]

    # Compute profile completeness
    emp = existing.data[0]
    emp.update(update_data)
    update_data["profile_completeness"] = _compute_profile_completeness(emp)

    result = sb.table("employees").update(update_data).eq("id", employee_id).execute()
    return result.data[0]


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str):
    """Delete an employee and all related data (cascades)."""
    sb = get_supabase_admin()

    existing = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    sb.table("employees").delete().eq("id", employee_id).execute()


# ─── Twin Summary ─────────────────────────────────────────────

@router.get("/{employee_id}/twin-summary", response_model=TwinSummaryResponse)
def get_twin_summary(employee_id: str):
    """Get AI twin health metrics for an employee."""
    sb = get_supabase_admin()

    result = sb.table("employees").select("*").eq("id", employee_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    employee = result.data[0]

    ks_result = sb.table("knowledge_sources").select("id", count="exact").eq("employee_id", employee_id).execute()
    ks_count = ks_result.count or 0

    freshness = "High" if ks_count >= 3 else "Medium" if ks_count >= 1 else "Low"
    completeness = _compute_profile_completeness(employee)
    health = min(100, int(completeness * 0.4 + employee.get("ai_confidence", 0) * 0.3 + (ks_count * 10) * 0.3))

    return TwinSummaryResponse(
        ai_confidence=employee.get("ai_confidence", 0),
        profile_completeness=completeness,
        knowledge_freshness=freshness,
        twin_health=health,
        representation_quality="Excellent" if health >= 80 else "Good" if health >= 60 else "Needs Data",
        summary_text=f"Digital twin for {employee['full_name']}, {employee.get('role') or 'Employee'} "
                     f"in {employee.get('department') or 'Unknown'}. "
                     f"Profile is {completeness}% complete with {ks_count} knowledge sources connected.",
    )


# ─── Skills CRUD ──────────────────────────────────────────────

@router.get("/{employee_id}/skills", response_model=list[SkillResponse])
def get_employee_skills(employee_id: str):
    """Get all skills for an employee."""
    sb = get_supabase_admin()
    result = sb.table("skills").select("*").eq("employee_id", employee_id).order("category").order("name").execute()
    return result.data


@router.post("/{employee_id}/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def add_skill(employee_id: str, data: SkillCreate):
    """Add a new skill to an employee."""
    sb = get_supabase_admin()

    # Check employee exists
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Check skill uniqueness
    existing = sb.table("skills").select("id").eq("employee_id", employee_id).eq("name", data.name).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Skill already exists")

    skill_data = {
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        **data.model_dump(),
    }
    result = sb.table("skills").insert(skill_data).execute()
    return result.data[0]


@router.put("/{employee_id}/skills/{skill_id}", response_model=SkillResponse)
def update_skill(employee_id: str, skill_id: str, data: SkillUpdate):
    """Update a skill's proficiency, trend, etc."""
    sb = get_supabase_admin()

    existing = sb.table("skills").select("*").eq("id", skill_id).eq("employee_id", employee_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return existing.data[0]

    result = sb.table("skills").update(update_data).eq("id", skill_id).execute()
    return result.data[0]


@router.delete("/{employee_id}/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(employee_id: str, skill_id: str):
    """Remove a skill from an employee."""
    sb = get_supabase_admin()

    existing = sb.table("skills").select("id").eq("id", skill_id).eq("employee_id", employee_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    sb.table("skills").delete().eq("id", skill_id).execute()


# ─── Projects ─────────────────────────────────────────────────

@router.get("/{employee_id}/projects")
def get_employee_projects(employee_id: str):
    """Get all projects for an employee."""
    sb = get_supabase_admin()
    result = sb.table("projects").select("*").eq("employee_id", employee_id).order("created_at", desc=True).execute()
    projects = result.data
    current = [p for p in projects if p.get("status") != "Completed"]
    completed = [p for p in projects if p.get("status") == "Completed"]
    return {"current": current, "completed": completed}


# ─── Knowledge Sources ────────────────────────────────────────

@router.get("/{employee_id}/knowledge-sources")
def get_knowledge_sources(employee_id: str):
    """Get all knowledge sources for an employee."""
    sb = get_supabase_admin()
    result = (
        sb.table("knowledge_sources")
        .select("*")
        .eq("employee_id", employee_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/{employee_id}/knowledge-sources/upload", response_model=UploadResponse)
async def upload_knowledge_source(
    employee_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Upload a professional document (CV, certificate, project doc, etc.).
    
    The file is stored immediately. AI processing runs in the background.
    Poll GET /knowledge-sources to track progress.
    """
    # Verify employee exists
    sb = get_supabase_admin()
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Read file content
    content = await file.read()
    filename = file.filename or "uploaded_document"

    # Run pipeline in background (returns immediately)
    from app.services.knowledge.pipeline import run_pipeline

    # Use a list to capture result from background task
    pipeline_result_holder: list = []

    def _run():
        result = run_pipeline(
            employee_id=employee_id,
            filename=filename,
            content=content,
        )
        pipeline_result_holder.append(result)

    background_tasks.add_task(_run)

    return UploadResponse(
        source_id="processing",
        status="PROCESSING",
        message=f"'{filename}' received and queued for processing. The AI pipeline will extract skills, projects, and certifications automatically.",
    )


@router.post("/{employee_id}/knowledge-sources/upload-sync", response_model=UploadResponse)
async def upload_knowledge_source_sync(
    employee_id: str,
    file: UploadFile = File(...),
):
    """
    Upload and synchronously process a document.
    Blocks until the full pipeline completes. Use for testing.
    For production use the async /upload endpoint.
    """
    sb = get_supabase_admin()
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    content = await file.read()
    filename = file.filename or "uploaded_document"

    from app.services.knowledge.pipeline import run_pipeline
    result = run_pipeline(
        employee_id=employee_id,
        filename=filename,
        content=content,
    )

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result.error_message or "Document processing failed.",
        )

    return UploadResponse(
        source_id=result.source_id,
        status="COMPLETED",
        message=f"Document processed successfully.",
        skills_added=result.skills_added,
        skills_updated=result.skills_updated,
        projects_added=result.projects_added,
        certifications_added=result.certifications_added,
        conflicts=result.conflicts,
    )


@router.get("/{employee_id}/knowledge-sources/{source_id}")
def get_knowledge_source(employee_id: str, source_id: str):
    """Get a single knowledge source with full status details."""
    sb = get_supabase_admin()
    result = (
        sb.table("knowledge_sources")
        .select("*")
        .eq("id", source_id)
        .eq("employee_id", employee_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge source not found")
    return result.data[0]


@router.post("/{employee_id}/knowledge-sources/{source_id}/reprocess")
async def reprocess_knowledge_source(
    employee_id: str,
    source_id: str,
    background_tasks: BackgroundTasks,
):
    """Reprocess an existing knowledge source (re-runs the full pipeline)."""
    sb = get_supabase_admin()
    result = (
        sb.table("knowledge_sources")
        .select("*")
        .eq("id", source_id)
        .eq("employee_id", employee_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge source not found")

    source = result.data[0]
    storage_path = source.get("storage_path")
    filename = source.get("original_filename") or source.get("name", "document")

    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No stored file found for this knowledge source. Please re-upload.",
        )

    from app.config import settings
    from pathlib import Path

    full_path = Path(settings.UPLOAD_DIR) / storage_path
    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Stored file not found. Please re-upload.",
        )

    content = full_path.read_bytes()

    # Reset status
    sb.table("knowledge_sources").update({
        "status": "UPLOADED",
        "processing_stage": "UPLOADED",
        "error_code": None,
        "error_message": None,
    }).eq("id", source_id).execute()

    from app.services.knowledge.pipeline import run_pipeline

    def _run():
        run_pipeline(
            employee_id=employee_id,
            filename=filename,
            content=content,
        )

    background_tasks.add_task(_run)
    return {"status": "REPROCESSING", "message": "Reprocessing started in background."}


@router.delete("/{employee_id}/knowledge-sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledge_source(employee_id: str, source_id: str):
    """Delete a knowledge source and its stored file."""
    sb = get_supabase_admin()
    result = (
        sb.table("knowledge_sources")
        .select("*")
        .eq("id", source_id)
        .eq("employee_id", employee_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge source not found")

    source = result.data[0]
    storage_path = source.get("storage_path")

    # Delete stored file
    if storage_path:
        from app.services.knowledge.file_validator import delete_stored_file
        delete_stored_file(storage_path)

    # Delete DB record (cascades to extracted_facts + update_events)
    sb.table("knowledge_sources").delete().eq("id", source_id).execute()


@router.get("/{employee_id}/knowledge-sources/{source_id}/changes")
def get_knowledge_source_changes(employee_id: str, source_id: str):
    """Get the audit trail of changes made by this knowledge source."""
    sb = get_supabase_admin()
    result = (
        sb.table("knowledge_update_events")
        .select("*")
        .eq("source_id", source_id)
        .eq("employee_id", employee_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/{employee_id}/knowledge/change-history")
def get_knowledge_change_history(employee_id: str):
    """Get full knowledge change history for an employee."""
    sb = get_supabase_admin()
    result = (
        sb.table("knowledge_update_events")
        .select("*")
        .eq("employee_id", employee_id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return result.data or []


# ─── Recognitions ─────────────────────────────────────────────

@router.get("/{employee_id}/recognitions")
def get_recognitions(employee_id: str):
    """Get all recognitions for an employee."""
    sb = get_supabase_admin()
    result = sb.table("recognitions").select("*").eq("employee_id", employee_id).order("date", desc=True).execute()
    return result.data


# ─── Certifications ──────────────────────────────────────────

@router.get("/{employee_id}/certifications")
def get_certifications(employee_id: str):
    """Get certifications for an employee."""
    sb = get_supabase_admin()
    result = sb.table("certifications").select("*").eq("employee_id", employee_id).order("status").order("name").execute()
    return result.data


# ─── Personal Analytics ────────────────────────────────────────

@router.get("/{employee_id}/analytics")
def get_personal_analytics(employee_id: str):
    """Get personal analytics data (productivity and skill growth trends)."""
    # TODO: Compute from actual activity data in Phase 6
    return {
        "productivity": [
            {"day": "Mon", "score": 85},
            {"day": "Tue", "score": 92},
            {"day": "Wed", "score": 78},
            {"day": "Thu", "score": 95},
            {"day": "Fri", "score": 88},
        ],
        "skillGrowth": [
            {"month": "Jan", "ai": 40, "cloud": 85, "leadership": 60},
            {"month": "Feb", "ai": 45, "cloud": 88, "leadership": 65},
            {"month": "Mar", "ai": 60, "cloud": 90, "leadership": 70},
            {"month": "Apr", "ai": 78, "cloud": 95, "leadership": 80},
        ],
    }


# ─── Skills Data (Grouped by Category) ───────────────────────

@router.get("/{employee_id}/skills-grouped")
def get_skills_grouped(employee_id: str):
    """Get skills grouped by category for the dashboard."""
    sb = get_supabase_admin()
    result = sb.table("skills").select("*").eq("employee_id", employee_id).order("category").order("name").execute()

    grouped = {}
    for skill in result.data:
        cat = skill.get("category") or "General"
        if cat not in grouped:
            grouped[cat] = []
        last_updated = skill.get("last_updated", "Unknown")
        if last_updated and last_updated != "Unknown":
            last_updated = last_updated[:10]  # Extract YYYY-MM-DD
        grouped[cat].append({
            "id": skill["id"],
            "name": skill["name"],
            "category": skill.get("category"),
            "sub_category": skill.get("sub_category"),
            "experience": skill.get("years_experience") or 0,
            "proficiency": skill.get("proficiency", 0),
            "aiConfidence": skill.get("ai_confidence") or 0,
            "verified": skill.get("verified", False),
            "source": skill.get("source"),
            "lastUpdated": last_updated,
        })

    return grouped


# ─── AI Readiness ─────────────────────────────────────────────

@router.get("/{employee_id}/ai-readiness")
def get_ai_readiness(employee_id: str):
    """Get AI readiness score and breakdown."""
    # TODO: Compute from actual AI usage data in Phase 6
    return {
        "overallScore": 78,
        "breakdown": [
            {"category": "AI Literacy", "score": 85},
            {"category": "Prompt Engineering", "score": 65},
            {"category": "LLM Usage", "score": 90},
            {"category": "Copilot Usage", "score": 95},
            {"category": "Automation Skills", "score": 80},
            {"category": "AI Ethics", "score": 70},
            {"category": "Responsible AI", "score": 75},
            {"category": "Generative AI", "score": 60},
        ],
        "recommendation": {
            "message": "Your prompt engineering score is moderate.",
            "action": "Complete Prompt Engineering Level 2.",
            "impact": "+12 points"
        }
    }


# ─── Twin Memory ───────────────────────────────────────────────

@router.get("/{employee_id}/twin-memory")
def get_twin_memory(employee_id: str):
    """Get twin memory events."""
    # TODO: Compute from actual activity logs in Phase 6
    return [
        {"date": "Today", "event": "AI Reprocessed Knowledge from GitHub (3 new repos)"},
        {"date": "Yesterday", "event": "Project Added: AI Talent Marketplace"},
        {"date": "Last Week", "event": "New Skill Extracted: Prompt Engineering (Level 2)"},
        {"date": "2 Weeks Ago", "event": "Uploaded Knowledge: Alex_Carter_CV_2026.pdf"},
        {"date": "1 Month Ago", "event": "Certificate Verified: AWS Solutions Architect"},
    ]


# ─── Collaboration Intelligence ───────────────────────────────

@router.get("/{employee_id}/collaboration")
def get_collaboration_intel(employee_id: str):
    """Get collaboration intelligence data."""
    # TODO: Compute from actual collaboration data in Phase 6
    return {
        "stats": {
            "availability": "Available (Capacity: 15h/week)",
            "bestCommunication": "Slack (Async)",
            "reputation": "Top 5% in Cloud Architecture",
            "knowledgeConfidence": 94
        },
        "questions": [
            "Can this employee help with Kubernetes?",
            "Has this employee worked on HR Tech domain?",
            "Who should contact this employee for mentorship?"
        ]
    }


# ─── Project Prediction ─────────────────────────────────────────

@router.get("/{employee_id}/project-prediction")
def get_project_prediction(employee_id: str):
    """Get project prediction data."""
    # TODO: Compute using ML model in Phase 6
    return {
        "hypotheticalProject": "Generative AI Knowledge Base for Sales",
        "successProbability": 88,
        "skillMatch": 92,
        "domainMatch": 60,
        "leadershipMatch": 85,
        "riskLevel": "Low",
        "learningCurve": "Medium (Domain context needed)",
        "expectedContribution": "High (Architecture & AI Integration)"
    }


# ─── AI Recommendations ────────────────────────────────────────

@router.get("/{employee_id}/ai-recommendations")
def get_ai_recommendations(employee_id: str):
    """Get AI-powered recommendations."""
    # TODO: Generate using AI model in Phase 6
    return [
        {"id": "r1", "text": "Complete Azure AI certification to boost Domain Match for upcoming projects.", "type": "Certification"},
        {"id": "r2", "text": "Mentor 2 junior engineers in Kubernetes.", "type": "Leadership"},
        {"id": "r3", "text": "Contribute to the 'Internal Identity Platform' repository to increase knowledge freshness.", "type": "Project"},
    ]


# ─── Helpers ──────────────────────────────────────────────────

def _compute_profile_completeness(emp: dict) -> int:
    """Calculate how complete an employee's profile is (0-100)."""
    fields = [
        emp.get("full_name"), emp.get("email"), emp.get("department"),
        emp.get("role"), emp.get("team"), emp.get("location"),
        emp.get("biography"), emp.get("education"), emp.get("languages"),
        emp.get("phone"), emp.get("headline"), emp.get("years_experience"),
    ]
    filled = sum(1 for f in fields if f)
    return int((filled / len(fields)) * 100)

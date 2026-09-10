from __future__ import annotations
"""
Employees router — CRUD for employee profiles, twin summary, skills, knowledge pipeline.
Uses Supabase as the database backend.
"""

import os
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from supabase import Client

from app.database import get_supabase_admin
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    TwinSummaryResponse,
    PeerRecommendationCreate,
    PeerRecommendationResponse,
    PeerRecommendationSummary,
    PEER_REC_CATEGORIES,
)
from app.schemas.skill import SkillCreate, SkillUpdate, SkillResponse
from app.schemas.knowledge import KnowledgeSourceResponse, UploadResponse
from app.services.ai_readiness import analyze_ai_readiness
from app.services.ai_twin_chat import process_chat, ChatMessage
from app.services.personal_analytics import process_analytics, to_dict
from app.config import settings

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
    try:
        from app.services.gamification_engine import fire_gamification_event
        fire_gamification_event(sb, employee_id, "profile_updated")
    except Exception:
        pass
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


@router.get("/{employee_id}/command-center")
def get_command_center(employee_id: str):
    """Live snapshot that unifies career, learning, XP, peers, and next actions."""
    sb = get_supabase_admin()
    from app.services.command_center import build_command_center

    payload = build_command_center(sb, employee_id)
    if payload.get("ok") is False:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=payload.get("detail") or "Employee not found")
    return payload


@router.post("/{employee_id}/daily-checkin")
def post_daily_checkin(employee_id: str):
    """Award daily streak XP once per UTC day."""
    sb = get_supabase_admin()
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    from app.services.command_center import daily_checkin

    return daily_checkin(sb, employee_id)


# ─── Skills CRUD ──────────────────────────────────────────────

@router.get("/{employee_id}/skills")
def get_employee_skills(employee_id: str):
    """Get all skills for an employee from Supabase."""
    sb = get_supabase_admin()
    result = sb.table("skills").select("*").eq("employee_id", employee_id).order("category").order("name").execute()
    return result.data or []


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

    # 🎮 Gamification: award XP + check achievements on skill add
    try:
        from app.services.gamification_engine import fire_gamification_event
        fire_gamification_event(sb, employee_id, "skill_added")
    except Exception as gam_err:
        print(f"[gamification] skill_added event error: {gam_err}")

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


# ─── Projects ───────────────────────────────────────────────

@router.get("/{employee_id}/projects")
def get_projects(employee_id: str, sb: Client = Depends(get_supabase_admin)):
    """Get projects for an employee from Supabase."""
    result = sb.table("projects").select("*").eq("employee_id", employee_id).execute()
    all_projects = result.data or []

    def _map_project(p: dict) -> dict:
        techs = p.get("technologies") or []
        if isinstance(techs, str):
            techs = [t.strip() for t in techs.split(",") if t.strip()]
        status = p.get("status") or "On Track"
        status_map = {
            "in_progress": "On Track",
            "active": "On Track",
            "at_risk": "At Risk",
            "behind": "Behind",
            "completed": "Completed",
        }
        pretty = status_map.get(str(status).lower(), status)
        success = p.get("success_score") if p.get("success_score") is not None else p.get("successScore", 0)
        try:
            success = int(success or 0)
        except (TypeError, ValueError):
            success = 0
        if 0 < success <= 10:
            success *= 10
        return {
            **p,
            "status": pretty,
            "successScore": success,
            "leadershipScore": p.get("leadership_score") or p.get("leadershipScore") or 0,
            "technologies": techs,
            "progress": int(p.get("progress") or 0),
        }

    current = [_map_project(p) for p in all_projects if str(p.get("status", "")).lower() not in ("completed",)]
    completed = [_map_project(p) for p in all_projects if str(p.get("status", "")).lower() in ("completed",)]

    return {
        "current": current,
        "completed": completed
    }


@router.post("/{employee_id}/projects")
def create_project(employee_id: str, project_data: dict, sb: Client = Depends(get_supabase_admin)):
    """Create a new project for an employee in Supabase."""
    try:
        # Check employee exists
        emp = sb.table("employees").select("id").eq("id", employee_id).execute()
        if not emp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        new_project = {
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "name": project_data.get("name", "New Project"),
            "description": project_data.get("description", ""),
            "role": project_data.get("role", "Contributor"),
            "technologies": project_data.get("technologies", []),
            "duration": project_data.get("duration", "Ongoing"),
            "status": project_data.get("status", "On Track"),
            "success_score": project_data.get("successScore", 75),
            "leadership_score": project_data.get("leadershipScore", 70),
            "domain": project_data.get("domain", "General"),
            "progress": project_data.get("progress", 0),
        }

        result = sb.table("projects").insert(new_project).execute()
        return result.data[0]
    except Exception as e:
        print(f"Error creating project: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{employee_id}/projects/{project_id}")
def update_project(employee_id: str, project_id: str, project_data: dict, sb: Client = Depends(get_supabase_admin)):
    """Update a project (e.g., status, progress) in Supabase."""
    # Check project exists and belongs to employee
    existing = sb.table("projects").select("*").eq("id", project_id).eq("employee_id", employee_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = {}
    if "status" in project_data:
        update_data["status"] = project_data["status"]
    if "progress" in project_data:
        update_data["progress"] = project_data["progress"]

    if update_data:
        result = sb.table("projects").update(update_data).eq("id", project_id).execute()
        return result.data[0]

    return existing.data[0]


@router.delete("/{employee_id}/projects/{project_id}")
def delete_project(employee_id: str, project_id: str, sb: Client = Depends(get_supabase_admin)):
    """Delete a project from Supabase."""
    # Check project exists and belongs to employee
    existing = sb.table("projects").select("*").eq("id", project_id).eq("employee_id", employee_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    sb.table("projects").delete().eq("id", project_id).execute()
    return {"message": "Project deleted successfully"}


# ─── Tasks ───────────────────────────────────────────────────────

@router.get("/{employee_id}/projects/{project_id}/tasks")
def get_tasks(employee_id: str, project_id: str, sb: Client = Depends(get_supabase_admin)):
    """Get all tasks for a project."""
    result = sb.table("tasks").select("*").eq("project_id", project_id).execute()
    return result.data or []


@router.post("/{employee_id}/projects/{project_id}/tasks")
def create_task(employee_id: str, project_id: str, task_data: dict, sb: Client = Depends(get_supabase_admin)):
    """Create a new task for a project."""
    try:
        # Check project exists and belongs to employee
        project = sb.table("projects").select("*").eq("id", project_id).eq("employee_id", employee_id).execute()
        if not project.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        new_task = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "employee_id": employee_id,
            "title": task_data.get("title", "New Task"),
            "description": task_data.get("description", ""),
            "status": task_data.get("status", "Pending"),
            "priority": task_data.get("priority", "Medium"),
            "due_date": task_data.get("due_date"),
        }

        result = sb.table("tasks").insert(new_task).execute()

        # Recalculate project progress based on tasks
        all_tasks = sb.table("tasks").select("*").eq("project_id", project_id).execute()
        tasks = all_tasks.data or []
        if tasks:
            completed_count = sum(1 for t in tasks if t.get("status") in ["Completed", "completed"])
            progress = int((completed_count / len(tasks)) * 100)
            sb.table("projects").update({"progress": progress}).eq("id", project_id).execute()

        return result.data[0]
    except Exception as e:
        print(f"Error creating task: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{employee_id}/projects/{project_id}/tasks/{task_id}")
def update_task(employee_id: str, project_id: str, task_id: str, task_data: dict, sb: Client = Depends(get_supabase_admin)):
    """Update a task (e.g., status)."""
    # Check task exists and belongs to project
    existing = sb.table("tasks").select("*").eq("id", task_id).eq("project_id", project_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = {}
    if "status" in task_data:
        update_data["status"] = task_data["status"]
    if "title" in task_data:
        update_data["title"] = task_data["title"]
    if "description" in task_data:
        update_data["description"] = task_data["description"]
    if "priority" in task_data:
        update_data["priority"] = task_data["priority"]
    if "due_date" in task_data:
        update_data["due_date"] = task_data["due_date"]

    if update_data:
        result = sb.table("tasks").update(update_data).eq("id", task_id).execute()

        # Recalculate project progress based on tasks
        all_tasks = sb.table("tasks").select("*").eq("project_id", project_id).execute()
        tasks = all_tasks.data or []
        if tasks:
            completed_count = sum(1 for t in tasks if t.get("status") in ["Completed", "completed"])
            progress = int((completed_count / len(tasks)) * 100)
            sb.table("projects").update({"progress": progress}).eq("id", project_id).execute()

        return result.data[0]

    return existing.data[0]


@router.delete("/{employee_id}/projects/{project_id}/tasks/{task_id}")
def delete_task(employee_id: str, project_id: str, task_id: str, sb: Client = Depends(get_supabase_admin)):
    """Delete a task."""
    # Check task exists and belongs to project
    existing = sb.table("tasks").select("*").eq("id", task_id).eq("project_id", project_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    sb.table("tasks").delete().eq("id", task_id).execute()

    # Recalculate project progress based on tasks
    all_tasks = sb.table("tasks").select("*").eq("project_id", project_id).execute()
    tasks = all_tasks.data or []
    if tasks:
        completed_count = sum(1 for t in tasks if t.get("status") in ["Completed", "completed"])
        progress = int((completed_count / len(tasks)) * 100)
        sb.table("projects").update({"progress": progress}).eq("id", project_id).execute()
    else:
        sb.table("projects").update({"progress": 0}).eq("id", project_id).execute()

    return {"message": "Task deleted successfully"}


# ─── AI Readiness ───────────────────────────────────────────────

@router.get("/{employee_id}/ai-readiness")
def get_ai_readiness(employee_id: str, sb: Client = Depends(get_supabase_admin)):
    """Get AI readiness score and analysis for an employee."""
    # Check employee exists
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Analyze AI readiness
    result = analyze_ai_readiness(employee_id, sb)

    return {
        "overallScore": result.overall_score,
        "breakdown": [
            {
                "category": dim.category,
                "score": dim.score,
            }
            for dim in result.breakdown
        ],
        "recommendation": {
            "action": result.recommendation.action,
            "message": result.recommendation.message,
            "impact": result.recommendation.impact,
        },
        "analysisSummary": result.analysis_summary,
    }


@router.post("/{employee_id}/ai-chat")
def ai_chat(employee_id: str, message_data: dict, sb: Client = Depends(get_supabase_admin)):
    """Process a chat message with the AI Twin Assistant using RAG."""
    # Check employee exists
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Get message and conversation history
    message = message_data.get("message", "")
    conversation_history = message_data.get("history", [])

    # Convert history to ChatMessage objects
    chat_history = [
        ChatMessage(role=msg.get("role"), content=msg.get("content"))
        for msg in conversation_history
    ]

    # Process chat
    result = process_chat(employee_id, message, chat_history, sb)

    return {
        "response": result.response,
        "sources": result.sources_used,
    }


@router.get("/{employee_id}/personal-analytics")
def get_personal_analytics(employee_id: str, sb: Client = Depends(get_supabase_admin)):
    """Get AI-powered personal analytics for an employee."""
    # Check employee exists
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Process analytics
    result = process_analytics(employee_id, sb)

    return to_dict(result)


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

    # 🎮 Gamification: award XP for document upload
    try:
        from app.services.gamification_engine import fire_gamification_event
        fire_gamification_event(sb, employee_id, "document_uploaded")
    except Exception as gam_err:
        print(f"[gamification] document_uploaded event error: {gam_err}")

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

_PEER_TYPE = "peer_recommendation"


@router.get("/{employee_id}/recognitions")
def get_recognitions(employee_id: str):
    """Get award-style recognitions for an employee (excludes peer recommendations)."""
    sb = get_supabase_admin()
    result = (
        sb.table("recognitions")
        .select("*")
        .eq("employee_id", employee_id)
        .neq("type", _PEER_TYPE)
        .order("date", desc=True)
        .execute()
    )
    return result.data


# ─── Peer recommendations (any employee → any other) ───────────
# Stored in `recognitions` with type=peer_recommendation so it works without a new
# table. Optional upgrade: run migrations/peer_recommendations.sql and set
# PEER_REC_USE_DEDICATED_TABLE=1.

_EMP_FIELDS = "id, full_name, role, initials, department"


def _use_dedicated_peer_table() -> bool:
    return os.getenv("PEER_REC_USE_DEDICATED_TABLE", "").strip() in ("1", "true", "yes")


def _parse_peer_title(title: str) -> tuple[str, str | None]:
    """title format: 'category' or 'category · skill'."""
    if not title:
        return "general", None
    if " · " in title:
        cat, skill = title.split(" · ", 1)
        return (cat.strip().lower() or "general"), (skill.strip() or None)
    return title.strip().lower() or "general", None


def _parse_peer_description(description: str) -> tuple[str, int | None]:
    """description may end with '\\n\\n__rating__:N'."""
    text = description or ""
    rating = None
    marker = "\n\n__rating__:"
    if marker in text:
        body, _, tail = text.rpartition(marker)
        try:
            rating = int(tail.strip())
        except ValueError:
            body = text
        text = body
    return text.strip(), rating


def _employee_map(sb: Client, ids: set[str]) -> dict[str, dict]:
    clean = [i for i in ids if i]
    if not clean:
        return {}
    result = sb.table("employees").select(_EMP_FIELDS).in_("id", clean).execute()
    return {e["id"]: e for e in (result.data or [])}


def _row_from_dedicated(row: dict, emp_map: dict[str, dict]) -> dict:
    giver = emp_map.get(row.get("from_employee_id") or "", {})
    receiver = emp_map.get(row.get("to_employee_id") or "", {})
    return {
        **row,
        "from_employee_name": giver.get("full_name"),
        "from_employee_role": giver.get("role"),
        "from_employee_initials": giver.get("initials"),
        "from_employee_department": giver.get("department"),
        "to_employee_name": receiver.get("full_name"),
        "to_employee_role": receiver.get("role"),
        "to_employee_initials": receiver.get("initials"),
        "to_employee_department": receiver.get("department"),
    }


def _row_from_recognition(row: dict, emp_map: dict[str, dict]) -> dict:
    category, skill = _parse_peer_title(row.get("title") or "")
    message, rating = _parse_peer_description(row.get("description") or "")
    from_id = row.get("awarded_by") or ""
    to_id = row.get("employee_id") or ""
    giver = emp_map.get(from_id, {})
    receiver = emp_map.get(to_id, {})
    # Legacy rows may store a name in awarded_by instead of an id
    from_name = giver.get("full_name") or (from_id if from_id and from_id not in emp_map else None)
    return {
        "id": row.get("id"),
        "from_employee_id": from_id if from_id in emp_map else from_id,
        "to_employee_id": to_id,
        "category": category,
        "skill": skill,
        "message": message,
        "rating": rating if rating is not None else 5,
        "created_at": row.get("created_at") or row.get("date"),
        "from_employee_name": from_name,
        "from_employee_role": giver.get("role"),
        "from_employee_initials": giver.get("initials"),
        "from_employee_department": giver.get("department"),
        "to_employee_name": receiver.get("full_name"),
        "to_employee_role": receiver.get("role"),
        "to_employee_initials": receiver.get("initials"),
        "to_employee_department": receiver.get("department"),
    }


def _load_peer_received(sb: Client, employee_id: str) -> list[dict]:
    if _use_dedicated_peer_table():
        result = (
            sb.table("peer_recommendations")
            .select("*")
            .eq("to_employee_id", employee_id)
            .order("created_at", desc=True)
            .execute()
        )
        rows = result.data or []
        ids = {r.get("from_employee_id") for r in rows} | {r.get("to_employee_id") for r in rows} | {employee_id}
        emp_map = _employee_map(sb, {i for i in ids if i})
        return [_row_from_dedicated(r, emp_map) for r in rows]

    result = (
        sb.table("recognitions")
        .select("*")
        .eq("employee_id", employee_id)
        .eq("type", _PEER_TYPE)
        .order("created_at", desc=True)
        .execute()
    )
    rows = result.data or []
    ids = {r.get("awarded_by") for r in rows} | {employee_id}
    emp_map = _employee_map(sb, {i for i in ids if i})
    return [_row_from_recognition(r, emp_map) for r in rows]


def _load_peer_sent(sb: Client, employee_id: str) -> list[dict]:
    if _use_dedicated_peer_table():
        result = (
            sb.table("peer_recommendations")
            .select("*")
            .eq("from_employee_id", employee_id)
            .order("created_at", desc=True)
            .execute()
        )
        rows = result.data or []
        ids = {r.get("from_employee_id") for r in rows} | {r.get("to_employee_id") for r in rows} | {employee_id}
        emp_map = _employee_map(sb, {i for i in ids if i})
        return [_row_from_dedicated(r, emp_map) for r in rows]

    result = (
        sb.table("recognitions")
        .select("*")
        .eq("awarded_by", employee_id)
        .eq("type", _PEER_TYPE)
        .order("created_at", desc=True)
        .execute()
    )
    rows = result.data or []
    ids = {r.get("employee_id") for r in rows} | {employee_id}
    emp_map = _employee_map(sb, {i for i in ids if i})
    return [_row_from_recognition(r, emp_map) for r in rows]


@router.get("/{employee_id}/peer-recommendations", response_model=list[PeerRecommendationResponse])
def get_peer_recommendations_received(employee_id: str):
    """Recommendations this employee has received from colleagues."""
    sb = get_supabase_admin()
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return _load_peer_received(sb, employee_id)


@router.get("/{employee_id}/peer-recommendations/sent", response_model=list[PeerRecommendationResponse])
def get_peer_recommendations_sent(employee_id: str):
    """Recommendations this employee has written for others."""
    sb = get_supabase_admin()
    emp = sb.table("employees").select("id").eq("id", employee_id).execute()
    if not emp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return _load_peer_sent(sb, employee_id)


@router.get("/{employee_id}/peer-recommendations/summary", response_model=PeerRecommendationSummary)
def get_peer_recommendations_summary(employee_id: str):
    """Counts and highlight categories for the dashboard header."""
    sb = get_supabase_admin()
    rows = _load_peer_received(sb, employee_id)
    given = _load_peer_sent(sb, employee_id)
    ratings = [r["rating"] for r in rows if isinstance(r.get("rating"), (int, float))]
    cat_counts: dict[str, int] = {}
    for r in rows:
        cat = (r.get("category") or "general").lower()
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    top = sorted(cat_counts.keys(), key=lambda c: cat_counts[c], reverse=True)[:3]
    return PeerRecommendationSummary(
        received_count=len(rows),
        given_count=len(given),
        average_rating=(sum(ratings) / len(ratings)) if ratings else None,
        top_categories=top,
    )


@router.post(
    "/{employee_id}/peer-recommendations",
    response_model=PeerRecommendationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_peer_recommendation(employee_id: str, data: PeerRecommendationCreate):
    """
    Give a recommendation to another employee.
    Path employee_id = giver. Body.to_employee_id = receiver.
    """
    sb = get_supabase_admin()
    message = (data.message or "").strip()
    if len(message) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recommendation message must be at least 10 characters.",
        )
    if data.to_employee_id == employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot recommend yourself.",
        )

    category = (data.category or "general").strip().lower()
    if category not in PEER_REC_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Choose one of: {', '.join(PEER_REC_CATEGORIES)}",
        )

    rating = data.rating if data.rating is not None else 5
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating must be 1–5.")

    people = sb.table("employees").select("id").in_("id", [employee_id, data.to_employee_id]).execute()
    found = {e["id"] for e in (people.data or [])}
    if employee_id not in found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giver employee not found")
    if data.to_employee_id not in found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient employee not found")

    from datetime import datetime, timezone, timedelta

    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    if _use_dedicated_peer_table():
        recent = (
            sb.table("peer_recommendations")
            .select("id")
            .eq("from_employee_id", employee_id)
            .eq("to_employee_id", data.to_employee_id)
            .gte("created_at", since)
            .limit(1)
            .execute()
        )
    else:
        recent = (
            sb.table("recognitions")
            .select("id")
            .eq("awarded_by", employee_id)
            .eq("employee_id", data.to_employee_id)
            .eq("type", _PEER_TYPE)
            .gte("created_at", since)
            .limit(1)
            .execute()
        )
    if recent.data:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You already recommended this colleague today. Try again tomorrow.",
        )

    skill = (data.skill or "").strip() or None
    rec_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    if _use_dedicated_peer_table():
        payload = {
            "id": rec_id,
            "from_employee_id": employee_id,
            "to_employee_id": data.to_employee_id,
            "category": category,
            "skill": skill,
            "message": message,
            "rating": rating,
        }
        inserted = sb.table("peer_recommendations").insert(payload).execute()
        row = (inserted.data or [payload])[0]
        emp_map = _employee_map(sb, {employee_id, data.to_employee_id})
        enriched = _row_from_dedicated(row, emp_map)
    else:
        title = category if not skill else f"{category} · {skill}"
        description = f"{message}\n\n__rating__:{rating}"
        payload = {
            "id": rec_id,
            "employee_id": data.to_employee_id,
            "type": _PEER_TYPE,
            "title": title,
            "description": description,
            "date": now.date().isoformat(),
            "awarded_by": employee_id,
        }
        inserted = sb.table("recognitions").insert(payload).execute()
        row = (inserted.data or [payload])[0]
        emp_map = _employee_map(sb, {employee_id, data.to_employee_id})
        enriched = _row_from_recognition(row, emp_map)

    xp_awarded = 0
    try:
        from app.services.gamification_engine import award_xp

        award_xp(
            sb,
            employee_id,
            25,
            f"Gave a peer recommendation to {enriched.get('to_employee_name') or 'a colleague'}",
            "recognition",
            "👏",
        )
        award_xp(
            sb,
            data.to_employee_id,
            40,
            f"Received a peer recommendation from {enriched.get('from_employee_name') or 'a colleague'}",
            "recognition",
            "🌟",
        )
        xp_awarded = 40
    except Exception as xp_err:
        print(f"[peer_recommendations] XP award skipped: {xp_err}")

    enriched["xp_awarded"] = xp_awarded
    return enriched


@router.delete(
    "/{employee_id}/peer-recommendations/{recommendation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_peer_recommendation(employee_id: str, recommendation_id: str):
    """Giver can withdraw their own recommendation."""
    sb = get_supabase_admin()
    if _use_dedicated_peer_table():
        existing = (
            sb.table("peer_recommendations")
            .select("id, from_employee_id")
            .eq("id", recommendation_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
        if existing.data[0]["from_employee_id"] != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the author can withdraw this recommendation.",
            )
        sb.table("peer_recommendations").delete().eq("id", recommendation_id).execute()
    else:
        existing = (
            sb.table("recognitions")
            .select("id, awarded_by, type")
            .eq("id", recommendation_id)
            .execute()
        )
        if not existing.data or existing.data[0].get("type") != _PEER_TYPE:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
        if existing.data[0].get("awarded_by") != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the author can withdraw this recommendation.",
            )
        sb.table("recognitions").delete().eq("id", recommendation_id).execute()
    return None


# ─── Certifications ──────────────────────────────────────────

@router.get("/{employee_id}/certifications")
def get_certifications(employee_id: str, sb: Client = Depends(get_supabase_admin)):
    """Get certifications for an employee from Supabase."""
    result = sb.table("certifications").select("*").eq("employee_id", employee_id).execute()
    return result.data or []


# ─── Personal Analytics (chart series for the dashboard) ───────

@router.get("/{employee_id}/analytics")
def get_personal_analytics_charts(employee_id: str):
    """Productivity and skill growth series derived from XP + skills — not static mock data."""
    sb = get_supabase_admin()
    from datetime import datetime, timezone, timedelta

    since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    tx = sb.table("xp_transactions").select("amount, created_at").eq(
        "employee_id", employee_id
    ).gte("created_at", since).execute()

    by_day: dict[str, int] = {}
    for row in tx.data or []:
        created = row.get("created_at") or ""
        day = created[:10]
        if day:
            by_day[day] = by_day.get(day, 0) + max(0, int(row.get("amount") or 0))

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    productivity = []
    today = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        xp = by_day.get(key, 0)
        score = min(100, 55 + min(45, xp // 8))
        productivity.append({"day": days[d.weekday()], "score": score})

    skills = sb.table("skills").select("name, proficiency, category").eq("employee_id", employee_id).execute()
    grouped: dict[str, list[int]] = {}
    for s in skills.data or []:
        cat = (s.get("category") or "general").split()[0].lower()[:12]
        prof = int(s.get("proficiency") or 0)
        if prof <= 10:
            prof *= 10
        grouped.setdefault(cat, []).append(prof)

    top_cats = sorted(grouped.items(), key=lambda kv: -sum(kv[1]) / max(1, len(kv[1])))[:3]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    skill_growth = []
    for idx, month in enumerate(months):
        point = {"month": month}
        for cat, vals in top_cats:
            avg = sum(vals) / max(1, len(vals))
            # Gentle ramp toward current proficiency
            point[cat] = int(max(20, avg - (5 - idx) * 4))
        skill_growth.append(point)

    return {"productivity": productivity, "skillGrowth": skill_growth}


# ─── Twin Memory ───────────────────────────────────────────────

@router.get("/{employee_id}/twin-memory")
def get_twin_memory(employee_id: str):
    """Activity memory from knowledge, projects, skills, and XP events."""
    sb = get_supabase_admin()
    events = []

    sources = sb.table("knowledge_sources").select("name, created_at, type").eq(
        "employee_id", employee_id
    ).order("created_at", desc=True).limit(5).execute()
    for s in sources.data or []:
        events.append({"date": (s.get("created_at") or "")[:10] or "Recently", "event": f"Knowledge synced: {s.get('name')}"})

    projects = sb.table("projects").select("name, status, created_at").eq(
        "employee_id", employee_id
    ).order("created_at", desc=True).limit(4).execute()
    for p in projects.data or []:
        events.append({"date": (p.get("created_at") or "")[:10] or "Recently", "event": f"Project {p.get('status', 'updated')}: {p.get('name')}"})

    xp = sb.table("xp_transactions").select("reason, created_at").eq(
        "employee_id", employee_id
    ).order("created_at", desc=True).limit(5).execute()
    for t in xp.data or []:
        events.append({"date": (t.get("created_at") or "")[:10] or "Recently", "event": t.get("reason") or "XP awarded"})

    events.sort(key=lambda e: e["date"], reverse=True)
    return events[:10] or [{"date": "Today", "event": "Digital twin initialized. Add skills, projects, or documents to grow memory."}]


# ─── Collaboration Intelligence ───────────────────────────────

@router.get("/{employee_id}/collaboration")
def get_collaboration_intel(employee_id: str):
    """Collaboration snapshot from profile, projects, and knowledge sources."""
    sb = get_supabase_admin()
    emp = sb.table("employees").select("*").eq("id", employee_id).execute()
    employee = emp.data[0] if emp.data else {}
    projects = sb.table("projects").select("id, name, status").eq("employee_id", employee_id).execute().data or []
    sources = sb.table("knowledge_sources").select("id").eq("employee_id", employee_id).execute().data or []
    skills = sb.table("skills").select("name, proficiency").eq("employee_id", employee_id).execute().data or []
    top = sorted(skills, key=lambda s: s.get("proficiency") or 0, reverse=True)[:3]
    top_names = ", ".join(s.get("name") for s in top) or employee.get("role") or "your domain"

    active = [p for p in projects if str(p.get("status", "")).lower() in ("active", "in_progress", "in progress")]
    peers = 0
    try:
        peers = (
            sb.table("recognitions")
            .select("id", count="exact")
            .eq("employee_id", employee_id)
            .eq("type", "peer_recommendation")
            .execute()
            .count
            or 0
        )
    except Exception:
        peers = 0
    return {
        "stats": {
            "availability": f"{employee.get('employment_status') or 'Active'} · {len(active)} live projects",
            "bestCommunication": employee.get("location") or "Async (Digital Twin)",
            "reputation": f"Known for {top_names}" + (f" · {peers} peer recs" if peers else ""),
            "knowledgeConfidence": min(99, 60 + len(sources) * 6 + len(skills) + peers * 2),
        },
        "questions": [
            f"Can this employee help with {top[0]['name']}?" if top else "What are this employee's strongest skills?",
            f"Has this employee shipped {len(projects)} projects in {employee.get('department') or 'the org'}?",
            "Who should contact this employee for mentorship?",
        ],
    }


# ─── Project Prediction ─────────────────────────────────────────

@router.get("/{employee_id}/project-prediction")
def get_project_prediction(employee_id: str):
    """Heuristic success prediction from skill/project coverage."""
    sb = get_supabase_admin()
    skills = sb.table("skills").select("proficiency, name").eq("employee_id", employee_id).execute().data or []
    projects = sb.table("projects").select("status, name, progress").eq("employee_id", employee_id).execute().data or []
    completed = [p for p in projects if str(p.get("status", "")).lower() == "completed"]
    avg_prof = 0
    if skills:
        vals = []
        for s in skills:
            p = int(s.get("proficiency") or 0)
            vals.append(p * 10 if p <= 10 else p)
        avg_prof = sum(vals) / len(vals)

    skill_match = int(min(100, avg_prof or 40))
    domain_match = int(min(100, 50 + len(completed) * 8))
    leadership = int(min(100, 45 + len(projects) * 6))
    success = int(round((skill_match * 0.45 + domain_match * 0.3 + leadership * 0.25)))
    risk = "Low" if success >= 75 else "Medium" if success >= 55 else "High"
    flagship = next((p.get("name") for p in projects if p.get("name")), "Upcoming strategic initiative")

    return {
        "hypotheticalProject": flagship,
        "successProbability": success,
        "skillMatch": skill_match,
        "domainMatch": domain_match,
        "leadershipMatch": leadership,
        "riskLevel": risk,
        "learningCurve": "Low" if skill_match >= 80 else "Medium (targeted upskilling needed)",
        "expectedContribution": "High" if success >= 70 else "Moderate",
    }


# ─── AI Recommendations ────────────────────────────────────────

@router.get("/{employee_id}/ai-recommendations")
def get_ai_recommendations(employee_id: str):
    """Actionable twin recommendations with deep-links into employee hubs."""
    sb = get_supabase_admin()
    from app.services.command_center import build_command_center

    try:
        cc = build_command_center(sb, employee_id)
    except Exception:
        cc = {}

    recs = []
    for item in (cc.get("weekly_focus") or [])[:4]:
        recs.append({
            "id": f"focus-{item.get('id')}",
            "text": item.get("title") or "Next twin action",
            "detail": item.get("detail") or "",
            "type": (item.get("hub") or "Twin").replace("dashboard", "Profile").title(),
            "href": item.get("href") or "/employee-twin",
            "cta": item.get("cta") or "Open",
            "priority": item.get("priority") or "medium",
        })

    career = cc.get("career") or {}
    if career.get("has_goal") and career.get("target_role") and not any(r.get("type") == "Career" for r in recs):
        recs.append({
            "id": "r-goal",
            "text": f"Continue readiness path toward {career['target_role']}",
            "detail": career.get("next_action", {}).get("description") if career.get("next_action") else "",
            "type": "Career",
            "href": "/career-coach",
            "cta": "Open Career Coach",
            "priority": "high",
        })

    learning = cc.get("learning") or {}
    if learning.get("active_path") and not any(r.get("href") == "/learning-hub" for r in recs):
        path = learning["active_path"]
        recs.append({
            "id": "r-learn",
            "text": f"Advance learning path: {path.get('title')}",
            "detail": f"{path.get('progress') or 0}% complete",
            "type": "Learning",
            "href": "/learning-hub",
            "cta": "Continue learning",
            "priority": "medium",
        })

    social = cc.get("social") or {}
    if int(social.get("received") or 0) == 0:
        recs.append({
            "id": "r-peer",
            "text": "Give a peer recommendation to strengthen both twins",
            "detail": "Peer recognition awards XP and builds reputation.",
            "type": "Peers",
            "href": "/employee-twin?tab=peers",
            "cta": "Open Peers",
            "priority": "low",
        })

    skills = sb.table("skills").select("name, proficiency, target_level").eq("employee_id", employee_id).execute().data or []
    for s in skills:
        target = s.get("target_level") or 0
        current = s.get("proficiency") or 0
        if target > current:
            recs.append({
                "id": f"r-skill-{s.get('name')}",
                "text": f"Close the {s.get('name')} gap ({current} → {target})",
                "detail": "Learning Hub can generate a path for this gap.",
                "type": "Skill",
                "href": "/learning-hub",
                "cta": "Open Learning Hub",
                "priority": "high",
            })
            break

    projects = sb.table("projects").select("name, progress, status").eq("employee_id", employee_id).execute().data or []
    for p in projects:
        if str(p.get("status", "")).lower() not in ("completed",) and int(p.get("progress") or 0) < 100:
            recs.append({
                "id": f"r-proj-{p.get('name')}",
                "text": f"Advance '{p.get('name')}' ({p.get('progress') or 0}%)",
                "detail": "Delivery proof strengthens Career Coach readiness.",
                "type": "Project",
                "href": "/employee-twin?tab=projects",
                "cta": "Open projects",
                "priority": "medium",
            })
            break

    # Deduplicate by text
    seen = set()
    out = []
    for r in recs:
        key = (r.get("text") or "").strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(r)
        if len(out) >= 6:
            break

    if not out:
        out = [{
            "id": "r1",
            "text": "Add skills and a career goal so the twin can produce targeted recommendations.",
            "detail": "Start in Career Coach, then generate a Learning path.",
            "type": "Profile",
            "href": "/career-coach",
            "cta": "Set a goal",
            "priority": "critical",
        }]
    return out


# ─── Skills Data (Grouped by Category) ───────────────────────

@router.get("/{employee_id}/skills-grouped")
def get_skills_grouped(employee_id: str, sb: Client = Depends(get_supabase_admin)):
    """Get skills grouped by category for the dashboard from Supabase."""
    from app.services.knowledge.skill_normalizer import normalize_skill

    result = sb.table("skills").select("*").eq("employee_id", employee_id).execute()
    all_skills = result.data or []

    grouped = {}
    for skill in all_skills:
        category = skill.get("category") or "General"
        if category not in grouped:
            grouped[category] = []

        normalized = normalize_skill(skill.get("name", ""))
        prof = skill.get("proficiency") or 0
        try:
            prof = int(prof)
        except (TypeError, ValueError):
            prof = 0
        if 0 < prof <= 10:
            prof *= 10
        grouped[category].append({
            "id": skill.get("id"),
            "name": normalized.canonical_name,
            "category": category,
            "sub_category": skill.get("sub_category"),
            "experience": skill.get("years_experience", 0),
            "proficiency": max(0, min(100, prof)),
            "aiConfidence": skill.get("ai_confidence", 0),
            "verified": skill.get("verified", False),
            "source": skill.get("source", "Unknown"),
            "lastUpdated": skill.get("last_updated", "Unknown"),
        })

    return grouped


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

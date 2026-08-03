"""
Employees router — CRUD for employee profiles, twin summary, skills.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_db
from app.models.employee import Employee
from app.models.skill import Skill
from app.models.knowledge import KnowledgeSource
from app.models.project import Project
from app.models.recognition import Recognition
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    TwinSummaryResponse,
)
from app.schemas.skill import SkillCreate, SkillUpdate, SkillResponse

router = APIRouter(prefix="/api/employees", tags=["Employees"])


# ─── Employee CRUD ────────────────────────────────────────────

@router.get("", response_model=EmployeeListResponse)
def list_employees(
    skip: int = 0,
    limit: int = 50,
    department: str | None = None,
    db: Session = Depends(get_db),
):
    """List all employees with optional department filter."""
    query = select(Employee)
    if department:
        query = query.where(Employee.department == department)

    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar_one()

    result = db.execute(query.offset(skip).limit(limit).order_by(Employee.full_name))
    employees = result.scalars().all()

    return EmployeeListResponse(employees=employees, total=total)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    """Get a single employee by ID."""
    result = db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee (admin use — separate from register)."""
    from app.utils.auth import hash_password
    from app.models.gamification import GamificationProfile

    employee = Employee(
        employee_code=data.employee_code,
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password) if data.password else None,
        initials=data.initials or "".join(w[0].upper() for w in data.full_name.split()[:2]),
        department=data.department,
        role=data.role,
        team=data.team,
        manager_name=data.manager_name,
        location=data.location,
        timezone_str=data.timezone_str,
        phone=data.phone,
        education=data.education,
        languages=data.languages,
        biography=data.biography,
        headline=data.headline,
        avatar_url=data.avatar_url,
        years_experience=data.years_experience,
        years_in_company=data.years_in_company,
        employment_type=data.employment_type,
        employment_status=data.employment_status or "Active",
    )
    db.add(employee)
    db.flush()

    # Auto-create gamification profile
    gam = GamificationProfile(employee_id=employee.id)
    db.add(gam)

    return employee


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str, data: EmployeeUpdate, db: Session = Depends(get_db)
):
    """Partially update an employee profile."""
    result = db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    employee.profile_completeness = _compute_profile_completeness(employee)
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, db: Session = Depends(get_db)):
    """Delete an employee and all related data (cascades)."""
    result = db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    db.delete(employee)


# ─── Twin Summary ─────────────────────────────────────────────

@router.get("/{employee_id}/twin-summary", response_model=TwinSummaryResponse)
def get_twin_summary(employee_id: str, db: Session = Depends(get_db)):
    """Get AI twin health metrics for an employee."""
    result = db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    ks_count = db.execute(
        select(func.count()).where(KnowledgeSource.employee_id == employee_id)
    ).scalar_one()

    freshness = "High" if ks_count >= 3 else "Medium" if ks_count >= 1 else "Low"
    completeness = _compute_profile_completeness(employee)
    health = min(100, int(completeness * 0.4 + employee.ai_confidence * 0.3 + (ks_count * 10) * 0.3))

    return TwinSummaryResponse(
        ai_confidence=employee.ai_confidence,
        profile_completeness=completeness,
        knowledge_freshness=freshness,
        twin_health=health,
        representation_quality="Excellent" if health >= 80 else "Good" if health >= 60 else "Needs Data",
        summary_text=f"Digital twin for {employee.full_name}, {employee.role or 'Employee'} "
                     f"in {employee.department or 'Unknown'}. "
                     f"Profile is {completeness}% complete with {ks_count} knowledge sources connected.",
    )


# ─── Skills CRUD ──────────────────────────────────────────────

@router.get("/{employee_id}/skills", response_model=list[SkillResponse])
def get_employee_skills(employee_id: str, db: Session = Depends(get_db)):
    """Get all skills for an employee."""
    result = db.execute(
        select(Skill).where(Skill.employee_id == employee_id).order_by(Skill.category, Skill.name)
    )
    return result.scalars().all()


@router.post("/{employee_id}/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def add_skill(employee_id: str, data: SkillCreate, db: Session = Depends(get_db)):
    """Add a new skill to an employee."""
    emp = db.execute(select(Employee).where(Employee.id == employee_id))
    if not emp.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    existing = db.execute(
        select(Skill).where(Skill.employee_id == employee_id, Skill.name == data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Skill already exists")

    skill = Skill(employee_id=employee_id, **data.model_dump())
    db.add(skill)
    db.flush()
    return skill


@router.put("/{employee_id}/skills/{skill_id}", response_model=SkillResponse)
def update_skill(
    employee_id: str, skill_id: str, data: SkillUpdate, db: Session = Depends(get_db)
):
    """Update a skill's proficiency, trend, etc."""
    result = db.execute(
        select(Skill).where(Skill.id == skill_id, Skill.employee_id == employee_id)
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skill, field, value)
    return skill


@router.delete("/{employee_id}/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(employee_id: str, skill_id: str, db: Session = Depends(get_db)):
    """Remove a skill from an employee."""
    result = db.execute(
        select(Skill).where(Skill.id == skill_id, Skill.employee_id == employee_id)
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    db.delete(skill)


# ─── Projects ─────────────────────────────────────────────────

@router.get("/{employee_id}/projects")
def get_employee_projects(employee_id: str, db: Session = Depends(get_db)):
    """Get all projects for an employee."""
    result = db.execute(
        select(Project).where(Project.employee_id == employee_id).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    current = [p for p in projects if p.status != "Completed"]
    completed = [p for p in projects if p.status == "Completed"]
    return {"current": current, "completed": completed}


# ─── Knowledge Sources ────────────────────────────────────────

@router.get("/{employee_id}/knowledge-sources")
def get_knowledge_sources(employee_id: str, db: Session = Depends(get_db)):
    """Get all knowledge sources for an employee."""
    result = db.execute(
        select(KnowledgeSource).where(KnowledgeSource.employee_id == employee_id)
            .order_by(KnowledgeSource.last_synced.desc())
    )
    return result.scalars().all()


# ─── Recognitions ─────────────────────────────────────────────

@router.get("/{employee_id}/recognitions")
def get_recognitions(employee_id: str, db: Session = Depends(get_db)):
    """Get all recognitions for an employee."""
    result = db.execute(
        select(Recognition).where(Recognition.employee_id == employee_id)
            .order_by(Recognition.date.desc())
    )
    return result.scalars().all()


# ─── Helpers ──────────────────────────────────────────────────

def _compute_profile_completeness(emp: Employee) -> int:
    """Calculate how complete an employee's profile is (0-100)."""
    fields = [
        emp.full_name, emp.email, emp.department, emp.role, emp.team,
        emp.location, emp.biography, emp.education, emp.languages,
        emp.phone, emp.headline, emp.years_experience,
    ]
    filled = sum(1 for f in fields if f)
    return int((filled / len(fields)) * 100)

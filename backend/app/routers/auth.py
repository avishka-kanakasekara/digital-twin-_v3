from __future__ import annotations
"""
Auth router — register, login, me.
Operational data is stored in Microsoft Fabric SQL Database.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.employee import EmployeeResponse
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_employee,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _clean(value: str | None, limit: int) -> str:
    return " ".join((value or "").split())[:limit]


def _email(value: str) -> str:
    email = (value or "").strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@") or " " in email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter a valid email address.")
    return email


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    """Register a new employee and return a JWT token."""
    sb = get_db()
    email = _email(req.email)
    full_name = _clean(req.full_name, 120)
    if len(full_name) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter your full name.")
    password = req.password or ""
    if len(password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters.")
    if len(password) > 72:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be 72 characters or fewer.")

    existing = sb.table("employees").select("id").eq("email", email).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    employee_code = _clean(req.employee_code, 40) or f"EMP-{uuid.uuid4().hex[:8].upper()}"
    existing_code = sb.table("employees").select("id").eq("employee_code", employee_code).execute()
    if existing_code.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee code already exists")

    employee_id = str(uuid.uuid4())
    initials = "".join(word[0].upper() for word in full_name.split()[:2]) or "U"
    department = _clean(req.department, 80) or None
    role = _clean(req.role, 80) or None

    emp_data = {
        "id": employee_id,
        "employee_code": employee_code,
        "full_name": full_name,
        "email": email,
        "password_hash": hash_password(password),
        "initials": initials,
        "department": department,
        "role": role,
        "access_role": "admin" if any(k in (role or "").lower() or k in (department or "").lower() for k in ("admin", "hr", "employer", "manager", "director")) else "employee",
        "employment_status": "Active",
    }
    with sb.transaction():
        sb.table("employees").insert(emp_data).execute()
        sb.table("gamification_profiles").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
        }).execute()
        sb.table("user_identities").insert({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "provider": "local",
            "subject": employee_id,
            "email": email,
        }).execute()

    token = create_access_token({"sub": employee_id})
    return TokenResponse(
        access_token=token,
        employee_id=employee_id,
        full_name=full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """Authenticate with email + password, return JWT token."""
    sb = get_db()

    email = _email(req.email)
    result = sb.table("employees").select("*").eq("email", email).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    employee = result.data[0]
    employment = str(employee.get("employment_status") or "Active").lower()
    if employment not in {"active"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not active. Contact HR.")

    if not employee.get("password_hash") or not verify_password(req.password or "", employee["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": str(employee["id"])})
    return TokenResponse(
        access_token=token,
        employee_id=str(employee["id"]),
        full_name=employee["full_name"],
    )


@router.get("/me", response_model=EmployeeResponse)
def get_me(employee: dict = Depends(get_current_employee)):
    """Get the currently authenticated employee's profile."""
    return employee

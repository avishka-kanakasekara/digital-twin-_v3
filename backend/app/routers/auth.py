"""
Auth router — register, login, me.
Uses Supabase as the database backend.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_supabase_admin
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.employee import EmployeeResponse
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_employee,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    """Register a new employee and return a JWT token."""
    sb = get_supabase_admin()

    # Check email uniqueness
    existing = sb.table("employees").select("id").eq("email", req.email).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Check employee code uniqueness
    existing_code = sb.table("employees").select("id").eq("employee_code", req.employee_code).execute()
    if existing_code.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee code already exists")

    employee_id = str(uuid.uuid4())
    initials = "".join(w[0].upper() for w in req.full_name.split()[:2])

    # Insert employee
    emp_data = {
        "id": employee_id,
        "employee_code": req.employee_code,
        "full_name": req.full_name,
        "email": req.email,
        "password_hash": hash_password(req.password),
        "initials": initials,
        "department": req.department,
        "role": req.role,
    }
    sb.table("employees").insert(emp_data).execute()

    # Create gamification profile
    gam_data = {
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
    }
    sb.table("gamification_profiles").insert(gam_data).execute()

    token = create_access_token({"sub": employee_id})
    return TokenResponse(
        access_token=token,
        employee_id=employee_id,
        full_name=req.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """Authenticate with email + password, return JWT token."""
    sb = get_supabase_admin()

    result = sb.table("employees").select("*").eq("email", req.email).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    employee = result.data[0]

    if not employee.get("password_hash"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(req.password, employee["password_hash"]):
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

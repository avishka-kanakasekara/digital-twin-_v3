"""
Auth router — register, login, me.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.employee import Employee
from app.models.gamification import GamificationProfile
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
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new employee and return a JWT token."""
    existing = db.execute(
        select(Employee).where(Employee.email == req.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    existing_code = db.execute(
        select(Employee).where(Employee.employee_code == req.employee_code)
    )
    if existing_code.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee code already exists")

    employee = Employee(
        employee_code=req.employee_code,
        full_name=req.full_name,
        email=req.email,
        password_hash=hash_password(req.password),
        initials="".join(w[0].upper() for w in req.full_name.split()[:2]),
        department=req.department,
        role=req.role,
    )
    db.add(employee)
    db.flush()

    gam_profile = GamificationProfile(employee_id=employee.id)
    db.add(gam_profile)

    token = create_access_token({"sub": str(employee.id)})
    return TokenResponse(
        access_token=token,
        employee_id=str(employee.id),
        full_name=employee.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email + password, return JWT token."""
    result = db.execute(
        select(Employee).where(Employee.email == req.email)
    )
    employee = result.scalar_one_or_none()

    if not employee or not employee.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(req.password, employee.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": str(employee.id)})
    return TokenResponse(
        access_token=token,
        employee_id=str(employee.id),
        full_name=employee.full_name,
    )


@router.get("/me", response_model=EmployeeResponse)
def get_me(employee: Employee = Depends(get_current_employee)):
    """Get the currently authenticated employee's profile."""
    return employee

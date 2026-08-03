"""
Auth schemas — login, register, token.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    employee_code: str
    full_name: str
    email: str
    password: str
    department: Optional[str] = None
    role: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    employee_id: str
    full_name: str

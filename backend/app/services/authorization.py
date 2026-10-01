"""
Employee authorization.

Previous row-level policies allowed the server service role
to read every row. The API therefore owns authorization. When AUTH_ENFORCE
is true, a caller may read or change an employee only when they are that
employee, that employee's manager, or an HR/employer administrator.
"""

from __future__ import annotations

from fastapi import HTTPException, status

from app.database import get_db

_PRIVILEGED = {"hr", "employer", "admin"}


def access_role(employee: dict) -> str:
    explicit = (employee.get("access_role") or "").strip().lower()
    if explicit:
        return explicit
    role = (employee.get("role") or "").strip().lower()
    if role in _PRIVILEGED:
        return role
    return "employee"


def can_access_employee(actor: dict, target_employee_id: str) -> bool:
    if not actor or not target_employee_id:
        return False
    if str(actor.get("id")) == str(target_employee_id):
        return True
    if access_role(actor) in _PRIVILEGED:
        return True
    db = get_db()
    target = db.table("employees").select("id, manager_id").eq("id", target_employee_id).execute()
    if not target.data:
        return False
    return str(target.data[0].get("manager_id") or "") == str(actor.get("id"))


def assert_employee_access(actor: dict | None, target_employee_id: str) -> None:
    if not settings_enforce():
        return
    if actor is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if not can_access_employee(actor, target_employee_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def settings_enforce() -> bool:
    from app.config import settings

    if settings.ENVIRONMENT.strip().lower() == "production":
        return True
    return bool(settings.AUTH_ENFORCE)

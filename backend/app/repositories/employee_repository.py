"""Employee persistence. Routes and services call this instead of SQL text."""

from __future__ import annotations

from app.database import get_db
from app.db.query import QueryResult


class EmployeeRepository:
    def __init__(self, db=None):
        self.db = db or get_db()

    def list_employees(self, skip: int = 0, limit: int = 50, department: str | None = None) -> QueryResult:
        query = self.db.table("employees").select("*", count="exact")
        if department:
            query = query.eq("department", department)
        return query.order("full_name").range(skip, skip + limit - 1).execute()

    def get(self, employee_id: str) -> dict | None:
        result = self.db.table("employees").select("*").eq("id", employee_id).limit(1).execute()
        return result.data[0] if result.data else None

    def insert(self, row: dict) -> dict:
        result = self.db.table("employees").insert(row).execute()
        return result.data[0]

    def update(self, employee_id: str, changes: dict) -> dict | None:
        result = self.db.table("employees").update(changes).eq("id", employee_id).execute()
        return result.data[0] if result.data else None

    def delete(self, employee_id: str) -> bool:
        result = self.db.table("employees").delete().eq("id", employee_id).execute()
        return bool(result.data)

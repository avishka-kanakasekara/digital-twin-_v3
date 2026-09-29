"""Local tests for the Fabric gateway, auth, authorization, and file storage."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.database import get_db, reset_db_clients
from app.db.errors import StorageError
from app.main import app
from app.services.onelake_storage_service import delete_file, read_bytes, save_bytes


@pytest.fixture(scope="module")
def client():
    reset_db_clients()
    with TestClient(app) as test_client:
        yield test_client
    reset_db_clients()


def test_database_health(client):
    response = client.get("/health/database")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["database"] == "fabric-local-sqlite"


def test_employee_skill_project_task_roundtrip(client):
    email = f"ada.{uuid.uuid4().hex[:8]}@company.com"
    registered = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "correct-horse",
            "full_name": "Ada Lovelace",
            "employee_code": f"E-{uuid.uuid4().hex[:6]}",
        },
    )
    assert registered.status_code == 201, registered.text
    employee_id = registered.json()["employee_id"]
    token = registered.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    listed = client.get("/api/employees")
    assert listed.status_code == 200
    assert any(row["id"] == employee_id for row in listed.json()["employees"])

    skill = client.post(
        f"/api/employees/{employee_id}/skills",
        json={"name": "Python", "proficiency": 80, "category": "Engineering"},
        headers=headers,
    )
    assert skill.status_code == 201, skill.text
    skill_id = skill.json()["id"]

    updated = client.put(
        f"/api/employees/{employee_id}/skills/{skill_id}",
        json={"proficiency": 90},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["proficiency"] == 90

    project = client.post(
        f"/api/employees/{employee_id}/projects",
        json={"name": "Analytical Engine", "status": "active", "technologies": ["Python"]},
        headers=headers,
    )
    assert project.status_code == 200, project.text
    project_id = project.json()["id"]
    assert project.json()["technologies"] == ["Python"]

    task = client.post(
        f"/api/employees/{employee_id}/projects/{project_id}/tasks",
        json={"title": "Write notes", "status": "Pending"},
        headers=headers,
    )
    assert task.status_code == 200, task.text

    fetched = client.get(f"/api/employees/{employee_id}/projects/{project_id}/tasks")
    assert fetched.status_code == 200
    assert fetched.json()[0]["title"] == "Write notes"

    removed = client.delete(f"/api/employees/{employee_id}/skills/{skill_id}", headers=headers)
    assert removed.status_code == 204


def test_invalid_and_missing_tokens(client):
    missing = client.get("/api/auth/me")
    assert missing.status_code == 401
    invalid = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-token"})
    assert invalid.status_code == 401


def test_employee_isolation_when_enforced(client):
    settings.AUTH_ENFORCE = True
    try:
        first = client.post(
            "/api/auth/register",
            json={
                "email": f"a.{uuid.uuid4().hex[:8]}@company.com",
                "password": "correct-horse",
                "full_name": "Employee A",
                "employee_code": f"A-{uuid.uuid4().hex[:6]}",
            },
        )
        second = client.post(
            "/api/auth/register",
            json={
                "email": f"b.{uuid.uuid4().hex[:8]}@company.com",
                "password": "correct-horse",
                "full_name": "Employee B",
                "employee_code": f"B-{uuid.uuid4().hex[:6]}",
            },
        )
        assert first.status_code == 201
        assert second.status_code == 201
        token_a = first.json()["access_token"]
        id_a = first.json()["employee_id"]
        id_b = second.json()["employee_id"]
        headers = {"Authorization": f"Bearer {token_a}"}

        own = client.get(f"/api/employees/{id_a}/skills", headers=headers)
        other = client.get(f"/api/employees/{id_b}/skills", headers=headers)
        assert own.status_code == 200
        assert other.status_code == 403

        get_db().table("employees").update({"access_role": "hr"}).eq("id", id_a).execute()
        allowed = client.get(f"/api/employees/{id_b}/skills", headers=headers)
        assert allowed.status_code == 200
    finally:
        settings.AUTH_ENFORCE = False


def test_manager_can_read_direct_report(client):
    settings.AUTH_ENFORCE = True
    try:
        manager = client.post(
            "/api/auth/register",
            json={
                "email": f"m.{uuid.uuid4().hex[:8]}@company.com",
                "password": "correct-horse",
                "full_name": "Manager",
                "employee_code": f"M-{uuid.uuid4().hex[:6]}",
            },
        )
        report = client.post(
            "/api/auth/register",
            json={
                "email": f"r.{uuid.uuid4().hex[:8]}@company.com",
                "password": "correct-horse",
                "full_name": "Report",
                "employee_code": f"R-{uuid.uuid4().hex[:6]}",
            },
        )
        manager_id = manager.json()["employee_id"]
        report_id = report.json()["employee_id"]
        get_db().table("employees").update({"manager_id": manager_id}).eq("id", report_id).execute()
        headers = {"Authorization": f"Bearer {manager.json()['access_token']}"}
        response = client.get(f"/api/employees/{report_id}", headers=headers)
        assert response.status_code == 200
    finally:
        settings.AUTH_ENFORCE = False


def test_storage_rejects_unsafe_paths_and_roundtrips():
    with pytest.raises(StorageError):
        save_bytes("../secrets.txt", b"nope")
    path = save_bytes(f"employees/{uuid.uuid4().hex}/profile/note.txt", b"hello")
    assert read_bytes(path) == b"hello"
    delete_file(path)
    with pytest.raises(StorageError):
        read_bytes(path)

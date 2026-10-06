from __future__ import annotations
"""
Digital Twin v3 — FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
import os
import re
import threading
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import get_db, reset_db_clients
from app.db.errors import FabricDataError, StorageError
from app.services.authorization import assert_employee_access, settings_enforce

# Import all routers
from app.routers import auth, employees, gamification, learning, career, organization, departments, workforce_intelligence


def _clear_broken_local_proxies() -> None:
    """
    Cursor/agent shells sometimes inject HTTP(S)_PROXY=127.0.0.1:xxxxx.
    Drop proxy env so outbound clients are not forced through that proxy.
    """
    cleared = []
    for key in (
        "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
        "http_proxy", "https_proxy", "all_proxy",
    ):
        if key in os.environ:
            os.environ.pop(key, None)
            cleared.append(key)
    os.environ["NO_PROXY"] = "*"
    os.environ["no_proxy"] = "*"
    if cleared:
        print(f"[config] Cleared proxy env: {', '.join(cleared)}")


_clear_broken_local_proxies()


def _warm_learning_and_career_schema() -> None:
    try:
        from app.services import career_market, career_plan, learning_recommendation, succession as succession_service

        db = get_db()
        learning_recommendation.ensure_schema(db)
        career_plan.ensure_schema(db)
        career_market.ensure_schema(db)
        succession_service.ensure_schema(db)
        print("[SUCCESS] Learning, Career Coach, and Succession tables ready")
    except Exception as exc:
        print(f"[WARNING] Learning, Career Coach, and Succession warm-up skipped: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    _clear_broken_local_proxies()
    reset_db_clients()
    try:
        health = get_db().db.health()
        print(f"[SUCCESS] Database connection verified ({health['database']})")
    except Exception as e:
        print(f"[WARNING] Database connection warning: {e}")
    threading.Thread(target=_warm_learning_and_career_schema, daemon=True).start()
    print("[SUCCESS] Digital Twin v3 API starting up")
    yield
    print("[STOP] Shutting down Digital Twin v3 API")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Employee Digital Twin Platform — Backend API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


@app.exception_handler(FabricDataError)
async def handle_fabric_errors(_: Request, exc: FabricDataError):
    reset_db_clients()
    return JSONResponse(status_code=exc.status_code, content={"detail": str(exc)})


@app.exception_handler(StorageError)
async def handle_storage_errors(_: Request, exc: StorageError):
    return JSONResponse(status_code=exc.status_code, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def handle_unhandled_exceptions(_: Request, exc: Exception):
    """
    Ensure unexpected errors return JSON (so CORS middleware can attach headers).
    Without this, raw ASGI 500s can look like CORS failures in the browser.
    """
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please retry.",
            "error_type": exc.__class__.__name__,
        },
    )


# CORS middleware — allow the React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(gamification.router)
app.include_router(learning.router)
app.include_router(learning_recommendation.router)
app.include_router(career.router)
app.include_router(career_coach_plan.router)
app.include_router(organization.router)
app.include_router(departments.router)
app.include_router(workforce_intelligence.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "database": "fabric",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "database": "fabric"}


@app.get("/health/database", tags=["Health"])
async def health_database():
    try:
        result = get_db().db.health()
        return result
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "database": "fabric"},
        )


_EMPLOYEE_PATHS = (
    re.compile(r"^/api/employees/(?P<id>[^/]+)"),
    re.compile(r"^/api/gamification/(?P<id>[^/]+)"),
    re.compile(r"^/api/learning/(?P<id>[^/]+)"),
    re.compile(r"^/api/career/(?P<id>[^/]+)"),
    re.compile(r"^/api/career-coach/(?P<id>[^/]+)"),
    re.compile(r"^/api/succession/employee/(?P<id>[^/]+)"),
)
_NOT_EMPLOYEE_IDS = {
    "leaderboard", "rewards", "admin", "courses", "stall-flags", "roadmap", "roles",
}


class EmployeeAuthorizationMiddleware(BaseHTTPMiddleware):
    """Enforce employee scope when AUTH_ENFORCE is on, and always in production."""

    async def dispatch(self, request: Request, call_next):
        if not settings_enforce():
            return await call_next(request)
        path = request.url.path
        if not path.startswith("/api/") or path.startswith("/api/auth/login") or path.startswith("/api/auth/register"):
            return await call_next(request)
        header = request.headers.get("authorization", "")
        if not header.lower().startswith("bearer "):
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})
        token = header.split(" ", 1)[1].strip()
        try:
            from app.utils.auth import employee_from_token

            actor = employee_from_token(token)
        except Exception as exc:
            status_code = getattr(exc, "status_code", 401)
            detail = getattr(exc, "detail", "Not authenticated")
            return JSONResponse(status_code=status_code, content={"detail": detail})
        for pattern in _EMPLOYEE_PATHS:
            match = pattern.match(path)
            if not match:
                continue
            employee_id = match.group("id")
            if employee_id in _NOT_EMPLOYEE_IDS:
                break
            try:
                assert_employee_access(actor, employee_id)
            except Exception as exc:
                status_code = getattr(exc, "status_code", 403)
                detail = getattr(exc, "detail", "Forbidden")
                return JSONResponse(status_code=status_code, content={"detail": detail})
            break
        return await call_next(request)


app.add_middleware(EmployeeAuthorizationMiddleware)

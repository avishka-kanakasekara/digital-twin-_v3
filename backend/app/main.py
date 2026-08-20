from __future__ import annotations
"""
Digital Twin v3 — FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
import httpcore
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import get_supabase_admin, reset_supabase_clients

# Import all routers
from app.routers import auth, employees, gamification, learning, career, organization, departments


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Verify Supabase connection on startup
    try:
        sb = get_supabase_admin()
        sb.table("employees").select("id").limit(1).execute()
        print("[SUCCESS] Supabase connection verified")
    except Exception as e:
        print(f"[WARNING] Supabase connection warning: {e}")
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


@app.exception_handler(httpx.HTTPError)
async def handle_httpx_errors(_: Request, exc: httpx.HTTPError):
    """Gracefully surface transient Supabase/network failures."""
    reset_supabase_clients()
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Backend data service is temporarily unavailable. Please retry.",
            "error_type": exc.__class__.__name__,
        },
    )


@app.exception_handler(httpcore.ProtocolError)
async def handle_httpcore_protocol_errors(_: Request, exc: httpcore.ProtocolError):
    reset_supabase_clients()
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database connection was interrupted. Please retry.",
            "error_type": exc.__class__.__name__,
        },
    )

# CORS middleware — allow the React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(gamification.router)
app.include_router(learning.router)
app.include_router(career.router)
app.include_router(organization.router)
app.include_router(departments.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "database": "Supabase",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "database": "Supabase"}

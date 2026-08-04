from __future__ import annotations
"""
Digital Twin v3 — FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db

# Import all routers
from app.routers import auth, employees, gamification, learning, career, organization


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: create tables if they don't exist (dev only)
    # Disabled - using Alembic migrations instead
    # if settings.DEBUG:
    #     await init_db()
    #     print("✅ Database tables created / verified")
    print("✅ Digital Twin v3 API starting up")
    yield
    # Shutdown: cleanup if needed
    print("🛑 Shutting down Digital Twin v3 API")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Employee Digital Twin Platform — Backend API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
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


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}

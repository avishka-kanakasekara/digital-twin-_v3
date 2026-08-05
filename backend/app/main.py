"""
Digital Twin v3 — FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import get_supabase_admin

# Import all routers
from app.routers import auth, employees, gamification, learning, career


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Verify Supabase connection on startup
    try:
        sb = get_supabase_admin()
        sb.table("employees").select("id").limit(1).execute()
        print("✅ Supabase connection verified")
    except Exception as e:
        print(f"⚠️  Supabase connection warning: {e}")
    print("✅ Digital Twin v3 API starting up")
    yield
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

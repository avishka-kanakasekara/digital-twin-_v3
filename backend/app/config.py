"""
Application configuration — loads from .env file or environment variables.
Supports both PostgreSQL (production) and SQLite (local dev without Docker).
"""

from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path

# Always resolve DB path relative to backend/ folder, not shell cwd
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DB = _BACKEND_DIR / "digitaltwin.db"


class Settings(BaseSettings):
    # Database — defaults to SQLite for zero-setup local dev
    DATABASE_URL: str = "sqlite+aiosqlite:///./digitaltwin.db"
    DATABASE_URL_SYNC: str = "sqlite:///./digitaltwin.db"

    # Redis (optional — gracefully degrades without it)
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Auth
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Google Gemini
    GOOGLE_API_KEY: str = ""

    # App
    APP_NAME: str = "Digital Twin v3"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()

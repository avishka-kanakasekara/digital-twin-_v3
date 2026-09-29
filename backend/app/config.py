from __future__ import annotations
"""
Application configuration — loads from .env file or environment variables.
Operational data is stored in Microsoft Fabric SQL Database.
"""

from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


BACKEND_DIR = Path(__file__).resolve().parent.parent  # backend/


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"

    # Microsoft Fabric SQL Database (transactional)
    FABRIC_SQL_SERVER: str = ""
    FABRIC_SQL_DATABASE: str = ""
    FABRIC_ODBC_DRIVER: str = "ODBC Driver 18 for SQL Server"
    FABRIC_TENANT_ID: str = ""
    FABRIC_CLIENT_ID: str = ""
    FABRIC_CLIENT_SECRET: str = ""
    # auto | interactive | token | service_principal
    # interactive opens a browser login (best for local Mac without az login).
    FABRIC_AUTH_MODE: str = "auto"
    # Development only. Ignored when ENVIRONMENT=production.
    FABRIC_LOCAL_SQLITE: bool = False
    FABRIC_LOCAL_SQLITE_PATH: str = "./data/edt_local.sqlite"

    # Microsoft OneLake (files). Empty values keep files on local disk.
    ONELAKE_WORKSPACE: str = ""
    ONELAKE_LAKEHOUSE: str = ""
    ONELAKE_ACCOUNT_URL: str = "https://onelake.dfs.fabric.microsoft.com"

    # Authentication. jwt preserves the existing email/password API.
    # entra additionally accepts Microsoft Entra access tokens.
    AUTH_PROVIDER: str = "jwt"
    AUTH_ENFORCE: bool = False
    ENTRA_TENANT_ID: str = ""
    ENTRA_CLIENT_ID: str = ""
    ENTRA_AUDIENCE: str = ""

    # Redis (optional — gracefully degrades without it)
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Auth
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Google Gemini / Vertex AI
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GCP_PROJECT_ID: str = ""
    GCP_LOCATION: str = ""

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
    def use_local_sqlite(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "development" and self.FABRIC_LOCAL_SQLITE

    @property
    def local_sqlite_path(self) -> Path:
        path = Path(self.FABRIC_LOCAL_SQLITE_PATH)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path

    @property
    def onelake_enabled(self) -> bool:
        return bool(self.ONELAKE_WORKSPACE and self.ONELAKE_LAKEHOUSE)

    model_config = {
        "env_file": str(BACKEND_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()

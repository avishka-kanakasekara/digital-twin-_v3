import os
from pathlib import Path

_db = Path(__file__).resolve().parents[1] / "data" / "pytest_edt.sqlite"
_db.parent.mkdir(parents=True, exist_ok=True)
if _db.exists():
    _db.unlink()

os.environ["ENVIRONMENT"] = "development"
os.environ["FABRIC_LOCAL_SQLITE"] = "true"
os.environ["FABRIC_LOCAL_SQLITE_PATH"] = str(_db)
os.environ["AUTH_ENFORCE"] = "false"
os.environ["CAREER_MARKET_AI"] = "false"
os.environ["SUCCESSION_AI"] = "false"
os.environ["AUTH_PROVIDER"] = "jwt"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["UPLOAD_DIR"] = str(Path(__file__).resolve().parents[1] / "data" / "pytest_uploads")

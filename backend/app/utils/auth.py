"""
Authentication utilities.

The application login remains email and password with an application JWT,
because that is the contract the React client already uses.
When AUTH_PROVIDER is entra or both, a Microsoft Entra access token is
also accepted and mapped to an employee record.
"""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_db

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token scheme
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def employee_from_token(token: str) -> dict:
    """Resolve a bearer token to an employee row."""
    try:
        payload = decode_token(token)
        employee_id = payload.get("sub")
        if not employee_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return _employee_by_id(str(employee_id))
    except HTTPException as exc:
        if exc.status_code != status.HTTP_401_UNAUTHORIZED:
            raise
        return _employee_from_entra(token)


def get_current_employee(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """FastAPI dependency — extracts and validates the current employee."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return employee_from_token(credentials.credentials)


def _employee_by_id(employee_id: str) -> dict:
    result = get_db().table("employees").select("*").eq("id", employee_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return result.data[0]


def _employee_from_entra(token: str) -> dict:
    from app.core.entra_auth import entra_enabled, validate_entra_token

    if not entra_enabled():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        claims = validate_entra_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    subject = str(claims.get("oid") or claims.get("sub") or "")
    email = str(claims.get("preferred_username") or claims.get("email") or "").lower()
    db = get_db()
    if subject:
        mapped = (
            db.table("user_identities")
            .select("employee_id")
            .eq("provider", "entra")
            .eq("subject", subject)
            .limit(1)
            .execute()
        )
        if mapped.data:
            return _employee_by_id(mapped.data[0]["employee_id"])
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Entra account is not linked")
    found = db.table("employees").select("*").eq("email", email).limit(1).execute()
    if not found.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No employee is linked to this account")
    employee = found.data[0]
    if subject:
        try:
            db.table("user_identities").insert({
                "employee_id": employee["id"],
                "provider": "entra",
                "subject": subject,
                "email": email,
            }).execute()
        except Exception:
            pass
    return employee


def get_optional_employee(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """Optional auth — returns None if no token provided."""
    if not credentials:
        return None
    try:
        return get_current_employee(credentials)
    except HTTPException:
        return None

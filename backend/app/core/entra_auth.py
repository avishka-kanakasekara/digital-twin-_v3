"""Microsoft Entra ID access-token validation for optional workforce login."""

from __future__ import annotations

import logging

import httpx
from jose import JWTError, jwt

from app.config import settings

logger = logging.getLogger("edt.auth")
_jwks_cache: dict | None = None


def entra_enabled() -> bool:
    provider = settings.AUTH_PROVIDER.strip().lower()
    return provider in {"entra", "both"} and bool(settings.ENTRA_TENANT_ID and settings.ENTRA_AUDIENCE)


def validate_entra_token(token: str) -> dict:
    if not entra_enabled():
        raise JWTError("Entra authentication is not configured")
    try:
        header = jwt.get_unverified_header(token)
        keys = _jwks().get("keys", [])
        key = next((item for item in keys if item.get("kid") == header.get("kid")), None)
        if key is None:
            raise JWTError("Unknown signing key")
        tenant = settings.ENTRA_TENANT_ID
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.ENTRA_AUDIENCE,
            issuer=f"https://login.microsoftonline.com/{tenant}/v2.0",
        )
        return claims
    except JWTError:
        raise
    except Exception as exc:
        logger.exception("Entra token validation failed")
        raise JWTError("Invalid Entra token") from exc


def _jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    tenant = settings.ENTRA_TENANT_ID
    url = f"https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    _jwks_cache = response.json()
    return _jwks_cache

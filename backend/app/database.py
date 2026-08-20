from __future__ import annotations
"""
Supabase client initialization.
Provides both anon-key and service-role clients.
"""

from supabase import create_client, Client, ClientOptions
from app.config import settings

# ── Clients ────────────────────────────────────────────────────
# Anon client — respects RLS policies (used by default)
_supabase_anon: Client | None = None

# Service-role client — bypasses RLS (used for admin/server operations)
_supabase_service: Client | None = None


def _build_client(api_key: str) -> Client:
    """Create a Supabase client with tighter timeouts for web requests."""
    return create_client(
        settings.SUPABASE_URL,
        api_key,
        options=ClientOptions(
            postgrest_client_timeout=8,
            storage_client_timeout=8,
            function_client_timeout=8,
        ),
    )


def reset_supabase_clients() -> None:
    """Drop cached clients so the next request reconnects cleanly."""
    global _supabase_anon, _supabase_service
    _supabase_anon = None
    _supabase_service = None


def get_supabase() -> Client:
    """FastAPI dependency — returns the anon Supabase client."""
    global _supabase_anon
    if _supabase_anon is None:
        _supabase_anon = _build_client(settings.SUPABASE_ANON_KEY)
    return _supabase_anon


def get_supabase_admin() -> Client:
    """Returns the service-role Supabase client (bypasses RLS)."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = _build_client(settings.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_service

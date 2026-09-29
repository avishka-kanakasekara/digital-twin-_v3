"""
Microsoft Fabric SQL database connection.

Production connects with ODBC Driver 18 and a Microsoft Entra access token
from DefaultAzureCredential (Azure CLI locally, managed identity in Azure)
or a service principal when FABRIC_CLIENT_SECRET is set.

Development can use a local SQLite file only when ENVIRONMENT=development
and FABRIC_LOCAL_SQLITE=true. Production refuses that path.
"""

from __future__ import annotations

import ctypes
import logging
import os
import sqlite3
import struct
import threading
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from app.config import settings
from app.db.errors import FabricAuthError, FabricDataError

logger = logging.getLogger("edt.fabric")

SQL_COPT_SS_ACCESS_TOKEN = 1256
_OPENSSL_READY = False
# pyodbc does not natively decode SQL Server DATETIMEOFFSET (-155)
SQL_TYPE_DATETIMEOFFSET = -155
_TRANSIENT_MARKERS = (
    "deadlock",
    "timeout",
    "communication link failure",
    "transport-level error",
    "login timeout",
    "08s01",
    "40001",
    "connection is busy with results",
    "tcp provider",
    "10060",
    "0x274c",
    "0x20",
)
_POOL_MAX_IDLE_SECONDS = 45.0
_EXECUTE_ATTEMPTS = 5

# Reuse one credential + access token so Entra does not re-prompt on every query.
_TOKEN_SCOPE = "https://database.windows.net/.default"
_credential: Any | None = None
_cached_token: str | None = None
_cached_token_expires_on: float = 0.0
_credential_lock = threading.Lock()


class FabricDatabase:
    def __init__(self) -> None:
        self.dialect = "sqlite" if settings.use_local_sqlite else "tsql"
        self._lock = threading.Lock()
        self._sqlite: sqlite3.Connection | None = None
        # Pool entries are (connection, last_checkin_monotonic)
        self._pool: list[tuple[Any, float]] = []
        self._pool_size = 16
        self._tx = threading.local()
        self._checkout_lock = threading.Semaphore(16)

    def health(self) -> dict[str, str]:
        if self.dialect == "sqlite":
            self._ensure_sqlite()
            self.execute("SELECT 1 AS ok")
            return {"status": "healthy", "database": "fabric-local-sqlite"}
        if not settings.FABRIC_SQL_SERVER or not settings.FABRIC_SQL_DATABASE:
            raise FabricAuthError("Fabric SQL server and database are not configured")
        self.execute("SELECT 1 AS ok")
        return {"status": "healthy", "database": "fabric"}

    def execute(self, sql: str, params: list[Any] | tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        last_error: Exception | None = None
        for attempt in range(_EXECUTE_ATTEMPTS):
            try:
                with self._connection() as conn:
                    cur = conn.cursor()
                    try:
                        cur.execute(sql, tuple(params))
                        if cur.description is None:
                            if self._in_transaction():
                                return []
                            conn.commit()
                            return []
                        columns = [col[0] for col in cur.description]
                        rows = [dict(zip(columns, row)) for row in cur.fetchall()]
                        if not self._in_transaction():
                            conn.commit()
                        return rows
                    except Exception as exc:
                        # Poison the connection before it is returned to the pool.
                        if _is_busy_connection(exc) or _is_broken_connection(exc):
                            self._tx.discard_conn = True
                        raise
                    finally:
                        try:
                            cur.close()
                        except Exception:
                            pass
            except FabricDataError:
                raise
            except Exception as exc:
                last_error = exc
                retryable = _is_transient(exc) or _is_busy_connection(exc) or _is_broken_connection(exc)
                if attempt < _EXECUTE_ATTEMPTS - 1 and retryable:
                    logger.warning(
                        "Transient Fabric error, retrying (%s/%s %s): %s",
                        attempt + 1,
                        _EXECUTE_ATTEMPTS,
                        exc.__class__.__name__,
                        str(exc)[:180],
                    )
                    # Drop idle pooled sockets — they often die during long Gemini calls.
                    if _is_broken_connection(exc):
                        self._drain_pool()
                    time.sleep(min(2.0, 0.25 * (2**attempt)))
                    continue
                logger.exception("Fabric query failed")
                raise FabricDataError(_safe_db_message(exc)) from exc
        raise FabricDataError(_safe_db_message(last_error))

    @contextmanager
    def transaction(self) -> Iterator[None]:
        if getattr(self._tx, "conn", None) is not None:
            yield
            return
        with self._connection() as conn:
            self._tx.conn = conn
            try:
                yield
                conn.commit()
            except Exception:
                try:
                    conn.rollback()
                except Exception:
                    pass
                raise
            finally:
                self._tx.conn = None

    def close(self) -> None:
        with self._lock:
            if self._sqlite is not None:
                self._sqlite.close()
                self._sqlite = None
            while self._pool:
                conn, _idle_at = self._pool.pop()
                _close_quietly(conn)

    def _drain_pool(self) -> None:
        with self._lock:
            stale = list(self._pool)
            self._pool.clear()
        for conn, _idle_at in stale:
            _close_quietly(conn)

    def _in_transaction(self) -> bool:
        return getattr(self._tx, "conn", None) is not None

    @contextmanager
    def _connection(self) -> Iterator[Any]:
        existing = getattr(self._tx, "conn", None)
        if existing is not None:
            yield existing
            return
        if self.dialect == "sqlite":
            conn = self._ensure_sqlite()
            with self._lock:
                yield conn
            return
        self._checkout_lock.acquire()
        conn = self._checkout()
        self._tx.last_conn = conn
        self._tx.discard_conn = False
        try:
            yield conn
        finally:
            try:
                if getattr(self._tx, "discard_conn", False):
                    _close_quietly(conn)
                else:
                    self._checkin(conn)
            finally:
                self._tx.last_conn = None
                self._tx.discard_conn = False
                self._checkout_lock.release()

    def _drop_last_connection(self) -> None:
        """Mark the connection from the current _connection() scope to be closed, not pooled."""
        self._tx.discard_conn = True
        conn = getattr(self._tx, "last_conn", None)
        if conn is None:
            return
        with self._lock:
            self._pool = [(c, ts) for c, ts in self._pool if c is not conn]

    def _ensure_sqlite(self) -> sqlite3.Connection:
        if self._sqlite is not None:
            return self._sqlite
        with self._lock:
            if self._sqlite is None:
                path = settings.local_sqlite_path
                path.parent.mkdir(parents=True, exist_ok=True)
                conn = sqlite3.connect(str(path), check_same_thread=False)
                conn.row_factory = None
                conn.execute("PRAGMA foreign_keys = ON")
                self._apply_local_schema(conn)
                self._sqlite = conn
        return self._sqlite

    def _apply_local_schema(self, conn: sqlite3.Connection) -> None:
        schema_path = _sqlite_schema_path()
        if not schema_path.exists():
            return
        script = schema_path.read_text(encoding="utf-8")
        conn.executescript(script)
        conn.commit()

    def _checkout(self) -> Any:
        while True:
            conn: Any | None = None
            with self._lock:
                while self._pool:
                    candidate, idle_at = self._pool.pop()
                    if (time.monotonic() - idle_at) > _POOL_MAX_IDLE_SECONDS:
                        _close_quietly(candidate)
                        continue
                    conn = candidate
                    break
            if conn is None:
                return _connect_fabric()
            if _connection_alive(conn):
                return conn
            logger.info("Dropping stale Fabric SQL connection from pool")
            _close_quietly(conn)

    def _checkin(self, conn: Any) -> None:
        if not _connection_alive(conn):
            _close_quietly(conn)
            return
        with self._lock:
            if len(self._pool) < self._pool_size:
                self._pool.append((conn, time.monotonic()))
                return
        _close_quietly(conn)


def _ensure_openssl() -> None:
    """
    Microsoft ODBC Driver 18 on macOS needs OpenSSL 1.x/3.x.
    Homebrew's default openssl@4 is not accepted, so preload openssl@3.
    """
    global _OPENSSL_READY
    if _OPENSSL_READY:
        return
    candidates = [
        Path("/opt/homebrew/opt/openssl@3/lib"),
        Path("/usr/local/opt/openssl@3/lib"),
    ]
    for lib_dir in candidates:
        ssl = lib_dir / "libssl.3.dylib"
        crypto = lib_dir / "libcrypto.3.dylib"
        if not ssl.exists() or not crypto.exists():
            continue
        for key in ("DYLD_LIBRARY_PATH", "DYLD_FALLBACK_LIBRARY_PATH"):
            existing = os.environ.get(key, "")
            parts = [p for p in existing.split(os.pathsep) if p and p != str(lib_dir)]
            os.environ[key] = os.pathsep.join([str(lib_dir), *parts])
        try:
            ctypes.CDLL(str(crypto), mode=ctypes.RTLD_GLOBAL)
            ctypes.CDLL(str(ssl), mode=ctypes.RTLD_GLOBAL)
            _OPENSSL_READY = True
            logger.info("Loaded OpenSSL 3 for ODBC from %s", lib_dir)
            return
        except OSError as exc:
            logger.warning("Could not preload OpenSSL from %s: %s", lib_dir, exc)
    _OPENSSL_READY = True


def _register_datetimeoffset_converter(conn: Any) -> None:
    def _convert(value: bytes):
        # https://github.com/mkleehammer/pyodbc/wiki/Using-an-Output-Converter-function
        if value is None:
            return None
        try:
            unpacked = struct.unpack("<6hI2h", value)
            year, month, day, hour, minute, second, frac, *_rest = unpacked
            micro = frac // 1000
            return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:{second:02d}.{micro:06d}"
        except Exception:
            return str(value)

    try:
        conn.add_output_converter(SQL_TYPE_DATETIMEOFFSET, _convert)
    except Exception:
        pass


def _connect_fabric() -> Any:
    _ensure_openssl()
    try:
        import pyodbc
    except ImportError as exc:
        raise FabricDataError(
            "pyodbc is not installed. Install the Microsoft ODBC Driver 18 and pyodbc."
        ) from exc

    server = settings.FABRIC_SQL_SERVER
    database = settings.FABRIC_SQL_DATABASE
    if not server or not database:
        raise FabricAuthError("Fabric SQL server and database are not configured")

    driver = settings.FABRIC_ODBC_DRIVER or "ODBC Driver 18 for SQL Server"
    base = (
        f"DRIVER={{{driver}}};SERVER={server},1433;DATABASE={database};"
        "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=60;"
        # Allow concurrent statements on one connection (frontend fires many parallel API calls).
        "MARS_Connection=yes;"
    )
    mode = (settings.FABRIC_AUTH_MODE or "auto").strip().lower()

    if mode == "service_principal" or (settings.FABRIC_CLIENT_ID and settings.FABRIC_CLIENT_SECRET):
        conn_str = (
            base
            + "Authentication=ActiveDirectoryServicePrincipal;"
            + f"UID={settings.FABRIC_CLIENT_ID};PWD={settings.FABRIC_CLIENT_SECRET};"
        )
        logger.info("Connecting to Fabric SQL with a service principal")
        try:
            conn = pyodbc.connect(conn_str, timeout=60)
            _register_datetimeoffset_converter(conn)
            return conn
        except Exception as exc:
            logger.exception("Fabric service principal connection failed")
            raise FabricAuthError("Fabric authentication failed") from exc

    if mode == "interactive":
        # Explicit interactive-only mode (ODBC browser login). Prefer token mode locally.
        return _connect_interactive(pyodbc, base)

    # auto / token: Azure CLI or one cached interactive browser login — never re-prompt
    # via ODBC ActiveDirectoryInteractive on every new pool connection.
    return _connect_with_token(pyodbc, base)


def _connect_with_token(pyodbc: Any, base: str) -> Any:
    token = _entra_sql_token()
    token_bytes = token.encode("utf-16-le")
    token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)
    logger.info("Connecting to Fabric SQL with cached Entra access token")
    try:
        conn = pyodbc.connect(base, attrs_before={SQL_COPT_SS_ACCESS_TOKEN: token_struct}, timeout=60)
        _register_datetimeoffset_converter(conn)
        return conn
    except Exception as exc:
        logger.exception("Fabric token connection failed")
        # Force a fresh token on the next attempt (expired / revoked token).
        _invalidate_cached_token()
        raise FabricAuthError("Fabric authentication failed") from exc


def _connect_interactive(pyodbc: Any, base: str) -> Any:
    conn_str = base + "Authentication=ActiveDirectoryInteractive;"
    logger.info("Connecting to Fabric SQL with interactive Entra login")
    try:
        conn = pyodbc.connect(conn_str, timeout=120)
        _register_datetimeoffset_converter(conn)
        return conn
    except Exception as exc:
        logger.exception("Fabric interactive connection failed")
        raise FabricAuthError(
            "Fabric authentication failed. Sign in when the browser opens, "
            "or run `az login` and set FABRIC_AUTH_MODE=token."
        ) from exc


def _invalidate_cached_token() -> None:
    global _cached_token, _cached_token_expires_on
    with _credential_lock:
        _cached_token = None
        _cached_token_expires_on = 0.0


def _build_entra_credential() -> Any:
    """
    Prefer Azure CLI (persists after `az login`). Fall back to InteractiveBrowser
    with an on-disk MSAL cache so the browser opens at most once per machine.
    """
    from azure.identity import (
        AzureCliCredential,
        ChainedTokenCredential,
        InteractiveBrowserCredential,
        TokenCachePersistenceOptions,
    )

    credentials: list[Any] = [AzureCliCredential(process_timeout=20)]
    try:
        cache_opts = TokenCachePersistenceOptions(allow_unencrypted_storage=True)
        credentials.append(
            InteractiveBrowserCredential(
                cache_persistence_options=cache_opts,
                timeout=120,
            )
        )
    except Exception as exc:
        logger.warning("Persistent token cache unavailable (%s); using in-memory browser auth", exc)
        credentials.append(InteractiveBrowserCredential(timeout=120))
    return ChainedTokenCredential(*credentials)


def _entra_sql_token() -> str:
    global _credential, _cached_token, _cached_token_expires_on
    try:
        import azure.identity  # noqa: F401
    except ImportError as exc:
        raise FabricAuthError(
            "azure-identity is required for Microsoft Entra authentication"
        ) from exc

    now = time.time()
    with _credential_lock:
        # Refresh 5 minutes before expiry so connections never use a stale token.
        if _cached_token and now < (_cached_token_expires_on - 300):
            return _cached_token
        try:
            if _credential is None:
                _credential = _build_entra_credential()
            access = _credential.get_token(_TOKEN_SCOPE)
            _cached_token = access.token
            _cached_token_expires_on = float(access.expires_on)
            logger.info(
                "Acquired Fabric SQL token (expires_in≈%ss)",
                max(0, int(_cached_token_expires_on - now)),
            )
            return _cached_token
        except Exception as exc:
            logger.exception("Could not acquire a Fabric SQL access token")
            raise FabricAuthError(
                "Fabric authentication failed. Run `az login` once in a terminal, "
                "then restart the backend. Browser sign-in is only needed if Azure CLI is unavailable."
            ) from exc


def _is_transient(exc: Exception) -> bool:
    text = str(exc).lower()
    return any(marker in text for marker in _TRANSIENT_MARKERS)


def _is_busy_connection(exc: Exception) -> bool:
    return "connection is busy with results" in str(exc).lower()


def _is_broken_connection(exc: Exception) -> bool:
    text = str(exc).lower()
    return any(
        marker in text
        for marker in (
            "communication link failure",
            "physical connection is not usable",
            "connection reset",
            "broken pipe",
            "08s01",
            "tcp provider",
            "10060",
            "0x274c",
            "0x20",
        )
    )


def _connection_alive(conn: Any) -> bool:
    try:
        cur = conn.cursor()
        try:
            cur.execute("SELECT 1 AS ok")
            cur.fetchall()
        finally:
            cur.close()
        return True
    except Exception:
        return False


def _close_quietly(conn: Any) -> None:
    try:
        conn.close()
    except Exception:
        pass


def _safe_db_message(exc: Exception | None) -> str:
    if exc is None:
        return "Database operation failed"
    text = str(exc).lower()
    if "multiple cascade paths" in text or "cycles" in text:
        return "Database constraint conflict (cascade path)"
    if "unique" in text or "duplicate" in text:
        return "A record with that value already exists"
    if "foreign key" in text or "reference constraint" in text or "1785" in text:
        return "Database constraint conflict"
    if "login" in text or "authentication" in text or "token" in text:
        return "Fabric authentication failed"
    return "Database operation failed"


def _sqlite_schema_path() -> Path:
    return Path(__file__).resolve().parents[3] / "fabric" / "database" / "sqlite_schema.sql"

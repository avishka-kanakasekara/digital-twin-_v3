from __future__ import annotations
"""
Redis client utility — handles connection and provides graceful degradation when Redis is unavailable.
"""

import redis
from app.config import settings

# Global Redis client instance
_redis_client: redis.Redis | None = None


def get_redis_client() -> redis.Redis | None:
    """
    Get Redis client instance. Returns None if Redis is not available.
    This allows the app to function without Redis (graceful degradation).
    """
    global _redis_client
    
    if _redis_client is not None:
        return _redis_client
    
    try:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        # Test connection
        _redis_client.ping()
        return _redis_client
    except Exception:
        # Redis not available — return None, app will work without caching
        return None


def redis_available() -> bool:
    """Check if Redis is available."""
    client = get_redis_client()
    if client is None:
        return False
    try:
        client.ping()
        return True
    except Exception:
        return False


# Leaderboard utilities
def add_to_leaderboard(key: str, member: str, score: float) -> bool:
    """Add member to sorted set (leaderboard). Returns True if successful."""
    client = get_redis_client()
    if client is None:
        return False
    try:
        client.zadd(key, {member: score})
        return True
    except Exception:
        return False


def get_leaderboard_rank(key: str, member: str) -> int | None:
    """Get rank of member in leaderboard (0-indexed). Returns None if Redis unavailable."""
    client = get_redis_client()
    if client is None:
        return None
    try:
        rank = client.zrevrank(key, member)
        return rank + 1 if rank is not None else None  # Convert to 1-indexed
    except Exception:
        return None


def get_leaderboard_top(key: str, count: int = 10) -> list[tuple[str, float]] | None:
    """Get top N members from leaderboard. Returns None if Redis unavailable."""
    client = get_redis_client()
    if client is None:
        return None
    try:
        return client.zrevrange(key, 0, count - 1, withscores=True)
    except Exception:
        return None


# Cache utilities
def cache_get(key: str) -> str | None:
    """Get value from cache. Returns None if Redis unavailable or key not found."""
    client = get_redis_client()
    if client is None:
        return None
    try:
        return client.get(key)
    except Exception:
        return None


def cache_set(key: str, value: str, ex: int | None = None) -> bool:
    """Set value in cache with optional expiration. Returns True if successful."""
    client = get_redis_client()
    if client is None:
        return False
    try:
        return client.set(key, value, ex=ex) is True
    except Exception:
        return False


def cache_delete(key: str) -> bool:
    """Delete key from cache. Returns True if successful."""
    client = get_redis_client()
    if client is None:
        return False
    try:
        return client.delete(key) > 0
    except Exception:
        return False

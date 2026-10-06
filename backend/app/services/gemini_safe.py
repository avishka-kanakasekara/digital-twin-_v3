from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor


def ask_gemini_grounded_timed(prompt: str, timeout: float = 60.0) -> tuple[str, list[dict[str, str]], list[str]]:
    """Gemini answer grounded in Google Search, with the web sources it used. Raises on failure."""
    from gemini_client import ask_gemini_grounded

    pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="gemini-grounded")
    future = pool.submit(ask_gemini_grounded, prompt)
    try:
        return future.result(timeout=timeout)
    finally:
        pool.shutdown(wait=False, cancel_futures=True)


def ask_gemini_timed(prompt: str, timeout: float = 8.0, fallback: str = "") -> str:
    """Call Gemini with a hard timeout without blocking process reload on stuck threads."""
    try:
        from gemini_client import ask_gemini

        pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="gemini")
        future = pool.submit(ask_gemini, prompt)
        try:
            text = future.result(timeout=timeout)
            return (text or "").strip() or fallback
        finally:
            pool.shutdown(wait=False, cancel_futures=True)
    except Exception as exc:
        print(f"[gemini_safe] {exc}")
        return fallback

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor


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

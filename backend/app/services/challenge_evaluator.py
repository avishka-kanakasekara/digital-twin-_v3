from __future__ import annotations
"""
Challenge Evaluator Service — AI-powered step submission grading.
"""

import json
import re

EVAL_PROMPT_TEMPLATE = """\
You are a fair, rigorous, and specific evaluator for an employee learning challenge.
Your job is to assess whether the employee's submission genuinely meets the requirements.

STEP TITLE: {step_title}

TASK INSTRUCTIONS (what the employee was asked to do):
{instructions}

EVALUATION RUBRIC (the specific criteria you must grade against):
{evaluation_rubric}

{reference_section}EMPLOYEE SUBMISSION (type: {submission_type}):
{content}

---
Grade this submission strictly and fairly. A superficial, vague, or off-topic answer must score below 70.
A thorough, specific, and on-topic answer should score above 80.

Your response MUST be valid JSON only — no markdown fences, no extra text, nothing before or after the JSON object:
{{"score": <integer 0-100>, "pass": <true if score >= 70 else false>, "feedback": "<2-4 sentences — be specific about what was good and what was missing>", "suggested_xp": <integer proportional to score, max {max_xp}>}}
"""

IMAGE_EVAL_PROMPT_TEMPLATE = """\
You are evaluating an employee's image submission for a learning challenge.

STEP TITLE: {step_title}
TASK INSTRUCTIONS: {instructions}
EVALUATION RUBRIC: {evaluation_rubric}
{reference_section}
The employee uploaded an image. Examine it carefully against the rubric.

Your response MUST be valid JSON only:
{{"score": <integer 0-100>, "pass": <true if score >= 70 else false>, "feedback": "<2-4 sentences>", "suggested_xp": <integer max {max_xp}>}}
"""

MANUAL_REVIEW_FEEDBACK = (
    "Your submission has been flagged for manual review because the AI evaluator encountered "
    "a temporary error. An admin will review and grade your work shortly. No action required from you."
)


def _build_reference_section(reference_url: str | None) -> str:
    if not reference_url:
        return ""
    return f"REFERENCE MATERIAL: {reference_url}\n(Use this as context when judging whether the submission meets the rubric.)\n\n"


def _compute_xp(score: int, max_xp: int) -> int:
    if score >= 80:
        return max_xp
    elif score >= 50:
        return max_xp // 2
    return 0


def _parse_json_response(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().strip("`").strip()
    return json.loads(cleaned)


class EvaluationResult:
    def __init__(self, score: int, passed: bool, feedback: str, xp_awarded: int, raw: str):
        self.score = score
        self.passed = passed
        self.feedback = feedback
        self.xp_awarded = xp_awarded
        self.raw = raw


def _call_gemini_text(prompt: str) -> str:
    from app.services.gemini_safe import ask_gemini_timed
    result = ask_gemini_timed(prompt, timeout=25.0, fallback="")
    if not result:
        raise RuntimeError("Gemini returned empty response")
    return result


def _call_gemini_image(prompt: str, image_bytes: bytes, mime_type: str) -> str:
    from concurrent.futures import ThreadPoolExecutor

    def _run():
        from gemini_client import ask_gemini_with_image
        return ask_gemini_with_image(prompt, image_bytes, mime_type)

    pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="gemini-img")
    future = pool.submit(_run)
    try:
        text = future.result(timeout=30.0)
        if not text:
            raise RuntimeError("Gemini image eval returned empty response")
        return text.strip()
    finally:
        pool.shutdown(wait=False, cancel_futures=True)


def evaluate_submission(
    step_title: str,
    instructions: str,
    evaluation_rubric: str,
    submission_type: str,
    content: str,
    max_xp: int,
    reference_url: str | None = None,
    storage_path: str | None = None,
) -> EvaluationResult:
    """Evaluate an employee submission using Gemini. Retries once on failure."""
    reference_section = _build_reference_section(reference_url)
    raw = ""
    last_error = None

    for attempt in range(2):
        try:
            if storage_path and submission_type in ("image", "file"):
                from app.services.challenge_upload import read_submission_file
                file_bytes, mime_type = read_submission_file(storage_path)
                if mime_type.startswith("image/"):
                    prompt = IMAGE_EVAL_PROMPT_TEMPLATE.format(
                        step_title=step_title,
                        instructions=instructions,
                        evaluation_rubric=evaluation_rubric,
                        reference_section=reference_section,
                        max_xp=max_xp,
                    )
                    raw = _call_gemini_image(prompt, file_bytes, mime_type)
                else:
                    prompt = EVAL_PROMPT_TEMPLATE.format(
                        step_title=step_title,
                        instructions=instructions,
                        evaluation_rubric=evaluation_rubric,
                        submission_type=submission_type,
                        content=content[:4000],
                        max_xp=max_xp,
                        reference_section=reference_section,
                    )
                    raw = _call_gemini_text(prompt)
            else:
                prompt = EVAL_PROMPT_TEMPLATE.format(
                    step_title=step_title,
                    instructions=instructions,
                    evaluation_rubric=evaluation_rubric,
                    submission_type=submission_type,
                    content=content[:4000],
                    max_xp=max_xp,
                    reference_section=reference_section,
                )
                raw = _call_gemini_text(prompt)

            data = _parse_json_response(raw)
            score = max(0, min(100, int(data.get("score", 0))))
            passed = bool(data.get("pass", False))
            feedback = str(data.get("feedback", "No feedback provided."))
            xp_awarded = _compute_xp(score, max_xp)
            return EvaluationResult(score=score, passed=passed, feedback=feedback, xp_awarded=xp_awarded, raw=raw)
        except Exception as e:
            last_error = e
            continue

    err_msg = str(last_error) if last_error else "unknown error"
    if "NO_API_KEY" in err_msg:
        return EvaluationResult(score=0, passed=False, feedback=MANUAL_REVIEW_FEEDBACK, xp_awarded=0, raw="NO_API_KEY")
    return EvaluationResult(score=0, passed=False, feedback=MANUAL_REVIEW_FEEDBACK, xp_awarded=0, raw=f"ERROR: {last_error}")

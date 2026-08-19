from __future__ import annotations
"""
Challenge Evaluator Service — AI-powered step submission grading.

Uses Google Gemini to evaluate employee submissions against a step's
evaluation rubric. Returns a structured score, pass/fail, feedback,
and XP awarded.

Scoring tiers (applied server-side):
  score >= 80  → full xp_value
  50 <= score < 80 → half xp_value
  score < 50   → 0 XP

The AI model pass threshold is 70 (consistent across all prompts).
"""

import json
import os
import re

# ─── Prompt Template ──────────────────────────────────────────
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


def _call_gemini(prompt: str, api_key: str) -> str:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        )
    )
    return response.text.strip() if response.text else "{}"


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


def evaluate_submission(
    step_title: str,
    instructions: str,
    evaluation_rubric: str,
    submission_type: str,
    content: str,
    max_xp: int,
    reference_url: str | None = None,
) -> EvaluationResult:
    """Evaluate an employee submission using Gemini. Retries once on failure."""
    from app.config import settings
    api_key = settings.GOOGLE_API_KEY or os.environ.get("GOOGLE_API_KEY", "")
    if not api_key:
        return EvaluationResult(score=0, passed=False, feedback=MANUAL_REVIEW_FEEDBACK, xp_awarded=0, raw="NO_API_KEY")

    prompt = EVAL_PROMPT_TEMPLATE.format(
        step_title=step_title,
        instructions=instructions,
        evaluation_rubric=evaluation_rubric,
        submission_type=submission_type,
        content=content[:4000],
        max_xp=max_xp,
        reference_section=_build_reference_section(reference_url),
    )

    raw = ""
    last_error = None
    for attempt in range(2):
        try:
            raw = _call_gemini(prompt, api_key)
            data = _parse_json_response(raw)
            score = max(0, min(100, int(data.get("score", 0))))
            passed = bool(data.get("pass", False))
            feedback = str(data.get("feedback", "No feedback provided."))
            xp_awarded = _compute_xp(score, max_xp)
            return EvaluationResult(score=score, passed=passed, feedback=feedback, xp_awarded=xp_awarded, raw=raw)
        except Exception as e:
            last_error = e
            continue

    return EvaluationResult(score=0, passed=False, feedback=MANUAL_REVIEW_FEEDBACK, xp_awarded=0, raw=f"ERROR: {last_error}")

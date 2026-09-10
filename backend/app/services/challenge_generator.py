from __future__ import annotations
"""
Challenge Generator — AI-powered challenge creation using Gemini.

Takes a goal, target skill, difficulty, duration, and style,
and generates a complete, high-quality challenge with steps.
"""

import json
import re

GENERATE_PROMPT = """\
You are a world-class corporate learning designer creating engaging, practical challenges
for employee development. Generate a challenge that feels like a real professional experience,
NOT like school homework.

REQUIREMENTS:
- Goal: {goal}
- Target Skill: {target_skill}
- Difficulty: {difficulty}
- Duration: {duration}
- Challenge Style: {style}

QUALITY RULES:
- Make it practical and realistic — simulate real workplace scenarios
- Include specific, measurable deliverables in each step
- Each step should build on the previous one
- Instructions must be detailed enough that an employee can complete them independently
- Evaluation rubrics must list concrete, checkable criteria
- XP values should reflect effort (Easy=100-200, Medium=200-400, Hard=400-600 per step)
- Generate 2-4 steps depending on duration
- For 15 min challenges: 2 steps. For 30 min: 3 steps. For 1 hour+: 3-4 steps.

EXAMPLES OF GOOD CHALLENGES:
- Communication: "Convert a complex project update into a 60-second executive briefing"
- Data Science: "Given a dataset, identify three anomalies and explain their likely causes"
- Programming: "Debug a deliberately broken piece of code, identify root cause, fix and explain"
- Leadership: "Evaluate a realistic workplace scenario and make a decision while explaining trade-offs"

BAD EXAMPLES (DO NOT generate these):
- "Write 500 words about communication"
- "List 10 things about leadership"
- "Read an article and summarize it"

Your response MUST be valid JSON only — no markdown fences, no extra text:
{{
  "title": "<catchy, professional title>",
  "description": "<engaging 2-3 sentence description that hooks the employee>",
  "learning_objective": "<what the employee will learn/demonstrate>",
  "target_skills": ["<skill1>", "<skill2>"],
  "category": "<Learning|Knowledge|Skill|Innovation|Engagement|Collaboration>",
  "difficulty": "{difficulty}",
  "estimated_minutes": <integer>,
  "bonus_badge": "<relevant emoji>",
  "color": "<hex color>",
  "success_criteria": "<what defines a successful completion>",
  "steps": [
    {{
      "title": "<step title>",
      "instructions": "<detailed instructions - at least 3-4 sentences>",
      "submission_type": "<text|code|link|file|image>",
      "evaluation_rubric": "<single string with specific criteria to grade against; use numbered lines, NOT a JSON array>",
      "xp_value": <integer>,
      "reference_url": null
    }}
  ]
}}
"""

HINT_PROMPT = """\
You are helping an employee who is stuck on a challenge step. Provide a progressive hint.

STEP TITLE: {step_title}
STEP INSTRUCTIONS: {instructions}
HINT LEVEL: {hint_level} (1=small conceptual hint, 2=more specific guidance, 3=strong guidance but NOT the answer)

RULES:
- Level 1: Give a conceptual nudge or question to think about. Do NOT give specifics.
- Level 2: Give more specific guidance — point them in the right direction.
- Level 3: Give strong guidance that nearly solves it, but still requires the employee to do the work.
- NEVER give the complete answer at any level.
- Keep hints to 2-3 sentences maximum.
- Be encouraging.

Your response MUST be valid JSON only:
{{"hint": "<your hint text>", "xp_penalty": {xp_penalty}}}
"""


def _parse_json_response(raw: str) -> dict:
    """Parse JSON from AI response, stripping markdown fences."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().strip("`").strip()
    return json.loads(cleaned)


def generate_challenge(
    goal: str,
    target_skill: str,
    difficulty: str = "Medium",
    duration: str = "30 min",
    style: str = "Practical task",
) -> dict:
    """
    Generate a complete challenge using Gemini AI.
    Returns a structured challenge ready for preview/save.
    """
    from app.services.gemini_safe import ask_gemini_timed

    prompt = GENERATE_PROMPT.format(
        goal=goal,
        target_skill=target_skill,
        difficulty=difficulty,
        duration=duration,
        style=style,
    )

    raw = ask_gemini_timed(prompt, timeout=30.0, fallback="")
    if not raw:
        return {"error": "AI generation timed out. Please try again."}

    try:
        data = _parse_json_response(raw)
    except (json.JSONDecodeError, ValueError) as e:
        return {"error": f"Failed to parse AI response: {str(e)}"}

    # Validate required fields
    required = ["title", "description", "steps"]
    for field in required:
        if field not in data:
            return {"error": f"AI response missing required field: {field}"}

    if not data["steps"] or len(data["steps"]) == 0:
        return {"error": "AI generated a challenge with no steps."}

    # Sanitize and set defaults
    data.setdefault("category", "Learning")
    data.setdefault("difficulty", difficulty)
    data.setdefault("bonus_badge", "🎯")
    data.setdefault("color", "#7c3aed")
    data.setdefault("estimated_minutes", 30)
    data.setdefault("learning_objective", "")
    data.setdefault("target_skills", [target_skill] if target_skill else [])
    data.setdefault("success_criteria", "")

    # Sanitize steps
    for i, step in enumerate(data["steps"]):
        step.setdefault("title", f"Step {i + 1}")
        step.setdefault("instructions", "")
        step.setdefault("submission_type", "text")
        step.setdefault("evaluation_rubric", "Evaluate the submission for completeness and quality.")
        step.setdefault("xp_value", 200)
        step.setdefault("reference_url", None)
        step["step_order"] = i + 1
        # Clamp XP
        try:
            step["xp_value"] = max(50, min(1000, int(step["xp_value"])))
        except Exception:
            step["xp_value"] = 200

        # Gemini sometimes returns arrays/objects for text fields
        for key in ("title", "instructions", "submission_type", "evaluation_rubric"):
            val = step.get(key)
            if isinstance(val, list):
                step[key] = "\n".join(
                    str(item.get("criterion") or item.get("text") or item.get("description") or item)
                    if isinstance(item, dict) else str(item)
                    for item in val
                )
            elif isinstance(val, dict):
                step[key] = str(val.get("text") or val.get("description") or json.dumps(val))
            elif val is None:
                step[key] = ""
            else:
                step[key] = str(val)

        if step.get("reference_url") is not None and not isinstance(step["reference_url"], str):
            step["reference_url"] = str(step["reference_url"]) or None
        if isinstance(step.get("reference_url"), str) and not step["reference_url"].strip():
            step["reference_url"] = None

    # Compute total XP
    data["total_xp"] = sum(s["xp_value"] for s in data["steps"])

    return data


def generate_hint(
    step_title: str,
    instructions: str,
    hint_level: int = 1,
    max_xp: int = 200,
) -> dict:
    """
    Generate a progressive hint for a challenge step.
    hint_level: 1 (small), 2 (medium), 3 (strong).
    Returns: {"hint": "...", "xp_penalty": N}
    """
    from app.services.gemini_safe import ask_gemini_timed

    # XP penalty increases with hint level
    xp_penalty = {1: 20, 2: 40, 3: 60}.get(hint_level, 20)
    actual_penalty = min(xp_penalty, max_xp // 4)  # Never more than 25% of step XP

    prompt = HINT_PROMPT.format(
        step_title=step_title,
        instructions=instructions,
        hint_level=hint_level,
        xp_penalty=actual_penalty,
    )

    raw = ask_gemini_timed(prompt, timeout=15.0, fallback="")
    if not raw:
        # Fallback hints if AI fails
        fallback_hints = {
            1: "Take a step back and think about the core objective of this task. What's the most important thing to address first?",
            2: "Try breaking the problem into smaller parts. Focus on one aspect at a time rather than trying to solve everything at once.",
            3: "You're close! Review the instructions carefully and make sure each requirement is explicitly addressed in your submission.",
        }
        return {
            "hint": fallback_hints.get(hint_level, fallback_hints[1]),
            "xp_penalty": actual_penalty,
            "hint_level": hint_level,
        }

    try:
        data = _parse_json_response(raw)
        return {
            "hint": data.get("hint", "Think carefully about the core requirements."),
            "xp_penalty": actual_penalty,
            "hint_level": hint_level,
        }
    except (json.JSONDecodeError, ValueError):
        return {
            "hint": raw[:500],
            "xp_penalty": actual_penalty,
            "hint_level": hint_level,
        }

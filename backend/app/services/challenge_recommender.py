from __future__ import annotations
"""
Challenge Recommender — Personalized challenge recommendations
based on the employee's Digital Twin data.

Reads from: skills, career_goals, challenge_progress, submissions,
evaluations, projects, certifications.

Returns ranked recommendations with reasons.
"""

import json
from datetime import datetime, timezone, timedelta
from supabase import Client


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_recommendations(sb: Client, employee_id: str, limit: int = 6) -> dict:
    """
    Generate personalized challenge recommendations for an employee.

    Returns:
        {
            "recommendations": [...],
            "coach_insight": "...",
            "focus_skills": [...]
        }
    """
    # ── Gather employee Digital Twin data ──
    twin = _gather_twin_data(sb, employee_id)

    # ── Get available challenges ──
    challenges = _get_available_challenges(sb, employee_id)

    if not challenges:
        return {
            "recommendations": [],
            "coach_insight": "No active challenges available right now. Check back soon!",
            "focus_skills": [],
        }

    # ── Score each challenge ──
    scored = []
    for ch in challenges:
        score_info = _score_challenge(ch, twin)
        if score_info["score"] > 0:
            scored.append({**ch, **score_info})

    # Sort by score descending
    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:limit]

    # ── Build recommendations ──
    recommendations = []
    for ch in top:
        recommendations.append({
            "challenge_id": ch["id"],
            "title": ch["title"],
            "description": ch.get("description", ""),
            "difficulty": ch.get("difficulty", "Medium"),
            "category": ch.get("category", ""),
            "color": ch.get("color", "#6366f1"),
            "bonus_badge": ch.get("bonus_badge", "🎯"),
            "xp_reward": ch.get("xp_reward", 0),
            "estimated_minutes": ch.get("estimated_minutes"),
            "days_left": ch.get("days_left", 0),
            "why_recommended": ch["why_recommended"],
            "target_skill": ch.get("target_skill"),
            "current_skill_level": ch.get("current_skill_level"),
            "target_skill_level": ch.get("target_skill_level"),
            "relevance_score": round(ch["score"], 1),
            "difficulty_match": ch.get("difficulty_match", "appropriate"),
            "expected_outcome": ch.get("expected_outcome", ""),
        })

    # ── Generate coach insight ──
    coach_insight = _generate_coach_insight(twin)

    # ── Focus skills ──
    focus_skills = _get_focus_skills(twin)

    return {
        "recommendations": recommendations,
        "coach_insight": coach_insight,
        "focus_skills": focus_skills,
    }


def _gather_twin_data(sb: Client, employee_id: str) -> dict:
    """Gather all relevant Digital Twin data for scoring."""
    twin: dict = {"employee_id": employee_id}

    # Employee info
    emp_res = sb.table("employees").select(
        "full_name, role, department, years_experience"
    ).eq("id", employee_id).execute()
    twin["employee"] = emp_res.data[0] if emp_res.data else {}

    # Skills with proficiency and targets
    skills_res = sb.table("skills").select(
        "name, category, proficiency, target_level, trend, ai_recommendation"
    ).eq("employee_id", employee_id).execute()
    twin["skills"] = skills_res.data or []

    # Skill map for quick lookup
    twin["skill_map"] = {
        s["name"].lower(): s for s in twin["skills"]
    }

    # Career goal
    goal_res = sb.table("career_goals").select(
        "target_role, timeline, focus_area, readiness_score"
    ).eq("employee_id", employee_id).eq("is_active", True).limit(1).execute()
    twin["career_goal"] = goal_res.data[0] if goal_res.data else None

    # Challenge history — completed challenges
    completed_res = sb.table("challenge_progress").select(
        "challenge_id, completed, progress"
    ).eq("employee_id", employee_id).execute()
    twin["completed_challenges"] = {
        r["challenge_id"]: r for r in (completed_res.data or [])
    }
    twin["completed_count"] = sum(
        1 for r in (completed_res.data or []) if r.get("completed")
    )

    # Recent evaluation scores (last 20)
    try:
        subs_res = sb.table("submissions").select(
            "id, challenge_id, step_id"
        ).eq("employee_id", employee_id).order(
            "submitted_at", desc=True
        ).limit(20).execute()

        eval_scores = []
        for sub in (subs_res.data or []):
            ev_res = sb.table("evaluations").select(
                "ai_score, pass"
            ).eq("submission_id", sub["id"]).limit(1).execute()
            if ev_res.data:
                eval_scores.append(ev_res.data[0])
        twin["recent_scores"] = eval_scores
    except Exception:
        twin["recent_scores"] = []

    # Average score
    scores = [e["ai_score"] for e in twin["recent_scores"] if e.get("ai_score")]
    twin["avg_score"] = sum(scores) / len(scores) if scores else None
    twin["pass_rate"] = (
        sum(1 for e in twin["recent_scores"] if e.get("pass")) / len(twin["recent_scores"])
        if twin["recent_scores"] else None
    )

    # Projects
    proj_res = sb.table("projects").select(
        "name, technologies, status, domain"
    ).eq("employee_id", employee_id).limit(10).execute()
    twin["projects"] = proj_res.data or []

    # Gamification profile
    gam_res = sb.table("gamification_profiles").select(
        "level, xp, streak_days, total_xp_earned"
    ).eq("employee_id", employee_id).execute()
    twin["gam_profile"] = gam_res.data[0] if gam_res.data else {}

    return twin


def _get_available_challenges(sb: Client, employee_id: str) -> list:
    """Get active challenges not yet completed by this employee."""
    challenges_res = sb.table("challenges").select("*").eq(
        "is_active", True
    ).execute()
    all_challenges = challenges_res.data or []

    # Get completed challenge IDs
    completed_res = sb.table("challenge_progress").select(
        "challenge_id"
    ).eq("employee_id", employee_id).eq("completed", True).execute()
    completed_ids = {r["challenge_id"] for r in (completed_res.data or [])}

    now = _utc_now()
    available = []
    for ch in all_challenges:
        if ch["id"] in completed_ids:
            continue
        # Check deadline
        end_date = ch.get("end_date")
        days_left = 999
        if end_date:
            try:
                ed = datetime.fromisoformat(end_date)
                if ed.tzinfo is None:
                    ed = ed.replace(tzinfo=timezone.utc)
                days_left = max(0, (ed - now).days)
                if days_left == 0:
                    continue  # expired
            except (ValueError, TypeError):
                pass
        ch["days_left"] = days_left
        available.append(ch)

    return available


def _score_challenge(challenge: dict, twin: dict) -> dict:
    """
    Score a challenge for relevance to this employee.

    Returns dict with: score, why_recommended, target_skill, etc.
    """
    score = 10.0  # base score for any active challenge
    reasons = []
    target_skill = None
    current_level = None
    target_level = None
    expected_outcome = ""
    difficulty_match = "appropriate"

    ch_category = (challenge.get("category") or "").lower()
    ch_title = (challenge.get("title") or "").lower()
    ch_desc = (challenge.get("description") or "").lower()
    ch_difficulty = (challenge.get("difficulty") or "Medium")
    ch_target_skills = challenge.get("target_skills") or []

    # Normalize target skills from challenge
    if isinstance(ch_target_skills, str):
        try:
            ch_target_skills = json.loads(ch_target_skills)
        except (json.JSONDecodeError, TypeError):
            ch_target_skills = []

    ch_skill_names = [s.lower() if isinstance(s, str) else s.get("name", "").lower() for s in ch_target_skills]

    # ── 1. Skill gap alignment (biggest weight) ──
    for skill in twin.get("skills", []):
        s_name = skill["name"].lower()
        s_prof = skill.get("proficiency") or 0
        s_target = skill.get("target_level") or 0

        # Check if challenge matches this skill
        skill_match = (
            s_name in ch_title or
            s_name in ch_desc or
            s_name in ch_skill_names or
            (skill.get("category") or "").lower() in ch_category
        )

        if skill_match:
            gap = max(0, s_target - s_prof)

            if gap > 0:
                # Skill has a gap — highly relevant
                score += 25 + (gap * 3)
                reasons.append(
                    f"Helps close your {skill['name']} skill gap "
                    f"(currently {s_prof}%, target {s_target}%)"
                )
                target_skill = skill["name"]
                current_level = s_prof
                target_level = s_target
                expected_outcome = f"Improve {skill['name']} toward {s_target}%"
            elif s_prof < 80:
                # Skill exists but not maxed
                score += 15
                reasons.append(
                    f"Strengthen your {skill['name']} skills ({s_prof}% proficiency)"
                )
                if not target_skill:
                    target_skill = skill["name"]
                    current_level = s_prof
            break  # Use strongest match

    # ── 2. Career goal alignment ──
    career = twin.get("career_goal")
    if career:
        target_role = (career.get("target_role") or "").lower()
        focus_area = (career.get("focus_area") or "").lower()

        if target_role and (target_role in ch_title or target_role in ch_desc):
            score += 20
            reasons.append(
                f"Aligned with your career goal: {career['target_role']}"
            )

        if focus_area and (focus_area in ch_title or focus_area in ch_desc or focus_area in ch_category):
            score += 15
            reasons.append(f"Matches your focus area: {career['focus_area']}")

    # ── 3. Difficulty matching ──
    avg_score = twin.get("avg_score")
    if avg_score is not None:
        if avg_score >= 85 and ch_difficulty == "Easy":
            score -= 10
            difficulty_match = "too_easy"
        elif avg_score >= 85 and ch_difficulty == "Hard":
            score += 10
            difficulty_match = "growth"
            reasons.append("You're ready for a harder challenge based on your recent scores")
        elif avg_score < 60 and ch_difficulty == "Hard":
            score -= 15
            difficulty_match = "too_hard"
        elif avg_score < 60 and ch_difficulty == "Easy":
            score += 10
            difficulty_match = "supportive"
            reasons.append("Designed to build your confidence with recent skill areas")
        else:
            score += 5
            difficulty_match = "appropriate"

    # ── 4. Project relevance ──
    for proj in twin.get("projects", []):
        techs = proj.get("technologies") or []
        if isinstance(techs, str):
            try:
                techs = json.loads(techs)
            except (json.JSONDecodeError, TypeError):
                techs = []
        for tech in techs:
            t = tech.lower() if isinstance(tech, str) else ""
            if t and (t in ch_title or t in ch_desc):
                score += 8
                reasons.append(f"Relevant to your project: {proj['name']}")
                break

    # ── 5. Freshness / urgency ──
    days_left = challenge.get("days_left", 999)
    if days_left <= 3:
        score += 5
        reasons.append("⏰ Ending soon — complete before deadline")
    elif days_left <= 7:
        score += 2

    # ── 6. Repetition penalty ──
    progress = twin.get("completed_challenges", {}).get(challenge["id"])
    if progress and progress.get("progress", 0) > 0:
        # Already started — boost to encourage completion
        score += 12
        reasons.append(f"You've already started this challenge ({progress['progress']}% done)")

    # ── 7. Streak bonus ──
    streak = twin.get("gam_profile", {}).get("streak_days", 0)
    if streak >= 3:
        score += 3
        if not any("streak" in r.lower() for r in reasons):
            reasons.append(f"🔥 Keep your {streak}-day streak alive!")

    # Default reason if none found
    if not reasons:
        reasons.append("Recommended based on your profile and activity")

    return {
        "score": max(0, score),
        "why_recommended": reasons[0],  # Primary reason
        "all_reasons": reasons,
        "target_skill": target_skill,
        "current_skill_level": current_level,
        "target_skill_level": target_level,
        "expected_outcome": expected_outcome,
        "difficulty_match": difficulty_match,
    }


def _generate_coach_insight(twin: dict) -> str:
    """Generate a personalized coaching insight from Digital Twin data."""
    parts = []

    name = twin.get("employee", {}).get("full_name", "").split()[0] or "there"

    # Skill gaps
    gaps = []
    for s in twin.get("skills", []):
        prof = s.get("proficiency") or 0
        target = s.get("target_level") or 0
        if target > prof and (target - prof) >= 10:
            gaps.append((s["name"], target - prof))
    gaps.sort(key=lambda x: x[1], reverse=True)

    if gaps:
        top_gaps = gaps[:2]
        skill_list = " and ".join(g[0] for g in top_gaps)
        parts.append(f"Hi {name}! Based on your Digital Twin, I recommend focusing on {skill_list} this week.")

    # Career goal
    career = twin.get("career_goal")
    if career and career.get("target_role"):
        readiness = career.get("readiness_score", 0)
        parts.append(
            f"Your career goal is {career['target_role']} "
            f"(readiness: {readiness}%). "
            f"Challenge completions directly boost your readiness score."
        )

    # Performance trend
    avg = twin.get("avg_score")
    if avg is not None:
        if avg >= 85:
            parts.append("Your recent challenge scores are excellent — consider tackling harder challenges!")
        elif avg >= 70:
            parts.append("You're performing well. Keep up the momentum!")
        elif avg > 0:
            parts.append("Focus on the recommended challenges below to strengthen areas where you scored lower.")

    # Streak
    streak = twin.get("gam_profile", {}).get("streak_days", 0)
    if streak >= 7:
        parts.append(f"Amazing {streak}-day streak! 🔥")
    elif streak >= 3:
        parts.append(f"Nice {streak}-day streak — keep it going!")

    if not parts:
        parts.append(
            f"Hi {name}! Complete challenges below to earn XP, "
            f"improve your skills, and advance your career."
        )

    return " ".join(parts)


def _get_focus_skills(twin: dict) -> list:
    """Return top skills the employee should focus on."""
    focus = []
    for s in twin.get("skills", []):
        prof = s.get("proficiency") or 0
        target = s.get("target_level") or 0
        gap = max(0, target - prof)
        if gap > 0 or prof < 70:
            focus.append({
                "name": s["name"],
                "category": s.get("category", ""),
                "proficiency": prof,
                "target": target,
                "gap": gap,
                "trend": s.get("trend", "stable"),
            })
    focus.sort(key=lambda x: x["gap"], reverse=True)
    return focus[:6]


def get_skill_progress(sb: Client, employee_id: str) -> list:
    """
    Get skill progress data derived from challenge completions.
    Shows skills, current proficiency, and how challenges have contributed.
    """
    # Get employee skills
    skills_res = sb.table("skills").select(
        "name, category, proficiency, target_level, trend"
    ).eq("employee_id", employee_id).order("proficiency", desc=True).execute()
    skills = skills_res.data or []

    # Get challenge completion count
    completed_res = sb.table("challenge_progress").select(
        "challenge_id"
    ).eq("employee_id", employee_id).eq("completed", True).execute()
    completed_count = len(completed_res.data or [])

    # Get recent evaluation scores for context
    subs_res = sb.table("submissions").select("id").eq(
        "employee_id", employee_id
    ).order("submitted_at", desc=True).limit(10).execute()

    recent_pass_count = 0
    for sub in (subs_res.data or []):
        ev = sb.table("evaluations").select("pass").eq(
            "submission_id", sub["id"]
        ).limit(1).execute()
        if ev.data and ev.data[0].get("pass"):
            recent_pass_count += 1

    result = []
    for s in skills[:8]:  # Top 8 skills
        prof = s.get("proficiency") or 0
        target = s.get("target_level") or 0
        level_label = (
            "Beginner" if prof < 30 else
            "Intermediate" if prof < 60 else
            "Advanced" if prof < 85 else
            "Expert"
        )
        result.append({
            "name": s["name"],
            "category": s.get("category", ""),
            "proficiency": prof,
            "target": target,
            "trend": s.get("trend", "stable"),
            "level_label": level_label,
            "gap_pct": max(0, target - prof) if target > 0 else 0,
        })

    return result

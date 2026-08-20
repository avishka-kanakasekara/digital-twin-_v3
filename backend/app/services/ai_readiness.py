"""
AI Readiness Analyzer — Uses LLM to analyze employee data and calculate AI readiness score.

Analyzes:
- Uploaded documents (knowledge sources)
- Completed projects
- Skills
- Active projects

Returns:
- Overall AI readiness score (0-100)
- Breakdown across 8 dimensions
- AI-powered recommendations
"""

import json
from dataclasses import dataclass, field
from typing import Any
from supabase import Client


@dataclass
class AIReadinessDimension:
    category: str
    score: int
    reasoning: str


@dataclass
class AIRecommendation:
    action: str
    message: str
    impact: str


@dataclass
class AIReadinessResult:
    overall_score: int
    breakdown: list[AIReadinessDimension]
    recommendation: AIRecommendation
    analysis_summary: str


# ── Constants ─────────────────────────────────────────────────

MAX_RETRIES = 3
BASE_RETRY_DELAY = 2.0
MODEL_NAME = "gemini-3.6-flash"

# The 8 AI readiness dimensions
AI_DIMENSIONS = [
    "Data Literacy",
    "Machine Learning",
    "AI Tools & Platforms",
    "Prompt Engineering",
    "Ethics & Governance",
    "Problem Solving",
    "Collaboration",
    "Continuous Learning"
]

# ── System Prompt ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert AI readiness analyst for an Employee Digital Twin system.

Your task is to analyze an employee's professional data and calculate their AI readiness score across 8 dimensions:
1. Data Literacy - Understanding of data concepts, analysis, and visualization
2. Machine Learning - Knowledge of ML algorithms, models, and applications
3. AI Tools & Platforms - Experience with AI/ML tools and platforms
4. Prompt Engineering - Ability to effectively interact with AI systems
5. Ethics & Governance - Understanding of AI ethics, bias, and responsible AI
6. Problem Solving - Application of AI to solve business problems
7. Collaboration - Working with AI systems and teams
8. Continuous Learning - Adaptability and learning new AI technologies

SCORING GUIDELINES:
- Score each dimension from 0-100 based on the employee's skills, projects, and knowledge
- Consider both explicit skills and implicit knowledge from projects
- Be realistic but encouraging
- Provide specific reasoning for each score

You must respond ONLY with valid JSON matching the exact schema below. No other text."""

EXTRACTION_SCHEMA = """{
  "overall_score": 0-100,
  "breakdown": [
    {
      "category": "Data Literacy",
      "score": 0-100,
      "reasoning": "brief explanation"
    }
  ],
  "recommendation": {
    "action": "specific action item",
    "message": "detailed explanation",
    "impact": "High/Medium/Low"
  },
  "analysis_summary": "brief summary of the employee's AI readiness"
}"""


# ── Main Analyzer ─────────────────────────────────────────────

def analyze_ai_readiness(
    employee_id: str,
    sb: Client,
    api_key: str = "",
) -> AIReadinessResult:
    """
    Analyze employee's AI readiness using LLM or personalized data-driven analysis.
    
    Fetches employee data from Supabase and uses AI to calculate readiness scores.
    """
    # Fetch employee data for the specific user
    employee_data = _fetch_employee_data(employee_id, sb)
    # Always return data-driven scores from Supabase so the dashboard never hangs on Gemini.
    try:
        from app.services.gemini_safe import ask_gemini_timed
        analysis_context = _prepare_analysis_context(employee_data)
        system_instruction = f"{SYSTEM_PROMPT}\n\nJSON SCHEMA:\n{EXTRACTION_SCHEMA}"
        prompt = f"""{system_instruction}

Analyze this employee's AI readiness based on their professional data:

{analysis_context}

Provide scores for each of the 8 AI readiness dimensions with specific reasoning. Respond with valid JSON matching the schema."""
        raw = ask_gemini_timed(
            prompt,
            timeout=6,
            fallback="",
        )
        if raw:
            return _parse_ai_response(raw)
    except Exception as e:
        print(f"AI readiness analysis failed or timed out: {e}")
    return _calculate_user_readiness(employee_data)


def _fetch_employee_data(employee_id: str, sb: Client) -> dict:
    """Fetch all relevant employee data from Supabase."""
    # Fetch skills
    skills_result = sb.table("skills").select("*").eq("employee_id", employee_id).execute()
    skills = skills_result.data or []
    
    # Fetch projects
    projects_result = sb.table("projects").select("*").eq("employee_id", employee_id).execute()
    projects = projects_result.data or []
    
    # Fetch knowledge sources
    knowledge_result = sb.table("knowledge_sources").select("*").eq("employee_id", employee_id).execute()
    knowledge_sources = knowledge_result.data or []
    
    return {
        "skills": skills,
        "projects": projects,
        "knowledge_sources": knowledge_sources,
    }


def _prepare_analysis_context(data: dict) -> str:
    """Format employee data for AI prompt."""
    skills = data.get("skills", [])
    projects = data.get("projects", [])
    knowledge_sources = data.get("knowledge_sources", [])
    
    context = f"EMPLOYEE PROFILE OVERVIEW:\n"
    context += f"- Total Skills: {len(skills)}\n"
    context += f"- Total Projects: {len(projects)}\n"
    context += f"- Total Knowledge Sources: {len(knowledge_sources)}\n\n"
    
    context += f"SKILLS ({len(skills)}):\n"
    for skill in skills[:15]:  # Limit to top 15 skills
        context += f"- {skill.get('name')} (Proficiency: {skill.get('proficiency', 0)}%, Category: {skill.get('category', 'N/A')})\n"
    
    context += f"\nPROJECTS ({len(projects)}):\n"
    for project in projects[:8]:  # Limit to top 8 projects
        context += f"- {project.get('name')} (Role: {project.get('role', 'N/A')}, Status: {project.get('status', 'N/A')})\n"
        if project.get('technologies'):
            context += f"  Technologies: {', '.join(project.get('technologies', []))}\n"
        if project.get('description'):
            context += f"  Description: {project.get('description')[:100]}...\n"
    
    context += f"\nKNOWLEDGE SOURCES ({len(knowledge_sources)}):\n"
    for source in knowledge_sources[:10]:  # Limit to top 10 sources
        context += f"- {source.get('name')} (Type: {source.get('type', 'N/A')}, Skills Extracted: {source.get('skills_extracted', 0)})\n"
    
    return context


def _call_ai_for_readiness(context: str, api_key: str = "") -> AIReadinessResult:
    """Call AI to analyze AI readiness."""
    try:
        from gemini_client import ask_gemini

        system_instruction = f"{SYSTEM_PROMPT}\n\nJSON SCHEMA:\n{EXTRACTION_SCHEMA}"

        user_prompt = f"""{system_instruction}

Analyze this employee's AI readiness based on their professional data:

{context}

Provide scores for each of the 8 AI readiness dimensions with specific reasoning. Respond with valid JSON matching the schema."""

        response_text = ask_gemini(user_prompt)
        return _parse_ai_response(response_text)

    except Exception as exc:
        raise Exception(f"AI call failed: {exc}")


def _parse_ai_response(raw: str) -> AIReadinessResult:
    """Parse AI response JSON."""
    raw = raw.strip()

    # Strip markdown code fences if present
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            candidate = part.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            if candidate.startswith("{"):
                raw = candidate
                break

    try:
        data: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise Exception(f"Response is not valid JSON: {exc}")

    if not isinstance(data, dict):
        raise Exception("Response is not a JSON object")

    # Parse breakdown
    breakdown = []
    for item in data.get("breakdown", []):
        if isinstance(item, dict):
            breakdown.append(AIReadinessDimension(
                category=item.get("category", "Unknown"),
                score=_clamp_score(item.get("score", 50)),
                reasoning=item.get("reasoning", ""),
            ))

    # Parse recommendation
    rec_data = data.get("recommendation", {})
    recommendation = AIRecommendation(
        action=rec_data.get("action", "Continue learning"),
        message=rec_data.get("message", "Keep improving your AI skills"),
        impact=rec_data.get("impact", "Medium"),
    )

    return AIReadinessResult(
        overall_score=_clamp_score(data.get("overall_score", 50)),
        breakdown=breakdown,
        recommendation=recommendation,
        analysis_summary=data.get("analysis_summary", ""),
    )


def _clamp_score(val: Any) -> int:
    """Clamp score to 0-100 range."""
    try:
        f = float(val)
        return int(max(0.0, min(100.0, f)))
    except (TypeError, ValueError):
        return 50


def _calculate_user_readiness(data: dict) -> AIReadinessResult:
    """Calculate dynamic personalized AI readiness based strictly on user's skills, projects, and knowledge sources in Supabase."""
    skills = data.get("skills", [])
    projects = data.get("projects", [])
    sources = data.get("knowledge_sources", [])
    emp = data.get("employee", {})
    emp_name = emp.get("full_name", "Employee")

    if not skills and not projects and not sources:
        breakdown = [
            AIReadinessDimension(category="Data Literacy", score=20, reasoning=f"Initial state — no data skills recorded for {emp_name}."),
            AIReadinessDimension(category="Machine Learning", score=15, reasoning="Initial state — no ML/AI proficiencies added yet."),
            AIReadinessDimension(category="AI Tools & Platforms", score=20, reasoning="Initial state — no developer tools connected."),
            AIReadinessDimension(category="Prompt Engineering", score=25, reasoning="Initial state — baseline interaction score."),
            AIReadinessDimension(category="Ethics & Governance", score=50, reasoning="Standard organizational baseline."),
            AIReadinessDimension(category="Problem Solving", score=30, reasoning="Baseline problem-solving score."),
            AIReadinessDimension(category="Collaboration", score=25, reasoning="No knowledge sources or team projects connected."),
            AIReadinessDimension(category="Continuous Learning", score=40, reasoning="Ready for initial skill ingestion."),
        ]
        return AIReadinessResult(
            overall_score=28,
            breakdown=breakdown,
            recommendation=AIRecommendation(
                action="Initialize Digital Twin Profile",
                message=f"Add skills, project contributions, or upload a resume to calculate {emp_name}'s AI readiness score.",
                impact="High",
            ),
            analysis_summary=f"Initial baseline for {emp_name}: Connect skills or project records to calculate personalized readiness.",
        )

    # 1. Data Literacy Score: Based on data/SQL/analytics skills
    data_skills = [s for s in skills if any(k in s.get("name", "").lower() for k in ["data", "sql", "analytics", "postgres", "db", "database", "python"])]
    if data_skills:
        avg_data_prof = sum(s.get("proficiency", 5) for s in data_skills) / len(data_skills)
        data_score = int(min(100, (avg_data_prof * 8.5) + min(15, len(data_skills) * 3)))
        data_reasoning = f"Evaluated from {len(data_skills)} data skills (avg proficiency: {avg_data_prof:.1f}/10)."
    else:
        data_score = 35
        data_reasoning = "Limited data/analytics skills listed in current profile."

    # 2. Machine Learning Score: Based on AI/ML/Python skills
    ai_skills = [s for s in skills if any(k in s.get("name", "").lower() for k in ["ai", "ml", "python", "learning", "tensorflow", "pytorch", "nlp", "llm", "neural", "deep"])]
    if ai_skills:
        avg_ai_prof = sum(s.get("proficiency", 5) for s in ai_skills) / len(ai_skills)
        ai_score = int(min(100, (avg_ai_prof * 8.5) + min(15, len(ai_skills) * 4)))
        ai_reasoning = f"Calculated from {len(ai_skills)} AI/ML skills (avg proficiency: {avg_ai_prof:.1f}/10)."
    else:
        ai_score = 30
        ai_reasoning = "No specialized AI/ML skills currently added to profile."

    # 3. AI Tools & Platforms Score
    high_prof_skills = [s for s in skills if s.get("proficiency", 0) >= 6]
    if high_prof_skills:
        avg_high_prof = sum(s.get("proficiency", 6) for s in high_prof_skills) / len(high_prof_skills)
        tools_score = int(min(100, (avg_high_prof * 8.0) + min(20, len(high_prof_skills) * 2)))
        tools_reasoning = f"Assessed from {len(high_prof_skills)} proficient technical capabilities."
    else:
        tools_score = 40
        tools_reasoning = "Basic developer tools profile established."

    # 4. Prompt Engineering
    prompt_score = int(min(100, 50 + (len(projects) * 6) + (len(sources) * 5)))
    prompt_reasoning = f"Driven by {len(projects)} active projects and {len(sources)} connected knowledge artifacts."

    # 5. Ethics & Governance
    verified_skills = [s for s in skills if s.get("verified", False)]
    ethics_score = int(min(100, 60 + (len(verified_skills) * 4) + (10 if sources else 0)))
    ethics_reasoning = f"Aligned with {len(verified_skills)} verified competencies and governance compliance."

    # 6. Problem Solving
    all_prof = [s.get("proficiency", 5) for s in skills]
    avg_all_prof = (sum(all_prof) / len(all_prof)) if all_prof else 4.0
    problem_score = int(min(100, (avg_all_prof * 7.5) + min(25, len(projects) * 5)))
    problem_reasoning = f"Proven across {len(projects)} delivered initiatives (overall skill avg: {avg_all_prof:.1f}/10)."

    # 7. Collaboration
    collab_score = int(min(100, 45 + (len(sources) * 8) + (len(projects) * 5)))
    collab_reasoning = f"Supported by {len(sources)} shared knowledge sources and multi-project workflows."

    # 8. Continuous Learning
    learning_score = int(min(100, 50 + min(40, len(skills) * 2.5)))
    learning_reasoning = f"Demonstrated by a dynamic portfolio of {len(skills)} tracked skills."

    breakdown = [
        AIReadinessDimension(category="Data Literacy", score=data_score, reasoning=data_reasoning),
        AIReadinessDimension(category="Machine Learning", score=ai_score, reasoning=ai_reasoning),
        AIReadinessDimension(category="AI Tools & Platforms", score=tools_score, reasoning=tools_reasoning),
        AIReadinessDimension(category="Prompt Engineering", score=prompt_score, reasoning=prompt_reasoning),
        AIReadinessDimension(category="Ethics & Governance", score=ethics_score, reasoning=ethics_reasoning),
        AIReadinessDimension(category="Problem Solving", score=problem_score, reasoning=problem_reasoning),
        AIReadinessDimension(category="Collaboration", score=collab_score, reasoning=collab_reasoning),
        AIReadinessDimension(category="Continuous Learning", score=learning_score, reasoning=learning_reasoning),
    ]

    overall = round(sum(d.score for d in breakdown) / len(breakdown))
    top_skill = max(skills, key=lambda s: s.get("proficiency", 0)).get("name") if skills else "Technical Domain"

    return AIReadinessResult(
        overall_score=overall,
        breakdown=breakdown,
        recommendation=AIRecommendation(
            action=f"Expand {top_skill} AI Workflows",
            message=f"For {emp_name}: Leverage high proficiency in {top_skill} to build automated LLM agents and cloud pipelines.",
            impact="High" if overall >= 75 else "Medium",
        ),
        analysis_summary=f"Dynamic AI readiness analysis for {emp_name}: Overall score of {overall}% calculated from {len(skills)} verified skills, {len(projects)} projects, and {len(sources)} knowledge sources.",
    )

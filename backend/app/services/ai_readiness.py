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
MODEL_NAME = "gemini-flash-latest"

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
    api_key: str,
) -> AIReadinessResult:
    """
    Analyze employee's AI readiness using LLM.
    
    Fetches employee data from Supabase and uses AI to calculate readiness scores.
    """
    if not api_key:
        # Return default scores if AI not configured
        return _get_default_readiness()

    # Fetch employee data
    employee_data = _fetch_employee_data(employee_id, sb)
    
    # Prepare analysis context
    analysis_context = _prepare_analysis_context(employee_data)
    
    # Call AI for analysis
    try:
        ai_result = _call_ai_for_readiness(analysis_context, api_key)
        return ai_result
    except Exception as e:
        print(f"AI readiness analysis failed: {e}")
        return _get_default_readiness()


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
    
    # Fetch employee profile
    employee_result = sb.table("employees").select("*").eq("id", employee_id).execute()
    employee = employee_result.data[0] if employee_result.data else {}
    
    return {
        "employee": employee,
        "skills": skills,
        "projects": projects,
        "knowledge_sources": knowledge_sources,
    }


def _prepare_analysis_context(data: dict) -> str:
    """Prepare the analysis context for the AI."""
    employee = data.get("employee", {})
    skills = data.get("skills", [])
    projects = data.get("projects", [])
    knowledge_sources = data.get("knowledge_sources", [])
    
    context = f"""
EMPLOYEE PROFILE:
- Name: {employee.get('full_name', 'Unknown')}
- Role: {employee.get('role', 'Unknown')}
- Department: {employee.get('department', 'Unknown')}
- Years of Experience: {employee.get('years_experience', 'Unknown')}

SKILLS ({len(skills)}):
"""
    for skill in skills[:20]:  # Limit to top 20 skills
        context += f"- {skill.get('name')} (Proficiency: {skill.get('proficiency', 'N/A')}, Category: {skill.get('category', 'N/A')})\n"
    
    context += f"\nPROJECTS ({len(projects)}):\n"
    for project in projects[:10]:  # Limit to top 10 projects
        context += f"- {project.get('name')} (Role: {project.get('role', 'N/A')}, Status: {project.get('status', 'N/A')})\n"
        if project.get('technologies'):
            context += f"  Technologies: {', '.join(project.get('technologies', []))}\n"
        if project.get('description'):
            context += f"  Description: {project.get('description')[:100]}...\n"
    
    context += f"\nKNOWLEDGE SOURCES ({len(knowledge_sources)}):\n"
    for source in knowledge_sources[:10]:  # Limit to top 10 sources
        context += f"- {source.get('name')} (Type: {source.get('type', 'N/A')}, Skills Extracted: {source.get('skills_extracted', 0)})\n"
    
    return context


def _call_ai_for_readiness(context: str, api_key: str) -> AIReadinessResult:
    """Call AI to analyze AI readiness."""
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        system_instruction = f"{SYSTEM_PROMPT}\n\nJSON SCHEMA:\n{EXTRACTION_SCHEMA}"

        user_prompt = f"""Analyze this employee's AI readiness based on their professional data:

{context}

Provide scores for each of the 8 AI readiness dimensions with specific reasoning."""

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
            ),
        )
        
        return _parse_ai_response(response.text)

    except ImportError:
        raise Exception("google-genai package not installed")
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


def _get_default_readiness() -> AIReadinessResult:
    """Return default AI readiness when AI is not available."""
    breakdown = [
        AIReadinessDimension(category=dim, score=50, reasoning="Default score - AI analysis not available")
        for dim in AI_DIMENSIONS
    ]
    
    return AIReadinessResult(
        overall_score=50,
        breakdown=breakdown,
        recommendation=AIRecommendation(
            action="Configure AI",
            message="AI analysis is not configured. Please set up GOOGLE_API_KEY to get personalized AI readiness scores.",
            impact="N/A",
        ),
        analysis_summary="Default AI readiness - Configure AI for personalized analysis",
    )

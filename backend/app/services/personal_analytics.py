"""
Personal Analytics Service - AI-powered analytics using Google Gemini
Analyzes employee data from documents, projects, and skills to generate insights.
"""

from typing import Dict, List, Any
from supabase import Client
from google import genai
import json
import os


# ─── Data Structures ───────────────────────────────────────────

class AnalyticsInsight:
    def __init__(self, category: str, title: str, description: str, impact: str, actionable: bool = True):
        self.category = category
        self.title = title
        self.description = description
        self.impact = impact
        self.actionable = actionable


class ProductivityTrend:
    def __init__(self, period: str, score: float, key_achievements: List[str]):
        self.period = period
        self.score = score
        self.key_achievements = key_achievements


class SkillGrowth:
    def __init__(self, skill_name: str, current_level: int, target_level: int, growth_rate: float, trajectory: str, category: str, recent_projects: List[str]):
        self.skill_name = skill_name
        self.current_level = current_level
        self.target_level = target_level
        self.growth_rate = growth_rate
        self.trajectory = trajectory
        self.category = category
        self.recent_projects = recent_projects


class AnalyticsResponse:
    def __init__(
        self,
        insights: List[AnalyticsInsight],
        productivity_trends: List[ProductivityTrend],
        skill_growth: List[SkillGrowth],
        recommendations: List[str],
        overall_score: float,
    ):
        self.insights = insights
        self.productivity_trends = productivity_trends
        self.skill_growth = skill_growth
        self.recommendations = recommendations
        self.overall_score = overall_score


# ─── Context Building ───────────────────────────────────────────

def build_analytics_context(employee_id: str, sb: Client) -> str:
    """
    Build comprehensive context for analytics from employee data.
    """
    context_parts = []
    
    # Employee Profile
    emp = sb.table("employees").select("*").eq("id", employee_id).execute()
    if emp.data:
        emp_data = emp.data[0]
        context_parts.append(f"EMPLOYEE PROFILE:")
        context_parts.append(f"  Name: {emp_data.get('full_name')}")
        context_parts.append(f"  Role: {emp_data.get('role')}")
        context_parts.append(f"  Department: {emp_data.get('department')}")
        context_parts.append(f"  Experience: {emp_data.get('years_of_experience', 0)} years")
        context_parts.append("")
    
    # Skills
    skills = sb.table("skills").select("*").eq("employee_id", employee_id).execute()
    if skills.data:
        context_parts.append(f"SKILLS ({len(skills.data)} total):")
        for skill in skills.data:
            context_parts.append(f"  - {skill.get('name')}: Proficiency {skill.get('proficiency')}/10, {skill.get('experience_level')}, Category: {skill.get('category')}")
        context_parts.append("")
    
    # Completed Projects
    completed_projects = sb.table("projects").select("*").eq("employee_id", employee_id).eq("status", "completed").execute()
    if completed_projects.data:
        context_parts.append(f"COMPLETED PROJECTS ({len(completed_projects.data)}):")
        for proj in completed_projects.data:
            context_parts.append(f"  - {proj.get('name')}: {proj.get('description')[:100]}...")
            context_parts.append(f"    Technologies: {proj.get('technologies', [])}")
            context_parts.append(f"    Success Score: {proj.get('success_score', 0)}/10")
            context_parts.append(f"    Duration: {proj.get('start_date')} to {proj.get('end_date')}")
        context_parts.append("")
    
    # Active Projects
    active_projects = sb.table("projects").select("*").eq("employee_id", employee_id).in_("status", ["active", "in_progress"]).execute()
    if active_projects.data:
        context_parts.append(f"ACTIVE PROJECTS ({len(active_projects.data)}):")
        for proj in active_projects.data:
            context_parts.append(f"  - {proj.get('name')}: {proj.get('description')[:100]}...")
            context_parts.append(f"    Progress: {proj.get('progress', 0)}%")
            context_parts.append(f"    Technologies: {proj.get('technologies', [])}")
            context_parts.append(f"    Status: {proj.get('status')}")
        context_parts.append("")
    
    # Uploaded Documents/Knowledge Sources
    knowledge = sb.table("knowledge_sources").select("*").eq("employee_id", employee_id).execute()
    if knowledge.data:
        context_parts.append(f"UPLOADED DOCUMENTS ({len(knowledge.data)}):")
        for doc in knowledge.data:
            context_parts.append(f"  - {doc.get('title')}: {doc.get('type')}")
            if doc.get('summary'):
                context_parts.append(f"    Summary: {doc.get('summary')[:150]}...")
            if doc.get('extracted_skills'):
                context_parts.append(f"    Extracted Skills: {doc.get('extracted_skills')}")
        context_parts.append("")
    
    return "\n".join(context_parts)


# ─── Analytics Processing ───────────────────────────────────────

SYSTEM_PROMPT = """You are an AI Analytics Expert specializing in employee performance and career development analysis.
Your task is to analyze employee data and generate actionable insights, productivity trends, and skill growth analysis.

Provide your response in the following JSON format:
{
  "insights": [
    {
      "category": "Productivity" | "Skills" | "Projects" | "Growth" | "Collaboration",
      "title": "Brief, impactful title (5-8 words)",
      "description": "Detailed explanation (2-3 sentences) with specific examples from the data",
      "impact": "High" | "Medium" | "Low",
      "actionable": true
    }
  ],
  "productivity_trends": [
    {
      "period": "Month name (e.g., 'January', 'February')",
      "score": 0-100,
      "key_achievements": ["specific achievement 1", "specific achievement 2"]
    }
  ],
  "skill_growth": [
    {
      "skill_name": "Specific skill name",
      "current_level": 0-100,
      "target_level": 0-100,
      "growth_rate": percentage (e.g., 15.5),
      "trajectory": "Rising" | "Stable" | "Declining",
      "category": "Technical" | "Soft Skills" | "Domain",
      "recent_projects": ["project1", "project2"]
    }
  ],
  "recommendations": [
    "Specific, actionable recommendation with clear steps",
    "Another specific recommendation tied to data"
  ],
  "overall_score": 0-100
}

ANALYSIS GUIDELINES:
1. **Insights must be data-driven**: Reference specific projects, skills, or documents
2. **Be specific**: Instead of "Good performance", say "Completed 3 cloud projects with 85%+ success scores"
3. **Include context**: Mention technologies used, project outcomes, skill improvements
4. **Provide actionable insights**: Each insight should suggest what the employee should continue or improve
5. **Productivity trends**: Create realistic 6-month trend based on project completion timeline
6. **Skill growth**: Focus on top 5-6 skills with actual proficiency levels and realistic growth rates
7. **Recommendations**: Must be specific, measurable, and tied to the data (e.g., "Learn Kubernetes to improve cloud architecture skills from 70% to 85%")

Base your analysis on:
1. Project completion rates and success scores (completed vs active projects)
2. Skill proficiency levels and experience (current proficiency out of 10)
3. Document content and extracted knowledge (uploaded documents and their summaries)
4. Active project progress and technologies used
5. Experience level and role progression (years of experience, current role)

Be specific, data-driven, and provide actionable insights. Avoid generic statements."""


def process_analytics(employee_id: str, sb: Client, api_key: str) -> AnalyticsResponse:
    """
    Process personal analytics using AI to generate insights from employee data.
    """
    if not api_key:
        # Return fallback response if no API key
        return AnalyticsResponse(
            insights=[
                AnalyticsInsight("System", "API Not Configured", "Google API key not set. Please configure to enable AI analytics.", "High", False)
            ],
            productivity_trends=[],
            skill_growth=[],
            recommendations=["Configure Google API key to enable AI-powered analytics"],
            overall_score=0,
        )
    
    # Build context
    context = build_analytics_context(employee_id, sb)
    
    # Initialize Gemini client
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    
    # Create prompt
    prompt = f"""EMPLOYEE DATA FOR ANALYSIS:
{context}

Based on this employee data, generate comprehensive personal analytics including:
1. Key insights about productivity, skills, projects, and growth areas
2. Productivity trends over the last 6 months (estimate based on project timeline)
3. Skill growth analysis for top skills
4. Actionable recommendations for improvementProvide response in the specified JSON format."""
    
    try:
        # Call Gemini API
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
            ),
        )
        
        # Parse response
        result_text = response.text
        # Extract JSON from response (in case there's extra text)
        json_start = result_text.find('{')
        json_end = result_text.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            result_text = result_text[json_start:json_end]
        
        result_data = json.loads(result_text)
        
        # Parse insights
        insights = [
            AnalyticsInsight(
                category=i.get('category', 'General'),
                title=i.get('title', ''),
                description=i.get('description', ''),
                impact=i.get('impact', 'Medium'),
                actionable=i.get('actionable', True)
            )
            for i in result_data.get('insights', [])
        ]
        
        # Parse productivity trends
        productivity_trends = [
            ProductivityTrend(
                period=t.get('period', ''),
                score=t.get('score', 0),
                key_achievements=t.get('key_achievements', [])
            )
            for t in result_data.get('productivity_trends', [])
        ]
        
        # Parse skill growth
        skill_growth = [
            SkillGrowth(
                skill_name=s.get('skill_name', ''),
                current_level=s.get('current_level', 0),
                target_level=s.get('target_level', s.get('current_level', 0)),
                growth_rate=s.get('growth_rate', 0),
                trajectory=s.get('trajectory', 'Stable'),
                category=s.get('category', 'Technical'),
                recent_projects=s.get('recent_projects', [])
            )
            for s in result_data.get('skill_growth', [])
        ]
        
        recommendations = result_data.get('recommendations', [])
        overall_score = result_data.get('overall_score', 0)
        
        return AnalyticsResponse(
            insights=insights,
            productivity_trends=productivity_trends,
            skill_growth=skill_growth,
            recommendations=recommendations,
            overall_score=overall_score,
        )
        
    except Exception as e:
        # Return error response
        return AnalyticsResponse(
            insights=[
                AnalyticsInsight("Error", "Analysis Failed", f"Failed to generate analytics: {str(e)}", "High", False)
            ],
            productivity_trends=[],
            skill_growth=[],
            recommendations=["Please try again later"],
            overall_score=0,
        )


# ─── Response Formatting ───────────────────────────────────────

def to_dict(response: AnalyticsResponse) -> Dict[str, Any]:
    """Convert AnalyticsResponse to dictionary for API response."""
    return {
        "insights": [
            {
                "category": i.category,
                "title": i.title,
                "description": i.description,
                "impact": i.impact,
                "actionable": i.actionable,
            }
            for i in response.insights
        ],
        "productivity_trends": [
            {
                "period": t.period,
                "score": t.score,
                "key_achievements": t.key_achievements,
            }
            for t in response.productivity_trends
        ],
        "skill_growth": [
            {
                "skill_name": s.skill_name,
                "current_level": s.current_level,
                "target_level": s.target_level,
                "growth_rate": s.growth_rate,
                "trajectory": s.trajectory,
                "category": s.category,
                "recent_projects": s.recent_projects,
            }
            for s in response.skill_growth
        ],
        "recommendations": response.recommendations,
        "overall_score": response.overall_score,
    }

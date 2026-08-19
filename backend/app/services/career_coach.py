import json
import uuid
from typing import List, Dict, Any
from supabase import Client

from app.schemas.career import (
    CareerAnalysisResponse,
    SkillGapResponse,
    CareerRoadmapStepResponse,
    CareerRecommendationResponse,
    MarketTrendResponse,
    CareerStrength,
    CareerChatMessage,
)

SYSTEM_PROMPT_ANALYSIS = """You are a world-class Senior AI Engineer and Software Engineering Career Coach with 25 years of experience in the tech industry. 
Your goal is to provide deeply insightful, actionable, and personalized career intelligence. 
You are analyzing an employee's profile to determine their readiness for a specified target role.

Generate a JSON response that strictly adheres to the following structure:
{
    "readiness_score": integer (0-100),
    "strengths": [
        {"title": string, "description": string}
    ],
    "opportunities": [
        {"title": string, "description": string}
    ],
    "skill_gaps": [
        {
            "skill": string,
            "current_level": integer (0-10),
            "target_level": integer (0-10),
            "gap": integer,
            "priority": "Critical" | "High" | "Medium" | "Low",
            "category": string,
            "color": string (hex code)
        }
    ],
    "roadmap_steps": [
        {
            "id": string (uuid),
            "step_order": integer,
            "title": string,
            "status": "achieved" | "in_progress" | "upcoming" | "goal",
            "description": string
        }
    ],
    "recommendations": [
        {
            "id": string (uuid),
            "title": string,
            "provider": string,
            "duration": string,
            "readiness_impact": string (e.g., "+15% Readiness"),
            "description": string,
            "is_top_match": boolean
        }
    ],
    "market_trends": [
        {
            "skill": string,
            "category": string,
            "trend": string (e.g., "+20%", "Stable", "-5%"),
            "color": string (hex code)
        }
    ],
    "narrative": string (A highly personalized, encouraging paragraph summarizing their trajectory)
}

Make sure the roadmap has 4-6 steps. The last step should always be the target role with status 'goal'. Make skill gaps accurate based on their current skills vs the target role. Add at least 4 learning recommendations.
"""

SYSTEM_PROMPT_CHAT = """You are a world-class Senior AI Engineer and Software Engineering Career Coach with 25 years of experience.
Your name is "Digital Twin Career Coach".
You are mentoring the user based on their specific digital twin profile (skills, projects, goals).
Provide specific, actionable, senior-level advice. Be encouraging but realistic.
Use Markdown formatting for your responses. Keep responses concise but impactful.
"""

def _fetch_employee_context(employee_id: str, sb: Client) -> dict:
    """Fetch all relevant employee data from Supabase for context."""
    skills_result = sb.table("skills").select("*").eq("employee_id", employee_id).execute()
    projects_result = sb.table("projects").select("*").eq("employee_id", employee_id).execute()
    sources_result = sb.table("knowledge_sources").select("*").eq("employee_id", employee_id).execute()
    employee_result = sb.table("employees").select("*").eq("id", employee_id).execute()
    goal_result = sb.table("career_goals").select("*").eq("employee_id", employee_id).eq("is_active", True).execute()
    
    return {
        "employee": employee_result.data[0] if employee_result.data else {},
        "skills": skills_result.data or [],
        "projects": projects_result.data or [],
        "knowledge_sources": sources_result.data or [],
        "active_goal": goal_result.data[0] if goal_result.data else None
    }

def _build_context_prompt(data: dict, target_role: str = None) -> str:
    emp = data.get("employee", {})
    skills = data.get("skills", [])
    projects = data.get("projects", [])
    sources = data.get("knowledge_sources", [])
    
    role = target_role or (data.get("active_goal", {}) or {}).get("target_role", "Unknown")
    
    context = f"EMPLOYEE PROFILE:\nName: {emp.get('full_name', 'Unknown')}\nCurrent Role: {emp.get('role', 'Unknown')}\nTarget Role: {role}\n\n"
    context += "SKILLS:\n"
    for s in skills:
        context += f"- {s.get('name')}: {s.get('proficiency', 0)}/10 ({s.get('category', 'Unknown')})\n"
        
    context += "\nPROJECTS:\n"
    for p in projects:
        context += f"- {p.get('name')} (Role: {p.get('role')}, Status: {p.get('status')})\n"
        
    return context

def generate_career_analysis(employee_id: str, target_role: str, sb: Client, api_key: str) -> CareerAnalysisResponse:
    context_data = _fetch_employee_context(employee_id, sb)
    
    if not api_key:
        return _rule_based_analysis(context_data, target_role)
        
    context_str = _build_context_prompt(context_data, target_role)
    prompt = f"Analyze this employee for the target role of '{target_role}'.\n\n{context_str}"
    
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT_ANALYSIS,
                response_mime_type="application/json",
                response_schema=CareerAnalysisResponse,
            )
        )
        
        # If the SDK supports parsed (v1.0.0+), use it. Otherwise, parse text.
        if hasattr(response, "parsed") and response.parsed:
            data = response.parsed.model_dump()
        else:
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                lines = resp_text.split('\n')
                if lines[0].startswith("```"): lines = lines[1:]
                if lines[-1].startswith("```"): lines = lines[:-1]
                resp_text = '\n'.join(lines)
            data = json.loads(resp_text)
            
        # Ensure UUIDs are present
        for i, step in enumerate(data.get("roadmap_steps", [])):
            if not step.get("id"): step["id"] = str(uuid.uuid4())
            step["step_order"] = i + 1
            
        for rec in data.get("recommendations", []):
            if not rec.get("id"): rec["id"] = str(uuid.uuid4())
            
        return CareerAnalysisResponse(**data)
        
    except Exception as e:
        print(f"Error calling Gemini for career analysis: {e}")
        return _rule_based_analysis(context_data, target_role)


def generate_career_chat(employee_id: str, message: str, history: List[CareerChatMessage], sb: Client, api_key: str) -> str:
    if not api_key:
        return "I am currently running in offline mode without an API key, but I'm here to support your career growth. Please set the GOOGLE_API_KEY in the environment to unlock full AI coaching capabilities."
        
    context_data = _fetch_employee_context(employee_id, sb)
    context_str = _build_context_prompt(context_data)
    
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        
        contents = []
        
        for msg in history[-10:]:  # Keep last 10 messages for context
            gemini_role = "model" if msg.role == "assistant" else "user"
            # Prevent consecutive roles of the same type by skipping if it matches the last one
            if contents and contents[-1].role == gemini_role:
                contents[-1].parts[0].text += f"\n\n{msg.content}"
            else:
                contents.append(types.Content(role=gemini_role, parts=[types.Part.from_text(msg.content)]))
            
        # Append the current message
        if contents and contents[-1].role == "user":
            contents[-1].parts[0].text += f"\n\n{message}"
        else:
            contents.append(types.Content(role="user", parts=[types.Part.from_text(message)]))
            
        # Enhance system prompt with employee context
        enhanced_system_prompt = f"{SYSTEM_PROMPT_CHAT}\n\nHere is the current employee's profile context. Base your advice entirely on this:\n{context_str}"
        
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=enhanced_system_prompt,
            )
        )
        return response.text
        
    except Exception as e:
        print(f"Error calling Gemini for career chat: {e}")
        return "Sorry, I'm having trouble connecting to the AI models right now. Please try again later."


def _rule_based_analysis(data: dict, target_role: str) -> CareerAnalysisResponse:
    """Fallback dynamic analysis when no API key is provided."""
    skills = data.get("skills", [])
    projects = data.get("projects", [])
    
    # Analyze current skill levels
    skill_map = {s.get("name", "").lower(): s.get("proficiency", 0) for s in skills}
    
    # Define generic requirements based on role keywords
    role_lower = target_role.lower()
    required_skills = []
    
    if "cloud" in role_lower or "architect" in role_lower:
        required_skills = [
            {"name": "System Architecture", "target": 9, "category": "Architecture"},
            {"name": "AWS/Azure", "target": 8, "category": "Cloud"},
            {"name": "Kubernetes", "target": 8, "category": "DevOps"},
            {"name": "System Design", "target": 9, "category": "Engineering"}
        ]
    elif "data" in role_lower or "ai" in role_lower or "machine learning" in role_lower:
        required_skills = [
            {"name": "Machine Learning", "target": 9, "category": "AI/ML"},
            {"name": "Python", "target": 9, "category": "Programming"},
            {"name": "Data Architecture", "target": 8, "category": "Data"},
            {"name": "Model Deployment", "target": 8, "category": "MLOps"}
        ]
    elif "frontend" in role_lower or "ui" in role_lower:
        required_skills = [
            {"name": "React/Next.js", "target": 9, "category": "Frontend"},
            {"name": "UI/UX Design", "target": 7, "category": "Design"},
            {"name": "TypeScript", "target": 8, "category": "Programming"},
            {"name": "Web Performance", "target": 8, "category": "Frontend"}
        ]
    else:
        # Generic Software Engineer
        required_skills = [
            {"name": "Backend Development", "target": 8, "category": "Engineering"},
            {"name": "System Design", "target": 8, "category": "Architecture"},
            {"name": "CI/CD", "target": 7, "category": "DevOps"},
            {"name": "Leadership", "target": 7, "category": "Soft Skills"}
        ]
        
    skill_gaps = []
    total_current = 0
    total_target = 0
    recommendations = []
    
    for req in required_skills:
        # Check if user has this skill or something similar
        matched_level = 0
        for s in skills:
            if req["name"].lower() in s.get("name", "").lower() or s.get("name", "").lower() in req["name"].lower():
                matched_level = max(matched_level, int(s.get("proficiency", 0)))
                
        # Fallback to general mapping if exact match fails
        if matched_level == 0:
            # Just take the average of all their skills as a baseline, divided by 2
            avg_skill = sum([int(s.get("proficiency", 0)) for s in skills]) / max(len(skills), 1)
            matched_level = int(avg_skill / 2) # Penalize for not having the specific skill
            
        # Ensure scale is 0-10
        current_lvl = min(10, max(0, matched_level))
        if current_lvl > 10 and current_lvl > 50:
            # If the DB used 0-100 scale, convert it
            current_lvl = int(current_lvl / 10)
            
        target_lvl = req["target"]
        
        gap = max(0, target_lvl - current_lvl)
        priority = "Critical" if gap >= 4 else "High" if gap >= 2 else "Medium"
        color = "#ef4444" if gap >= 4 else "#f59e0b" if gap >= 2 else "#10b981"
        
        skill_gaps.append(
            SkillGapResponse(
                skill=req["name"], 
                current_level=current_lvl, 
                target_level=target_lvl, 
                gap=gap, 
                priority=priority, 
                category=req["category"], 
                color=color
            )
        )
        
        total_current += current_lvl
        total_target += target_lvl
        
        if gap >= 2:
            recommendations.append(
                CareerRecommendationResponse(
                    id=str(uuid.uuid4()), 
                    title=f"Advanced {req['name']} Mastery", 
                    provider="Enterprise Academy", 
                    duration=f"{gap * 4}h", 
                    readiness_impact=f"+{gap * 3}% Readiness", 
                    description=f"Directly targets your gap in {req['name']}. Essential for {target_role}.", 
                    is_top_match=(gap >= 4)
                )
            )

    readiness = int((total_current / max(total_target, 1)) * 100)
    readiness = min(100, max(10, readiness)) # Bound between 10 and 100
    
    # Dynamic Roadmap
    roadmap = [
        CareerRoadmapStepResponse(id=str(uuid.uuid4()), step_order=1, title="Current Expertise", status="achieved", description=f"Leveraging your existing {len(skills)} skills and {len(projects)} projects."),
    ]
    
    if readiness < 60:
        roadmap.append(CareerRoadmapStepResponse(id=str(uuid.uuid4()), step_order=2, title="Core Skill Building", status="in_progress", description="Focus on critical missing fundamentals."))
        roadmap.append(CareerRoadmapStepResponse(id=str(uuid.uuid4()), step_order=3, title="Advanced Concepts", status="upcoming", description="Deepen knowledge in target domains."))
    elif readiness < 85:
        roadmap.append(CareerRoadmapStepResponse(id=str(uuid.uuid4()), step_order=2, title="Advanced Concepts", status="in_progress", description="Deepen knowledge in target domains."))
        roadmap.append(CareerRoadmapStepResponse(id=str(uuid.uuid4()), step_order=3, title="Leadership & System Design", status="upcoming", description="Prepare for senior responsibilities."))
    else:
        roadmap.append(CareerRoadmapStepResponse(id=str(uuid.uuid4()), step_order=2, title="Transition Ready", status="in_progress", description="Final polish and interview prep."))
        
    roadmap.append(CareerRoadmapStepResponse(id=str(uuid.uuid4()), step_order=4, title=target_role, status="goal", description="Target destination achieved."))
    
    # Fallback recommendations if empty
    if not recommendations:
        recommendations = [
            CareerRecommendationResponse(id=str(uuid.uuid4()), title=f"Leadership for {target_role}", provider="Internal", duration="8h", readiness_impact="+5%", description="Prepare for the next level.", is_top_match=True)
        ]
        
    return CareerAnalysisResponse(
        readiness_score=readiness,
        strengths=[CareerStrength(title="Technical Foundation", description=f"Demonstrated across {len(projects)} projects.")],
        opportunities=[CareerStrength(title=f"Gap to {target_role}", description="Requires targeted upskilling.")],
        skill_gaps=skill_gaps,
        roadmap_steps=roadmap,
        recommendations=recommendations[:4], # Top 4
        market_trends=[
            MarketTrendResponse(skill=required_skills[0]["name"], category=required_skills[0]["category"], trend="+25%", color="#10b981"),
            MarketTrendResponse(skill=required_skills[1]["name"], category=required_skills[1]["category"], trend="+15%", color="#10b981")
        ],
        narrative=f"Based on your profile of {len(skills)} skills and {len(projects)} projects, you are {readiness}% ready for the {target_role} role. Focus on your top recommendations to bridge the gap."
    )

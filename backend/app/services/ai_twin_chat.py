"""
AI Twin Chat Service — Employee-specific AI assistant using RAG.

Retrieves relevant context from:
- Uploaded documents (knowledge sources)
- Skills
- Completed projects
- Active/pending projects

Uses LLM to generate personalized responses.
"""

import os
from dataclasses import dataclass
from typing import Any
from supabase import Client


@dataclass
class ChatMessage:
    role: str  # 'user' or 'assistant'
    content: str


@dataclass
class ChatResponse:
    response: str
    sources_used: list[str]


# ── Constants ─────────────────────────────────────────────────

MODEL_NAME = "gemini-3.6-flash"
MAX_CONTEXT_LENGTH = 8000  # Characters


# ── System Prompt ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI Twin Assistant for an employee's Digital Twin system. You represent the employee and have access to their professional data.

Your role is to:
- Answer questions about the employee's skills, projects, and experience
- Help generate professional content (bios, summaries, recommendations)
- Provide career guidance based on their actual background
- Be helpful, accurate, and professional

IMPORTANT GUIDELINES:
- Only use the provided context about the employee
- If you don't have information, say so honestly
- Be specific and reference actual projects, skills, and experiences
- Maintain a professional but friendly tone
- Format responses clearly with appropriate structure

You are representing this employee, so speak about them in the first person ("I", "my") when appropriate."""


# ── Context Retrieval ─────────────────────────────────────────

def build_employee_context(employee_id: str, sb: Client) -> str:
    """Build comprehensive context about an employee from their data."""
    context_parts = []
    
    # Fetch employee profile
    employee_result = sb.table("employees").select("*").eq("id", employee_id).execute()
    employee = employee_result.data[0] if employee_result.data else {}
    
    if employee:
        context_parts.append(f"""EMPLOYEE PROFILE:
- Name: {employee.get('full_name', 'Unknown')}
- Role: {employee.get('role', 'Unknown')}
- Department: {employee.get('department', 'Unknown')}
- Years of Experience: {employee.get('years_experience', 'Unknown')}
- Years in Company: {employee.get('years_in_company', 'Unknown')}
- Team: {employee.get('team', 'Unknown')}
""")
    
    # Fetch skills
    skills_result = sb.table("skills").select("*").eq("employee_id", employee_id).execute()
    skills = skills_result.data or []
    
    if skills:
        context_parts.append(f"\nSKILLS ({len(skills)}):")
        for skill in skills[:30]:  # Limit to top 30 skills
            context_parts.append(f"- {skill.get('name')} (Proficiency: {skill.get('proficiency')}%, Category: {skill.get('category')})")
    
    # Fetch projects
    projects_result = sb.table("projects").select("*").eq("employee_id", employee_id).execute()
    projects = projects_result.data or []
    
    if projects:
        completed = [p for p in projects if p.get('status') == 'Completed']
        active = [p for p in projects if p.get('status') != 'Completed']
        
        context_parts.append(f"\nCOMPLETED PROJECTS ({len(completed)}):")
        for project in completed[:10]:
            context_parts.append(f"- {project.get('name')}: {project.get('description', '')[:100]}...")
            context_parts.append(f"  Role: {project.get('role')}, Technologies: {', '.join(project.get('technologies', []))}")
            context_parts.append(f"  Success Score: {project.get('success_score')}")
        
        context_parts.append(f"\nACTIVE PROJECTS ({len(active)}):")
        for project in active[:10]:
            context_parts.append(f"- {project.get('name')}: {project.get('description', '')[:100]}...")
            context_parts.append(f"  Role: {project.get('role')}, Status: {project.get('status')}, Progress: {project.get('progress')}%")
            context_parts.append(f"  Technologies: {', '.join(project.get('technologies', []))}")
    
    # Fetch knowledge sources
    knowledge_result = sb.table("knowledge_sources").select("*").eq("employee_id", employee_id).execute()
    knowledge_sources = knowledge_result.data or []
    
    if knowledge_sources:
        context_parts.append(f"\nUPLOADED DOCUMENTS ({len(knowledge_sources)}):")
        for source in knowledge_sources[:10]:
            context_parts.append(f"- {source.get('name')} (Type: {source.get('type')}, Skills Extracted: {source.get('skills_extracted', 0)})")
            if source.get('summary'):
                context_parts.append(f"  Summary: {source.get('summary')[:150]}...")
    
    # Combine and truncate if too long
    full_context = "\n".join(context_parts)
    if len(full_context) > MAX_CONTEXT_LENGTH:
        full_context = full_context[:MAX_CONTEXT_LENGTH] + "\n... (context truncated)"
    
    return full_context


def retrieve_relevant_context(query: str, employee_context: str) -> str:
    """
    Retrieve relevant context based on the query.
    For now, return the full context. In production, this would use
    semantic search to find the most relevant sections.
    """
    # Simple keyword-based filtering could be added here
    # For now, return full context as the LLM will use what's relevant
    return employee_context


# ── Chat Processing ───────────────────────────────────────────

def process_chat(
    employee_id: str,
    message: str,
    conversation_history: list[ChatMessage],
    sb: Client,
    api_key: str,
) -> ChatResponse:
    """
    Process a chat message using RAG with employee-specific context.
    """
    print(f"DEBUG: API key received: {api_key[:20] if api_key else 'None'}...")
    
    if not api_key:
        return ChatResponse(
            response="AI chat is not configured. Please set GOOGLE_API_KEY to enable the AI Twin Assistant.",
            sources_used=[],
        )
    
    # Build employee context
    employee_context = build_employee_context(employee_id, sb)
    
    # Retrieve relevant context
    relevant_context = retrieve_relevant_context(message, employee_context)
    
    # Build conversation history
    history_text = "\n".join([
        f"{msg.role}: {msg.content}" 
        for msg in conversation_history[-10:] if conversation_history  # Last 10 messages
    ])
    
    # Build the prompt
    user_prompt = f"""EMPLOYEE CONTEXT:
{relevant_context}

CONVERSATION HISTORY:
{history_text if history_text else "No previous messages"}

USER QUESTION:
{message}

Please provide a helpful response based on the employee's actual data."""
    
    # Call AI
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
            ),
        )
        
        ai_response = response.text.strip()
        
        # Track sources used
        sources = []
        if "SKILLS" in relevant_context:
            sources.append("Skills")
        if "COMPLETED PROJECTS" in relevant_context:
            sources.append("Completed Projects")
        if "ACTIVE PROJECTS" in relevant_context:
            sources.append("Active Projects")
        if "UPLOADED DOCUMENTS" in relevant_context:
            sources.append("Uploaded Documents")
        
        return ChatResponse(
            response=ai_response,
            sources_used=sources,
        )
        
    except ImportError:
        return ChatResponse(
            response="AI chat is not available. Please install google-genai package.",
            sources_used=[],
        )
    except Exception as exc:
        return ChatResponse(
            response=f"Error processing chat: {str(exc)}",
            sources_used=[],
        )

import re
import math
from typing import List, Dict, Any, Tuple

# Simple heuristic NLP keywords for scoring
HIGH_IMPACT_KEYWORDS = ["ai", "machine learning", "automation", "revenue", "savings", "efficiency", "strategic", "scale", "global", "platform", "predictive"]
LOW_IMPACT_KEYWORDS = ["minor", "tweak", "fix", "typo", "cosmetic", "small", "local"]
COMPLEXITY_KEYWORDS = ["restructure", "legacy", "migration", "compliance", "legal", "months", "years", "overhaul", "integrate", "third-party", "vendor", "training"]

def extract_keywords(text: str) -> List[str]:
    """Extract simple lowercase word tokens."""
    words = re.findall(r'\b\w+\b', text.lower())
    # Filter out short words and simple stop words for basic heuristic
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "it", "this", "that", "i", "we", "they"}
    return [w for w in words if len(w) > 2 and w not in stop_words]

def compute_jaccard_similarity(text1: str, text2: str) -> float:
    """Compute basic Jaccard similarity between two texts based on keywords."""
    set1 = set(extract_keywords(text1))
    set2 = set(extract_keywords(text2))
    if not set1 or not set2:
        return 0.0
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return len(intersection) / len(union)

def score_idea(title: str, description: str, db_ideas: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Classical NLP heuristic model to score an innovation idea.
    """
    combined_text = f"{title} {description}".lower()
    
    # 1. Calculate Impact Score
    high_impact_count = sum(1 for kw in HIGH_IMPACT_KEYWORDS if kw in combined_text)
    low_impact_count = sum(1 for kw in LOW_IMPACT_KEYWORDS if kw in combined_text)
    
    # Base score of 50, scale up by high impact, down by low impact
    raw_impact = 50 + (high_impact_count * 15) - (low_impact_count * 10)
    # Add a slight length bonus for detailed proposals
    raw_impact += min(20, len(combined_text) / 50)
    
    impact_score = min(100, max(0, int(raw_impact)))
    
    if impact_score >= 80:
        impact_label = "High"
    elif impact_score >= 50:
        impact_label = "Medium"
    else:
        impact_label = "Low"
        
    # 2. Calculate Feasibility
    complexity_count = sum(1 for kw in COMPLEXITY_KEYWORDS if kw in combined_text)
    # Base feasibility 90%, drops by 8% for each complexity keyword
    raw_feasibility = 95 - (complexity_count * 8)
    feasibility_pct = min(100, max(20, int(raw_feasibility)))
    
    # 3. Find Similar Ideas
    similar_count = 0
    similarity_threshold = 0.15 # 15% keyword overlap
    
    for past_idea in db_ideas:
        past_text = f"{past_idea.get('title', '')} {past_idea.get('description', '')}"
        sim = compute_jaccard_similarity(combined_text, past_text)
        if sim > similarity_threshold:
            similar_count += 1
            
    return {
        "impact": impact_label,
        "impact_score": impact_score,
        "feasibility": f"{feasibility_pct}%",
        "similar": similar_count
    }

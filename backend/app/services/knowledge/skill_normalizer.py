"""
Skill Normalizer — Deterministic skill canonicalization.

Maps common skill variants to canonical names.
Preserves the original value alongside the canonical value.
Assigns skill categories.

Never uses AI — this is fully deterministic for reliability and cost control.
"""
from __future__ import annotations

from dataclasses import dataclass

# ── Canonical Skill Map ────────────────────────────────────────
# Maps lowercase variants → canonical name

CANONICAL_SKILL_MAP: dict[str, str] = {
    # JavaScript ecosystem
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "react js": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    # Python ecosystem
    "python": "Python",
    "python3": "Python",
    "py": "Python",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scikit-learn": "Scikit-learn",
    "sklearn": "Scikit-learn",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "pytorch": "PyTorch",
    "torch": "PyTorch",
    "keras": "Keras",
    # Go / Rust / Java
    "golang": "Go",
    "go lang": "Go",
    "go": "Go",
    "rust": "Rust",
    "java": "Java",
    "spring": "Spring",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    "kotlin": "Kotlin",
    "scala": "Scala",
    # Databases
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "elasticsearch": "Elasticsearch",
    "elastic search": "Elasticsearch",
    "cassandra": "Cassandra",
    "dynamodb": "DynamoDB",
    "dynamo db": "DynamoDB",
    "sqlite": "SQLite",
    # Cloud
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    # DevOps
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "docker": "Docker",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "jenkins": "Jenkins",
    "github actions": "GitHub Actions",
    "github action": "GitHub Actions",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "helm": "Helm",
    # AI / ML
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "llm": "LLMs",
    "large language model": "LLMs",
    "large language models": "LLMs",
    "rag": "RAG",
    "retrieval augmented generation": "RAG",
    "prompt engineering": "Prompt Engineering",
    "mlops": "MLOps",
    "generative ai": "Generative AI",
    "gen ai": "Generative AI",
    "langchain": "LangChain",
    "lang chain": "LangChain",
    "openai": "OpenAI",
    "gemini": "Google Gemini",
    # Data
    "data science": "Data Science",
    "data engineering": "Data Engineering",
    "data analysis": "Data Analysis",
    "spark": "Apache Spark",
    "apache spark": "Apache Spark",
    "hadoop": "Hadoop",
    "kafka": "Apache Kafka",
    "apache kafka": "Apache Kafka",
    "airflow": "Apache Airflow",
    "apache airflow": "Apache Airflow",
    "dbt": "dbt",
    # Other
    "graphql": "GraphQL",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "restful": "REST APIs",
    "microservices": "Microservices",
    "agile": "Agile",
    "scrum": "Scrum",
    "git": "Git",
    "github": "GitHub",
    "linux": "Linux",
    "unix": "Unix/Linux",
}

# ── Category Map ───────────────────────────────────────────────

SKILL_CATEGORIES: dict[str, str] = {
    # Programming (matches mock: "Programming")
    "JavaScript": "Programming", "TypeScript": "Programming",
    "React": "Programming", "Next.js": "Programming",
    "Vue.js": "Programming", "Angular": "Programming",
    "Node.js": "Programming", "Python": "Programming",
    "Django": "Programming", "Flask": "Programming",
    "FastAPI": "Programming", "Go": "Programming",
    "Rust": "Programming", "Java": "Programming",
    "Spring": "Programming", "Spring Boot": "Programming",
    "Kotlin": "Programming", "Scala": "Programming",
    "C#": "Programming", "C++": "Programming",
    "PHP": "Programming", "Ruby": "Programming",
    "GraphQL": "Programming", "REST APIs": "Programming",
    "Microservices": "Programming",
    # AI Skills (matches mock: "AI Skills")
    "Machine Learning": "AI Skills", "Deep Learning": "AI Skills",
    "NLP": "AI Skills", "LLMs": "AI Skills", "RAG": "AI Skills",
    "Prompt Engineering": "AI Skills", "MLOps": "AI Skills",
    "Generative AI": "AI Skills", "LangChain": "AI Skills",
    "OpenAI": "AI Skills", "Google Gemini": "AI Skills",
    "TensorFlow": "AI Skills", "PyTorch": "AI Skills",
    "Keras": "AI Skills", "Scikit-learn": "AI Skills",
    "Pandas": "AI Skills", "NumPy": "AI Skills",
    "Computer Vision": "AI Skills", "AI Ethics": "AI Skills",
    # Data Science (matches mock: "Data Science")
    "Data Science": "Data Science", "Data Engineering": "Data Science",
    "Data Analysis": "Data Science", "Apache Spark": "Data Science",
    "Hadoop": "Data Science", "Apache Kafka": "Data Science",
    "Apache Airflow": "Data Science", "dbt": "Data Science",
    "Tableau": "Data Science", "Power BI": "Data Science",
    "SQL": "Data Science",
    # Cloud (matches mock: "Cloud")
    "AWS": "Cloud", "Azure": "Cloud", "GCP": "Cloud",
    "Google Cloud": "Cloud", "AWS Architecture": "Cloud",
    "Azure Services": "Cloud", "Cloud Architecture": "Cloud",
    "Serverless": "Cloud",
    # DevOps (matches mock: "DevOps")
    "Kubernetes": "DevOps", "Docker": "DevOps",
    "Terraform": "DevOps", "Ansible": "DevOps",
    "Jenkins": "DevOps", "GitHub Actions": "DevOps",
    "CI/CD": "DevOps", "Helm": "DevOps",
    "Linux": "DevOps", "Unix/Linux": "DevOps",
    "Nginx": "DevOps", "Infrastructure as Code": "DevOps",
    # Database (matches mock: "Database")
    "PostgreSQL": "Database", "MySQL": "Database",
    "MongoDB": "Database", "Redis": "Database",
    "Elasticsearch": "Database", "Cassandra": "Database",
    "DynamoDB": "Database", "SQLite": "Database",
    "Oracle": "Database", "MariaDB": "Database",
    # Leadership (matches mock: "Leadership")
    "Team Leadership": "Leadership", "Project Management": "Leadership",
    "Agile": "Leadership", "Scrum": "Leadership",
    "Product Management": "Leadership", "Stakeholder Management": "Leadership",
    "Mentoring": "Leadership",
    # Tools
    "Git": "Tools", "GitHub": "Tools", "Jira": "Tools",
    "Figma": "Tools", "VS Code": "Tools",
}


# ── Result Types ──────────────────────────────────────────────

@dataclass
class NormalizedSkill:
    canonical_name: str
    original_name: str
    category: str
    was_normalized: bool


# ── Normalizer ─────────────────────────────────────────────────

def normalize_skill(raw_skill: str) -> NormalizedSkill:
    """
    Normalize a raw skill name to its canonical form.
    
    Args:
        raw_skill: Raw skill name as extracted from a document
    
    Returns:
        NormalizedSkill with canonical_name, category, and normalization flag
    """
    stripped = raw_skill.strip()
    lookup_key = stripped.lower()

    canonical = CANONICAL_SKILL_MAP.get(lookup_key)
    was_normalized = canonical is not None

    if not canonical:
        # Preserve original casing for unknown skills
        canonical = stripped

    category = SKILL_CATEGORIES.get(canonical, "Other")

    return NormalizedSkill(
        canonical_name=canonical,
        original_name=stripped,
        category=category,
        was_normalized=was_normalized,
    )


def normalize_skills(raw_skills: list[str]) -> list[NormalizedSkill]:
    """Normalize a list of raw skill names. Deduplicates by canonical name."""
    seen_canonical: set[str] = set()
    results: list[NormalizedSkill] = []

    for raw in raw_skills:
        if not raw or not raw.strip():
            continue
        normalized = normalize_skill(raw)
        key = normalized.canonical_name.lower()
        if key not in seen_canonical:
            seen_canonical.add(key)
            results.append(normalized)

    return results


def determine_category(skill_name: str) -> str:
    """Return the category for a (possibly already canonical) skill name."""
    return SKILL_CATEGORIES.get(skill_name, "Other")

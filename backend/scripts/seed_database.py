"""
Seed the Supabase database with all mock data from the frontend.

Run with: python -m scripts.seed_database
"""

import uuid
from datetime import datetime, timezone, timedelta

from app.database import get_supabase_admin
from app.utils.auth import hash_password


def _uid() -> str:
    return str(uuid.uuid4())


def seed():
    """Seed Supabase with comprehensive mock data matching the frontend."""
    print("🌱 Starting Supabase seed...")
    sb = get_supabase_admin()

    # ════════════════════════════════════════════════════════
    # CLEAR EXISTING DATA (order matters — children first)
    # ════════════════════════════════════════════════════════
    print("  🗑️  Clearing existing data...")
    tables_to_clear = [
        "reward_claims", "recognitions", "projects", "knowledge_sources",
        "career_roadmap_steps", "career_goals",
        "weekly_schedule_entries", "certifications", "employee_courses", "courses",
        "learning_paths", "challenge_progress", "challenges",
        "employee_achievements", "achievements", "xp_transactions",
        "gamification_profiles", "skills", "reward_items", "employees",
    ]
    for table in tables_to_clear:
        try:
            sb.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        except Exception:
            # Table might be empty — that's fine
            pass

    now = datetime.now(timezone.utc)

    # ════════════════════════════════════════════════════════
    # 1. EMPLOYEES
    # ════════════════════════════════════════════════════════
    alex_id = _uid()
    alex = {
        "id": alex_id,
        "employee_code": "EMP-2847",
        "full_name": "Alex Carter",
        "initials": "AC",
        "email": "alex.carter@company.com",
        "password_hash": hash_password("password123"),
        "department": "Product & Engineering",
        "role": "Senior Cloud Engineer",
        "team": "Cloud Platform Foundation",
        "manager_name": "Sarah Mitchell (Director of Eng.)",
        "location": "Colombo, Sri Lanka",
        "timezone_str": "IST (UTC+5:30)",
        "phone": "+94 77 123 4567",
        "education": [
            "MSc Computer Science — University of Colombo (2018)",
            "BSc Software Engineering — University of Moratuwa (2016)",
        ],
        "languages": [
            {"name": "English", "proficiency": "Native"},
            {"name": "Sinhala", "proficiency": "Native"},
            {"name": "Tamil", "proficiency": "Conversational"},
        ],
        "biography": "Senior Cloud Engineer with 8 years of experience architecting scalable cloud infrastructure on AWS and Azure. Passionate about platform engineering, DevSecOps, and mentoring junior engineers. Currently leading the enterprise cloud migration initiative while building internal identity intelligence capabilities.",
        "headline": "Architecting the future of cloud platforms",
        "years_experience": 8,
        "years_in_company": 4,
        "employment_type": "Full-Time",
        "employment_status": "Active",
        "twin_health": 96,
        "ai_confidence": 94,
        "profile_completeness": 98,
    }
    sb.table("employees").insert(alex).execute()

    # Other employees for leaderboard
    other_employees_data = [
        ("EMP-1001", "Priya Sharma",   "PS", "priya.sharma@company.com",  "AI Research",  18, 9840),
        ("EMP-1002", "Marcus Lee",     "ML", "marcus.lee@company.com",    "Engineering",  16, 8210),
        ("EMP-1003", "Sofia Reyes",    "SR", "sofia.reyes@company.com",   "Product",      15, 7450),
        ("EMP-1004", "James O'Brien",  "JO", "james.obrien@company.com",  "Leadership",   14, 6900),
        ("EMP-1005", "Aisha Khan",     "AK", "aisha.khan@company.com",    "Engineering",  14, 6600),
        ("EMP-1006", "David Chen",     "DC", "david.chen@company.com",    "Data Science", 13, 5200),
        ("EMP-1007", "Riya Patel",     "RP", "riya.patel@company.com",    "Product",      12, 4100),
        ("EMP-1008", "Tom Wright",     "TW", "tom.wright@company.com",    "Leadership",   11, 3800),
        ("EMP-1009", "Nina Osei",      "NO", "nina.osei@company.com",     "AI Research",  11, 3500),
    ]
    other_emps = []
    for code, name, initials, email, dept, level, xp in other_employees_data:
        emp_id = _uid()
        sb.table("employees").insert({
            "id": emp_id,
            "employee_code": code,
            "full_name": name,
            "initials": initials,
            "email": email,
            "password_hash": hash_password("password123"),
            "department": dept,
            "role": "Engineer",
            "employment_status": "Active",
        }).execute()
        other_emps.append((emp_id, level, xp))

    print(f"  ✅ {1 + len(other_emps)} employees created")

    # ════════════════════════════════════════════════════════
    # 2. SKILLS (for Alex)
    # ════════════════════════════════════════════════════════
    skills_data = [
        # (name, category, sub_category, proficiency, target_level, years_exp, trend, ai_confidence, verified, source, recommendation)
        ("Kubernetes",           "Technical",  "DevOps",        90, 95, 5,   "up",     95, True,  "Project Repo",       "Complete CKA certification to reach expert level"),
        ("Terraform",            "Technical",  "DevOps",        85, 95, 4,   "up",     92, True,  "Project Repo",       "Lead infrastructure-as-code guild sessions"),
        ("React / Next.js",      "Technical",  "Programming",   88, 90, 6,   "stable", 89, True,  "GitHub",             "Build a microservice in Go for hands-on practice"),
        ("Go Programming",       "Technical",  "Programming",   65, 80, 2,   "stable", 70, False, "Self-Reported",      "Build a microservice in Go for hands-on practice"),
        ("AWS Architecture",     "Cloud",      "Cloud",         95, 95, 6,   "stable", 98, True,  "Certifications",     "Mentor others preparing for Solutions Architect Pro"),
        ("Azure Services",       "Cloud",      "Cloud",         75, 85, 3,   "up",     82, False, "Self-Reported",      "Complete AZ-305 certification path"),
        ("Cloud Security",       "Cloud",      "Cloud",         80, 90, 4,   "up",     85, True,  "Projects",           "Implement zero-trust patterns in migration phase 2"),
        ("Prompt Engineering",   "AI",         "AI Skills",     80, 90, 2,   "up",     85, True,  "Coursework",         "Build an internal AI assistant prototype"),
        ("MLOps",                "AI",         "Data Science",  70, 85, 3,   "up",     75, True,  "Projects",           "Enroll in AWS Machine Learning Specialty"),
        ("AI Ethics & Governance","AI",        "AI Skills",     60, 80, 1,   "stable", 65, False, "Self-Reported",      "Join the AI governance working group"),
        ("LLM Fine-tuning",      "AI",         "AI Skills",     45, 90, 1,   "up",     50, False, "Self-Reported",      "Take DeepLearning.AI fine-tuning course"),
        ("Vector Databases",     "AI",         "AI Skills",     30, 80, 0.5, "up",     35, False, "Self-Reported",      "Complete vector search fundamentals"),
        ("Communication",        "Soft",       "Communication", 80, 90, 8,   "up",     85, True,  "Peer Review",        "Present at the next engineering all-hands"),
        ("Collaboration",        "Soft",       "Teamwork",      90, 90, 8,   "stable", 88, True,  "Peer Review",        "Maintain cross-team collaboration excellence"),
        ("Team Leadership",      "Leadership", "Leadership",    70, 85, 3,   "up",     75, True,  "Peer Review",        "Take ownership of the cloud guild initiative"),
        ("Strategic Planning",   "Leadership", "Strategy",      50, 80, 3,   "up",     55, False, "Self-Reported",      "Contribute to the 2026 cloud roadmap"),
        ("System Design",        "Technical",  "Architecture",  85, 90, 5,   "up",     88, True,  "Architecture Board", "Continue leading architecture review sessions"),
    ]
    skills_to_insert = []
    for name, cat, sub, prof, target, yrs, trend, conf, verified, source, rec in skills_data:
        skills_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "name": name,
            "category": cat,
            "sub_category": sub,
            "proficiency": prof,
            "target_level": target,
            "years_experience": yrs,
            "trend": trend,
            "ai_confidence": conf,
            "verified": verified,
            "source": source,
            "ai_recommendation": rec,
        })
    sb.table("skills").insert(skills_to_insert).execute()
    print(f"  ✅ {len(skills_data)} skills created for Alex")

    # ════════════════════════════════════════════════════════
    # 3. GAMIFICATION PROFILES
    # ════════════════════════════════════════════════════════
    alex_gam_id = _uid()
    sb.table("gamification_profiles").insert({
        "id": alex_gam_id,
        "employee_id": alex_id,
        "level": 12,
        "xp": 4250,
        "next_level_xp": 5000,
        "total_xp_earned": 18450,
        "company_rank": 7,
        "department_rank": 2,
        "streak_days": 14,
        "longest_streak": 23,
        "title": "AI Pioneer",
    }).execute()

    # Profiles for other employees
    other_profiles = []
    for emp_id, level, xp in other_emps:
        title = "Legend" if level >= 18 else "AI Pioneer" if level >= 15 else "Expert"
        other_profiles.append({
            "id": _uid(),
            "employee_id": emp_id,
            "level": level,
            "xp": xp % 5000,
            "next_level_xp": 5000,
            "total_xp_earned": xp,
            "streak_days": level,
            "longest_streak": level + 5,
            "title": title,
        })
    sb.table("gamification_profiles").insert(other_profiles).execute()
    print("  ✅ Gamification profiles created")

    # ════════════════════════════════════════════════════════
    # 4. XP TRANSACTIONS (recent activity)
    # ════════════════════════════════════════════════════════
    xp_data = [
        (200, "Completed mission: Review AI Projects",          "learning",   "✅", 2),
        (150, "Skill DNA updated: +3 new skills",               "profile",    "🧬", 24),
        (100, "Knowledge upload: Architecture Design Doc",       "knowledge",  "📄", 48),
        (75,  "Peer recognition received from Priya S.",         "teamwork",   "👏", 72),
        (50,  "Daily check-in streak: Day 14",                   "streak",     "🔥", 96),
        (300, "Project milestone achieved: ML Platform v2",      "project",    "🎯", 120),
    ]
    monthly_xp = [(320, "Mar", 150), (480, "Apr", 120), (410, "May", 90),
                  (620, "Jun", 60), (550, "Jul", 30), (875, "Aug", 15)]

    xp_to_insert = []
    for amount, reason, cat, emoji, hours_ago in xp_data:
        xp_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "amount": amount,
            "reason": reason,
            "category": cat,
            "emoji": emoji,
            "created_at": (now - timedelta(hours=hours_ago)).isoformat(),
        })
    for month_xp, month_name, days_ago in monthly_xp:
        xp_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "amount": month_xp,
            "reason": f"Monthly learning & project XP ({month_name})",
            "category": "learning",
            "emoji": "📈",
            "created_at": (now - timedelta(days=days_ago)).isoformat(),
        })
    sb.table("xp_transactions").insert(xp_to_insert).execute()
    print("  ✅ XP transactions created")

    # ════════════════════════════════════════════════════════
    # 5. ACHIEVEMENTS
    # ════════════════════════════════════════════════════════
    month_map = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6, "Jul": 7}
    achievements_data = [
        ("First Steps",       "👣", "Complete your digital twin profile",              100,  "Common",    True,  "Jan 2024"),
        ("AI Pioneer",        "🤖", "Achieve AI Readiness score above 80",             500,  "Rare",      True,  "Mar 2024"),
        ("Skill Architect",   "🏗️", "Add 20+ skills to your DNA matrix",              300,  "Uncommon",  True,  "Feb 2024"),
        ("Team Magnet",       "🧲", "Get matched to 5+ team projects",                400,  "Uncommon",  True,  "Apr 2024"),
        ("Streak Legend",     "🔥", "Maintain a 30-day activity streak",               800,  "Epic",      False, None),
        ("Knowledge Oracle",  "📖", "Feed 10+ documents to your knowledge base",      450,  "Rare",      True,  "May 2024"),
        ("Top Performer",     "🏆", "Reach Top 5% company ranking",                   1000, "Legendary", False, None),
        ("Certified Expert",  "🎓", "Earn 3+ professional certifications",             600,  "Rare",      True,  "Jun 2024"),
        ("Speed Learner",     "⚡", "Complete 5 courses in one month",                700,  "Epic",      False, None),
        ("Mentor Mind",       "🌟", "Mentor 3 junior team members",                   550,  "Rare",      True,  "Jul 2024"),
        ("Innovation Spark",  "💡", "Submit an approved innovation proposal",          900,  "Epic",      False, None),
        ("Twin Synced",       "🔗", "Achieve 95%+ twin health score",                 1200, "Legendary", False, None),
    ]
    for name, emoji, desc, xp_val, rarity, unlocked, date_str in achievements_data:
        ach_id = _uid()
        sb.table("achievements").insert({
            "id": ach_id,
            "name": name,
            "emoji": emoji,
            "description": desc,
            "xp_value": xp_val,
            "rarity": rarity,
        }).execute()
        if unlocked and date_str:
            month_num = month_map.get(date_str.split()[0][:3], 1)
            sb.table("employee_achievements").insert({
                "id": _uid(),
                "employee_id": alex_id,
                "achievement_id": ach_id,
                "unlocked_at": datetime(2024, month_num, 1, tzinfo=timezone.utc).isoformat(),
            }).execute()
    print(f"  ✅ {len(achievements_data)} achievements created")

    # ════════════════════════════════════════════════════════
    # 6. CHALLENGES
    # ════════════════════════════════════════════════════════
    challenges_data = [
        ("AI Certification Sprint",    "Complete any AI/ML certification from the approved list within 7 days",  1500, "🤖", "Hard",   "weekly",  "Learning",   "#7c3aed", 3,  65),
        ("Collaboration Champion",     "Receive 5 peer recognitions this week for exceptional teamwork",         800,  "🤝", "Medium", "weekly",  "Teamwork",   "#06b6d4", 2,  80),
        ("Knowledge Sharer",           "Upload 3 documents or knowledge articles to your Twin knowledge base",   600,  "📚", "Easy",   "monthly", "Knowledge",  "#10b981", 8,  33),
        ("Project Ace",                "Achieve 90%+ success score on an active project milestone",              1200, "🎯", "Hard",   "monthly", "Projects",   "#f59e0b", 13, 45),
    ]
    for title, desc, xp_reward, badge, diff, typ, cat, color, days_left, progress in challenges_data:
        ch_id = _uid()
        sb.table("challenges").insert({
            "id": ch_id,
            "title": title,
            "description": desc,
            "xp_reward": xp_reward,
            "bonus_badge": badge,
            "difficulty": diff,
            "type": typ,
            "category": cat,
            "color": color,
            "start_date": (now - timedelta(days=14)).isoformat(),
            "end_date": (now + timedelta(days=days_left)).isoformat(),
        }).execute()
        sb.table("challenge_progress").insert({
            "id": _uid(),
            "employee_id": alex_id,
            "challenge_id": ch_id,
            "progress": progress,
        }).execute()
    print("  ✅ Challenges created")

    # ════════════════════════════════════════════════════════
    # 7. LEARNING PATHS
    # ════════════════════════════════════════════════════════
    paths_data = [
        ("AI Engineering Mastery",  "Deep dive into production AI systems, MLOps, and advanced architectures",
         68, 12, 8,  48, "Sep 2024", ["AI", "MLOps", "Python"],               "#7c3aed", True,  "Internal Academy",   "Dr. Lena Park"),
        ("Cloud Architecture Pro",  "AWS/GCP/Azure multi-cloud design patterns and certifications",
         35, 9,  3,  36, "Oct 2024", ["Cloud", "AWS", "Architecture"],         "#06b6d4", False, "Coursera",           "Marcus Chen"),
        ("Engineering Leadership",  "Transition from IC to tech lead with strategic thinking and people skills",
         15, 8,  1,  32, "Dec 2024", ["Leadership", "Management", "Strategy"], "#f59e0b", True,  "LinkedIn Learning",  "Sarah Williams"),
    ]
    paths_to_insert = []
    for title, desc, prog, total, completed, hours, due, tags, color, rec, platform, instructor in paths_data:
        paths_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "title": title,
            "description": desc,
            "progress": prog,
            "total_courses": total,
            "completed_courses": completed,
            "estimated_hours": hours,
            "due_date": due,
            "tags": tags,
            "color": color,
            "is_ai_recommended": rec,
            "platform": platform,
            "instructor": instructor,
        })
    sb.table("learning_paths").insert(paths_to_insert).execute()
    print("  ✅ Learning paths created")

    # ════════════════════════════════════════════════════════
    # 8. COURSES
    # ════════════════════════════════════════════════════════
    courses_data = [
        ("Deep Learning Specialization",            "Coursera",          64, "Advanced",     4.9, 2841, ["Deep Learning", "TensorFlow", "AI"],    "🧠", "#7c3aed", "available",   0),
        ("System Design Interview Masterclass",     "Educative",         40, "Intermediate", 4.8, 1203, ["Architecture", "System Design"],         "🏗️", "#06b6d4", "in_progress", 48),
        ("AWS Cloud Practitioner Essentials",       "AWS",               12, "Beginner",     4.7, 5021, ["Cloud", "AWS"],                          "☁️", "#f59e0b", "completed",   100),
        ("The Manager's Path",                      "O'Reilly",          20, "Intermediate", 4.8, 891,  ["Leadership", "Management"],              "🎯", "#10b981", "available",   0),
        ("LangChain & LLM Application Development","DeepLearning.AI",   24, "Advanced",     4.9, 1452, ["LLM", "LangChain", "Python"],            "⛓️", "#7c3aed", "available",   0),
        ("Data Engineering Zoomcamp",               "DataTalks.Club",    80, "Advanced",     4.7, 3210, ["Data Engineering", "Spark", "dbt"],      "🔧", "#ec4899", "available",   0),
    ]
    for title, provider, hours, level, rating, enrolled, tags, emoji, color, emp_status, emp_progress in courses_data:
        course_id = _uid()
        sb.table("courses").insert({
            "id": course_id,
            "title": title,
            "provider": provider,
            "hours": hours,
            "level": level,
            "rating": rating,
            "enrolled_count": enrolled,
            "tags": tags,
            "emoji": emoji,
            "color": color,
        }).execute()
        if emp_status != "available":
            ec_data = {
                "id": _uid(),
                "employee_id": alex_id,
                "course_id": course_id,
                "status": emp_status,
                "progress": emp_progress,
                "started_at": (now - timedelta(days=30)).isoformat(),
            }
            if emp_status == "completed":
                ec_data["completed_at"] = (now - timedelta(days=5)).isoformat()
            sb.table("employee_courses").insert(ec_data).execute()
    print(f"  ✅ {len(courses_data)} courses created")

    # ════════════════════════════════════════════════════════
    # 9. CERTIFICATIONS
    # ════════════════════════════════════════════════════════
    certs_data = [
        ("AWS Solutions Architect – Professional",    "Amazon Web Services", "completed",   89,  100, "AWS-SAP-2024-AC7821", "☁️", "#f59e0b", "Aug 15, 2024"),
        ("TensorFlow Developer Certificate",          "Google",              "completed",   94,  100, "TF-DEV-2024-1094",    "🤖", "#7c3aed", None),
        ("Kubernetes Administrator (CKA)",            "CNCF",                "in_progress", None, 72, None,                  "⚙️", "#06b6d4", "Aug 15, 2024"),
        ("Professional Scrum Master II",              "Scrum.org",           "completed",   88,  100, "PSM-II-SG-8821",      "🎯", "#10b981", None),
        ("Google Cloud Professional Data Engineer",   "Google Cloud",        "planned",     None, 0,  None,                  "📊", "#06b6d4", "Nov 2024"),
    ]
    certs_to_insert = []
    for name, issuer, st, score, prog, cred, emoji, color, exam in certs_data:
        certs_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "name": name,
            "issuer": issuer,
            "status": st,
            "score": score,
            "progress": prog,
            "credential_id": cred,
            "emoji": emoji,
            "color": color,
            "exam_date": exam,
        })
    sb.table("certifications").insert(certs_to_insert).execute()
    print("  ✅ Certifications created")

    # ════════════════════════════════════════════════════════
    # 10. WEEKLY SCHEDULE
    # ════════════════════════════════════════════════════════
    schedule_data = [
        ("Mon", "LLM Fine-tuning Lab",                    "45 min", "completed",  "#10b981"),
        ("Tue", "CKA Exam Prep — Networking",              "30 min", "completed",  "#10b981"),
        ("Wed", "System Design: Distributed Systems",      "60 min", "in_progress","#f59e0b"),
        ("Thu", "Vector Database Workshop",                "45 min", "upcoming",   "#64748b"),
        ("Fri", "Engineering Leadership Seminar",          "30 min", "upcoming",   "#64748b"),
    ]
    schedule_to_insert = []
    for day, topic, dur, st, color in schedule_data:
        schedule_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "day": day,
            "topic": topic,
            "duration": dur,
            "status": st,
            "color": color,
        })
    sb.table("weekly_schedule_entries").insert(schedule_to_insert).execute()
    print("  ✅ Weekly schedule created")

    # ════════════════════════════════════════════════════════
    # 11. CAREER GOAL + ROADMAP
    # ════════════════════════════════════════════════════════
    goal_id = _uid()
    sb.table("career_goals").insert({
        "id": goal_id,
        "employee_id": alex_id,
        "target_role": "Cloud Architect",
        "timeline": "12-18 Months",
        "focus_area": "Tech / Cloud",
        "target_industry": "Tech / Cloud",
        "readiness_score": 65,
    }).execute()

    roadmap_steps = [
        (1, "Senior Cloud Engineer", "achieved"),
        (2, "Lead Cloud Projects",   "in_progress"),
        (3, "System Design Mastery", "upcoming"),
        (4, "Cloud Architect",       "goal"),
    ]
    steps_to_insert = []
    for order, title, st in roadmap_steps:
        steps_to_insert.append({
            "id": _uid(),
            "career_goal_id": goal_id,
            "step_order": order,
            "title": title,
            "status": st,
        })
    sb.table("career_roadmap_steps").insert(steps_to_insert).execute()
    print("  ✅ Career goal + roadmap created")

    # ════════════════════════════════════════════════════════
    # 12. KNOWLEDGE SOURCES
    # ════════════════════════════════════════════════════════
    ks_data = [
        ("LinkedIn Profile",              "Integration", True, 85, 24, 6,  92, 2),
        ("Alex_Carter_CV_2026.pdf",       "File",        True, 95, 32, 12, 96, 24),
        ("GitHub Connect",                "Integration", True, 70, 18, 15, 99, 168),
        ("Q1_Performance_Review.docx",    "File",        True, 60, 10, 3,  90, 720),
    ]
    ks_to_insert = []
    for name, typ, connected, coverage, skills_ex, projects, conf, hours_ago in ks_data:
        ks_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "name": name,
            "type": typ,
            "connected": connected,
            "coverage": coverage,
            "skills_extracted": skills_ex,
            "projects_found": projects,
            "confidence": conf,
            "last_synced": (now - timedelta(hours=hours_ago)).isoformat(),
        })
    sb.table("knowledge_sources").insert(ks_to_insert).execute()
    print("  ✅ Knowledge sources created")

    # ════════════════════════════════════════════════════════
    # 13. PROJECTS
    # ════════════════════════════════════════════════════════
    projects_data = [
        ("Cloud Migration Phase 2",  "Lead Architect",   "Migrating legacy on-prem databases to AWS RDS with zero downtime.",
         ["AWS", "Terraform", "PostgreSQL"], "6 Months", "Infrastructure", "High",   92, 88, None, "On Track"),
        ("AI Talent Marketplace",    "Backend Engineer",  "Building the matching engine for the internal talent marketplace.",
         ["Go", "Kubernetes", "Redis"],      "3 Months", "HR Tech",        "Medium", 85, 75, None, "At Risk"),
        ("Auth Service V2",          "Senior Engineer",   "Rewrote the core authentication service to support OAuth2 and SSO.",
         ["Node.js", "Redis", "OAuth2"],     "4 Months", "Security",       "High",   98, 85, 4.8,  "Completed"),
    ]
    projects_to_insert = []
    for name, role, desc, tech, dur, domain, complexity, success, leadership, rating, st in projects_data:
        projects_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "name": name,
            "role": role,
            "description": desc,
            "technologies": tech,
            "duration": dur,
            "domain": domain,
            "complexity": complexity,
            "success_score": success,
            "leadership_score": leadership,
            "customer_rating": rating,
            "status": st,
        })
    sb.table("projects").insert(projects_to_insert).execute()
    print("  ✅ Projects created")

    # ════════════════════════════════════════════════════════
    # 14. RECOGNITIONS
    # ════════════════════════════════════════════════════════
    recognitions_data = [
        ("award",        "Cloud Excellence Award",      "Recognized for leading successful AWS migration reducing latency by 35%",    "2025-11-15", "CTO Office"),
        ("innovation",   "Innovation Champion",          "Designed automated IaC pipeline adopted across 4 engineering teams",         "2025-09-22", "Innovation Council"),
        ("peer",         "Peer Recognition — 47 Kudos", "Top peer-nominated engineer in Q4 for mentorship and collaboration",         "2025-12-01", "Engineering Team"),
        ("mentoring",    "Mentor of the Quarter",        "Mentored 3 junior engineers through cloud certification journeys",           "2025-10-10", "People & Culture"),
        ("eom",          "Employee of the Month",        "Outstanding contribution to Cloud Migration Phase 1 delivery",               "2025-08-01", "Leadership Team"),
        ("top-performer","Top Performer — H1 2025",     "Exceeded all performance objectives with 4.8/5 rating",                      "2025-07-15", "HR Analytics"),
    ]
    recs_to_insert = []
    for typ, title, desc, date, awarded_by in recognitions_data:
        recs_to_insert.append({
            "id": _uid(),
            "employee_id": alex_id,
            "type": typ,
            "title": title,
            "description": desc,
            "date": date,
            "awarded_by": awarded_by,
        })
    sb.table("recognitions").insert(recs_to_insert).execute()
    print("  ✅ Recognitions created")

    # ════════════════════════════════════════════════════════
    # 15. REWARD STORE
    # ════════════════════════════════════════════════════════
    rewards_data = [
        ("Extra WFH Day",          "One additional work-from-home day of your choice",   2000, "🏠", "Flexibility", True),
        ("Learning Budget +$100",  "Add $100 to your L&D budget this month",             1500, "📚", "Learning",    True),
        ("Wellness Voucher",       "$50 wellness and mental health credit",               1200, "🧘", "Wellness",    True),
        ("Conference Pass",        "Attend one industry conference of your choice",       5000, "🎤", "Career",      False),
        ("Lunch with Leadership",  "Private lunch with C-suite executives",               3500, "🍽️", "Networking",  True),
        ("Early Finish Friday",    "Leave 2 hours early any Friday this month",           800,  "🎉", "Flexibility", True),
    ]
    rewards_to_insert = []
    for name, desc, cost, emoji, cat, available in rewards_data:
        rewards_to_insert.append({
            "id": _uid(),
            "name": name,
            "description": desc,
            "cost": cost,
            "emoji": emoji,
            "category": cat,
            "available": available,
        })
    sb.table("reward_items").insert(rewards_to_insert).execute()
    print("  ✅ Reward store items created")

    print("\n🎉 Supabase database seeded successfully!")
    print("   Login with: alex.carter@company.com / password123")


if __name__ == "__main__":
    seed()

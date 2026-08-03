"""
Seed the database with all the mock data from the frontend.

Run with: python -m scripts.seed_database
"""

import uuid
from datetime import datetime, timezone, timedelta

from app.database import engine, SessionLocal, Base
from app.models import (
    Employee, Skill, GamificationProfile, XPTransaction,
    Achievement, EmployeeAchievement, Challenge, ChallengeProgress,
    LearningPath, Course, EmployeeCourse, Certification, WeeklyScheduleEntry,
    CareerGoal, CareerRoadmapStep, KnowledgeSource,
    RewardItem, RewardClaim, Recognition, Project,
)
from app.utils.auth import hash_password


def seed():
    """Seed the database with comprehensive mock data matching the frontend."""
    print("🌱 Starting database seed...")

    # Create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("  ✅ Tables created")

    db = SessionLocal()
    try:
        # ════════════════════════════════════════════════════════
        # 1. EMPLOYEES
        # ════════════════════════════════════════════════════════
        alex = Employee(
            employee_code="EMP-2847",
            full_name="Alex Carter",
            initials="AC",
            email="alex.carter@company.com",
            password_hash=hash_password("password123"),
            department="Product & Engineering",
            role="Senior Cloud Engineer",
            team="Cloud Platform Foundation",
            manager_name="Sarah Mitchell (Director of Eng.)",
            location="Colombo, Sri Lanka",
            timezone_str="IST (UTC+5:30)",
            phone="+94 77 123 4567",
            education=[
                "MSc Computer Science — University of Colombo (2018)",
                "BSc Software Engineering — University of Moratuwa (2016)",
            ],
            languages=[
                {"name": "English", "proficiency": "Native"},
                {"name": "Sinhala", "proficiency": "Native"},
                {"name": "Tamil", "proficiency": "Conversational"},
            ],
            biography="Senior Cloud Engineer with 8 years of experience architecting scalable cloud infrastructure on AWS and Azure. Passionate about platform engineering, DevSecOps, and mentoring junior engineers. Currently leading the enterprise cloud migration initiative while building internal identity intelligence capabilities.",
            headline="Architecting the future of cloud platforms",
            years_experience=8,
            years_in_company=4,
            employment_type="Full-Time",
            employment_status="Active",
            twin_health=96,
            ai_confidence=94,
            profile_completeness=98,
        )
        db.add(alex)

        # Other employees for leaderboard
        other_employees_data = [
            ("EMP-1001", "Priya Sharma", "PS", "priya.sharma@company.com", "AI Research", 18, 9840),
            ("EMP-1002", "Marcus Lee", "ML", "marcus.lee@company.com", "Engineering", 16, 8210),
            ("EMP-1003", "Sofia Reyes", "SR", "sofia.reyes@company.com", "Product", 15, 7450),
            ("EMP-1004", "James O'Brien", "JO", "james.obrien@company.com", "Leadership", 14, 6900),
            ("EMP-1005", "Aisha Khan", "AK", "aisha.khan@company.com", "Engineering", 14, 6600),
            ("EMP-1006", "David Chen", "DC", "david.chen@company.com", "Data Science", 13, 5200),
            ("EMP-1007", "Riya Patel", "RP", "riya.patel@company.com", "Product", 12, 4100),
            ("EMP-1008", "Tom Wright", "TW", "tom.wright@company.com", "Leadership", 11, 3800),
            ("EMP-1009", "Nina Osei", "NO", "nina.osei@company.com", "AI Research", 11, 3500),
        ]
        other_emps = []
        for code, name, initials, email, dept, level, xp in other_employees_data:
            emp = Employee(
                employee_code=code, full_name=name, initials=initials, email=email,
                password_hash=hash_password("password123"),
                department=dept, role="Engineer", employment_status="Active",
            )
            db.add(emp)
            other_emps.append((emp, level, xp))

        db.flush()
        print(f"  ✅ {1 + len(other_emps)} employees created")

        # ════════════════════════════════════════════════════════
        # 2. SKILLS (for Alex)
        # ════════════════════════════════════════════════════════
        skills_data = [
            # Technical
            ("Kubernetes", "Technical", "DevOps", 90, 95, 5, "up", 95, True, "Project Repo", "Complete CKA certification to reach expert level"),
            ("Terraform", "Technical", "DevOps", 85, 95, 4, "up", 92, True, "Project Repo", "Lead infrastructure-as-code guild sessions"),
            ("React / Next.js", "Technical", "Programming", 88, 90, 6, "stable", 89, True, "GitHub", "Build a microservice in Go for hands-on practice"),
            ("Go Programming", "Technical", "Programming", 65, 80, 2, "stable", 70, False, "Self-Reported", "Build a microservice in Go for hands-on practice"),
            # Cloud
            ("AWS Architecture", "Cloud", "Cloud", 95, 95, 6, "stable", 98, True, "Certifications", "Mentor others preparing for Solutions Architect Pro"),
            ("Azure Services", "Cloud", "Cloud", 75, 85, 3, "up", 82, False, "Self-Reported", "Complete AZ-305 certification path"),
            ("Cloud Security", "Cloud", "Cloud", 80, 90, 4, "up", 85, True, "Projects", "Implement zero-trust patterns in migration phase 2"),
            # AI
            ("Prompt Engineering", "AI", "AI Skills", 80, 90, 2, "up", 85, True, "Coursework", "Build an internal AI assistant prototype"),
            ("MLOps", "AI", "Data Science", 70, 85, 3, "up", 75, True, "Projects", "Enroll in AWS Machine Learning Specialty"),
            ("AI Ethics & Governance", "AI", "AI Skills", 60, 80, 1, "stable", 65, False, "Self-Reported", "Join the AI governance working group"),
            ("LLM Fine-tuning", "AI", "AI Skills", 45, 90, 1, "up", 50, False, "Self-Reported", "Take DeepLearning.AI fine-tuning course"),
            ("Vector Databases", "AI", "AI Skills", 30, 80, 0.5, "up", 35, False, "Self-Reported", "Complete vector search fundamentals"),
            # Soft / Leadership
            ("Communication", "Soft", "Communication", 80, 90, 8, "up", 85, True, "Peer Review", "Present at the next engineering all-hands"),
            ("Collaboration", "Soft", "Teamwork", 90, 90, 8, "stable", 88, True, "Peer Review", "Maintain cross-team collaboration excellence"),
            ("Team Leadership", "Leadership", "Leadership", 70, 85, 3, "up", 75, True, "Peer Review", "Take ownership of the cloud guild initiative"),
            ("Strategic Planning", "Leadership", "Strategy", 50, 80, 3, "up", 55, False, "Self-Reported", "Contribute to the 2026 cloud roadmap"),
            ("System Design", "Technical", "Architecture", 85, 90, 5, "up", 88, True, "Architecture Board", "Continue leading architecture review sessions"),
        ]
        for name, cat, sub, prof, target, yrs, trend, conf, verified, source, rec in skills_data:
            db.add(Skill(
                employee_id=alex.id, name=name, category=cat, sub_category=sub,
                proficiency=prof, target_level=target, years_experience=yrs,
                trend=trend, ai_confidence=conf, verified=verified, source=source,
                ai_recommendation=rec,
            ))
        print(f"  ✅ {len(skills_data)} skills created for Alex")

        # ════════════════════════════════════════════════════════
        # 3. GAMIFICATION PROFILES
        # ════════════════════════════════════════════════════════
        alex_gam = GamificationProfile(
            employee_id=alex.id, level=12, xp=4250, next_level_xp=5000,
            total_xp_earned=18450, company_rank=7, department_rank=2,
            streak_days=14, longest_streak=23, title="AI Pioneer",
        )
        db.add(alex_gam)

        # Profiles for other employees
        for emp, level, xp in other_emps:
            db.add(GamificationProfile(
                employee_id=emp.id, level=level, xp=xp % 5000,
                next_level_xp=5000, total_xp_earned=xp,
                streak_days=level, longest_streak=level + 5,
                title="Legend" if level >= 18 else "AI Pioneer" if level >= 15 else "Expert",
            ))
        print("  ✅ Gamification profiles created")

        # ════════════════════════════════════════════════════════
        # 4. XP TRANSACTIONS (recent activity)
        # ════════════════════════════════════════════════════════
        xp_data = [
            (200, "Completed mission: Review AI Projects", "learning", "✅", 2),
            (150, "Skill DNA updated: +3 new skills", "profile", "🧬", 24),
            (100, "Knowledge upload: Architecture Design Doc", "knowledge", "📄", 48),
            (75, "Peer recognition received from Priya S.", "teamwork", "👏", 72),
            (50, "Daily check-in streak: Day 14", "streak", "🔥", 96),
            (300, "Project milestone achieved: ML Platform v2", "project", "🎯", 120),
        ]
        for amount, reason, cat, emoji, hours_ago in xp_data:
            db.add(XPTransaction(
                employee_id=alex.id, amount=amount, reason=reason,
                category=cat, emoji=emoji,
                created_at=datetime.now(timezone.utc) - timedelta(hours=hours_ago),
            ))
        print("  ✅ XP transactions created")

        # ════════════════════════════════════════════════════════
        # 5. ACHIEVEMENTS
        # ════════════════════════════════════════════════════════
        achievements_data = [
            ("First Steps", "👣", "Complete your digital twin profile", 100, "Common", True, "Jan 2024"),
            ("AI Pioneer", "🤖", "Achieve AI Readiness score above 80", 500, "Rare", True, "Mar 2024"),
            ("Skill Architect", "🏗️", "Add 20+ skills to your DNA matrix", 300, "Uncommon", True, "Feb 2024"),
            ("Team Magnet", "🧲", "Get matched to 5+ team projects", 400, "Uncommon", True, "Apr 2024"),
            ("Streak Legend", "🔥", "Maintain a 30-day activity streak", 800, "Epic", False, None),
            ("Knowledge Oracle", "📖", "Feed 10+ documents to your knowledge base", 450, "Rare", True, "May 2024"),
            ("Top Performer", "🏆", "Reach Top 5% company ranking", 1000, "Legendary", False, None),
            ("Certified Expert", "🎓", "Earn 3+ professional certifications", 600, "Rare", True, "Jun 2024"),
            ("Speed Learner", "⚡", "Complete 5 courses in one month", 700, "Epic", False, None),
            ("Mentor Mind", "🌟", "Mentor 3 junior team members", 550, "Rare", True, "Jul 2024"),
            ("Innovation Spark", "💡", "Submit an approved innovation proposal", 900, "Epic", False, None),
            ("Twin Synced", "🔗", "Achieve 95%+ twin health score", 1200, "Legendary", False, None),
        ]
        for name, emoji, desc, xp, rarity, unlocked, date in achievements_data:
            ach = Achievement(
                name=name, emoji=emoji, description=desc,
                xp_value=xp, rarity=rarity,
            )
            db.add(ach)
            db.flush()
            if unlocked:
                db.add(EmployeeAchievement(
                    employee_id=alex.id, achievement_id=ach.id,
                    unlocked_at=datetime(2024, int(date.split()[0][:3] == "Jan" and 1 or
                                                   date.split()[0][:3] == "Feb" and 2 or
                                                   date.split()[0][:3] == "Mar" and 3 or
                                                   date.split()[0][:3] == "Apr" and 4 or
                                                   date.split()[0][:3] == "May" and 5 or
                                                   date.split()[0][:3] == "Jun" and 6 or 7),
                                         1, tzinfo=timezone.utc) if date else None,
                ))
        print(f"  ✅ {len(achievements_data)} achievements created")

        # ════════════════════════════════════════════════════════
        # 6. CHALLENGES
        # ════════════════════════════════════════════════════════
        now = datetime.now(timezone.utc)
        challenges_data = [
            ("AI Certification Sprint", "Complete any AI/ML certification from the approved list within 7 days",
             1500, "🤖", "Hard", "weekly", "Learning", "#7c3aed", 3, 65),
            ("Collaboration Champion", "Receive 5 peer recognitions this week for exceptional teamwork",
             800, "🤝", "Medium", "weekly", "Teamwork", "#06b6d4", 2, 80),
            ("Knowledge Sharer", "Upload 3 documents or knowledge articles to your Twin knowledge base",
             600, "📚", "Easy", "monthly", "Knowledge", "#10b981", 8, 33),
            ("Project Ace", "Achieve 90%+ success score on an active project milestone",
             1200, "🎯", "Hard", "monthly", "Projects", "#f59e0b", 13, 45),
        ]
        for title, desc, xp, badge, diff, typ, cat, color, days_left, progress in challenges_data:
            ch = Challenge(
                title=title, description=desc, xp_reward=xp,
                bonus_badge=badge, difficulty=diff, type=typ,
                category=cat, color=color,
                start_date=now - timedelta(days=14),
                end_date=now + timedelta(days=days_left),
            )
            db.add(ch)
            db.flush()
            db.add(ChallengeProgress(
                employee_id=alex.id, challenge_id=ch.id, progress=progress,
            ))
        print("  ✅ Challenges created")

        # ════════════════════════════════════════════════════════
        # 7. LEARNING PATHS
        # ════════════════════════════════════════════════════════
        paths_data = [
            ("AI Engineering Mastery", "Deep dive into production AI systems, MLOps, and advanced architectures",
             68, 12, 8, 48, "Sep 2024", ["AI", "MLOps", "Python"], "#7c3aed", True, "Internal Academy", "Dr. Lena Park"),
            ("Cloud Architecture Pro", "AWS/GCP/Azure multi-cloud design patterns and certifications",
             35, 9, 3, 36, "Oct 2024", ["Cloud", "AWS", "Architecture"], "#06b6d4", False, "Coursera", "Marcus Chen"),
            ("Engineering Leadership", "Transition from IC to tech lead with strategic thinking and people skills",
             15, 8, 1, 32, "Dec 2024", ["Leadership", "Management", "Strategy"], "#f59e0b", True, "LinkedIn Learning", "Sarah Williams"),
        ]
        for title, desc, prog, total, completed, hours, due, tags, color, rec, platform, instructor in paths_data:
            db.add(LearningPath(
                employee_id=alex.id, title=title, description=desc,
                progress=prog, total_courses=total, completed_courses=completed,
                estimated_hours=hours, due_date=due, tags=tags, color=color,
                is_ai_recommended=rec, platform=platform, instructor=instructor,
            ))
        print("  ✅ Learning paths created")

        # ════════════════════════════════════════════════════════
        # 8. COURSES
        # ════════════════════════════════════════════════════════
        courses_data = [
            ("Deep Learning Specialization", "Coursera", 64, "Advanced", 4.9, 2841, ["Deep Learning", "TensorFlow", "AI"], "🧠", "#7c3aed", "available", 0),
            ("System Design Interview Masterclass", "Educative", 40, "Intermediate", 4.8, 1203, ["Architecture", "System Design"], "🏗️", "#06b6d4", "in_progress", 48),
            ("AWS Cloud Practitioner Essentials", "AWS", 12, "Beginner", 4.7, 5021, ["Cloud", "AWS"], "☁️", "#f59e0b", "completed", 100),
            ("The Manager's Path", "O'Reilly", 20, "Intermediate", 4.8, 891, ["Leadership", "Management"], "🎯", "#10b981", "available", 0),
            ("LangChain & LLM Application Development", "DeepLearning.AI", 24, "Advanced", 4.9, 1452, ["LLM", "LangChain", "Python"], "⛓️", "#7c3aed", "available", 0),
            ("Data Engineering Zoomcamp", "DataTalks.Club", 80, "Advanced", 4.7, 3210, ["Data Engineering", "Spark", "dbt"], "🔧", "#ec4899", "available", 0),
        ]
        for title, provider, hours, level, rating, enrolled, tags, emoji, color, emp_status, emp_progress in courses_data:
            course = Course(
                title=title, provider=provider, hours=hours, level=level,
                rating=rating, enrolled_count=enrolled, tags=tags,
                emoji=emoji, color=color,
            )
            db.add(course)
            db.flush()
            if emp_status != "available":
                db.add(EmployeeCourse(
                    employee_id=alex.id, course_id=course.id,
                    status=emp_status, progress=emp_progress,
                    started_at=now - timedelta(days=30),
                    completed_at=now - timedelta(days=5) if emp_status == "completed" else None,
                ))
        print(f"  ✅ {len(courses_data)} courses created")

        # ════════════════════════════════════════════════════════
        # 9. CERTIFICATIONS
        # ════════════════════════════════════════════════════════
        certs_data = [
            ("AWS Solutions Architect – Professional", "Amazon Web Services", "completed", 89, 100, "AWS-SAP-2024-AC7821", "☁️", "#f59e0b", "Aug 15, 2024"),
            ("TensorFlow Developer Certificate", "Google", "completed", 94, 100, "TF-DEV-2024-1094", "🤖", "#7c3aed", None),
            ("Kubernetes Administrator (CKA)", "CNCF", "in_progress", None, 72, None, "⚙️", "#06b6d4", "Aug 15, 2024"),
            ("Professional Scrum Master II", "Scrum.org", "completed", 88, 100, "PSM-II-SG-8821", "🎯", "#10b981", None),
            ("Google Cloud Professional Data Engineer", "Google Cloud", "planned", None, 0, None, "📊", "#06b6d4", "Nov 2024"),
        ]
        for name, issuer, st, score, prog, cred, emoji, color, exam in certs_data:
            db.add(Certification(
                employee_id=alex.id, name=name, issuer=issuer,
                status=st, score=score, progress=prog,
                credential_id=cred, emoji=emoji, color=color, exam_date=exam,
            ))
        print("  ✅ Certifications created")

        # ════════════════════════════════════════════════════════
        # 10. WEEKLY SCHEDULE
        # ════════════════════════════════════════════════════════
        schedule_data = [
            ("Mon", "LLM Fine-tuning Lab", "45 min", "completed", "#10b981"),
            ("Tue", "CKA Exam Prep — Networking", "30 min", "completed", "#10b981"),
            ("Wed", "System Design: Distributed Systems", "60 min", "in_progress", "#f59e0b"),
            ("Thu", "Vector Database Workshop", "45 min", "upcoming", "#64748b"),
            ("Fri", "Engineering Leadership Seminar", "30 min", "upcoming", "#64748b"),
        ]
        for day, topic, dur, st, color in schedule_data:
            db.add(WeeklyScheduleEntry(
                employee_id=alex.id, day=day, topic=topic,
                duration=dur, status=st, color=color,
            ))
        print("  ✅ Weekly schedule created")

        # ════════════════════════════════════════════════════════
        # 11. CAREER GOAL + ROADMAP
        # ════════════════════════════════════════════════════════
        goal = CareerGoal(
            employee_id=alex.id,
            target_role="Cloud Architect",
            timeline="12-18 Months",
            focus_area="Tech / Cloud",
            target_industry="Tech / Cloud",
            readiness_score=65,
        )
        db.add(goal)
        db.flush()

        roadmap_steps = [
            (1, "Senior Cloud Engineer", "achieved"),
            (2, "Lead Cloud Projects", "in_progress"),
            (3, "System Design Mastery", "upcoming"),
            (4, "Cloud Architect", "goal"),
        ]
        for order, title, st in roadmap_steps:
            db.add(CareerRoadmapStep(
                career_goal_id=goal.id, step_order=order, title=title, status=st,
            ))
        print("  ✅ Career goal + roadmap created")

        # ════════════════════════════════════════════════════════
        # 12. KNOWLEDGE SOURCES
        # ════════════════════════════════════════════════════════
        ks_data = [
            ("LinkedIn Profile", "Integration", True, 85, 24, 6, 92, 2),
            ("Alex_Carter_CV_2026.pdf", "File", True, 95, 32, 12, 96, 24),
            ("GitHub Connect", "Integration", True, 70, 18, 15, 99, 168),
            ("Q1_Performance_Review.docx", "File", True, 60, 10, 3, 90, 720),
        ]
        for name, typ, connected, coverage, skills_ex, projects, conf, hours_ago in ks_data:
            db.add(KnowledgeSource(
                employee_id=alex.id, name=name, type=typ, connected=connected,
                coverage=coverage, skills_extracted=skills_ex,
                projects_found=projects, confidence=conf,
                last_synced=now - timedelta(hours=hours_ago),
            ))
        print("  ✅ Knowledge sources created")

        # ════════════════════════════════════════════════════════
        # 13. PROJECTS
        # ════════════════════════════════════════════════════════
        projects_data = [
            ("Cloud Migration Phase 2", "Lead Architect", "Migrating legacy on-prem databases to AWS RDS with zero downtime.",
             ["AWS", "Terraform", "PostgreSQL"], "6 Months", "Infrastructure", "High", 92, 88, None, "On Track"),
            ("AI Talent Marketplace", "Backend Engineer", "Building the matching engine for the internal talent marketplace.",
             ["Go", "Kubernetes", "Redis"], "3 Months", "HR Tech", "Medium", 85, 75, None, "At Risk"),
            ("Auth Service V2", "Senior Engineer", "Rewrote the core authentication service to support OAuth2 and SSO.",
             ["Node.js", "Redis", "OAuth2"], "4 Months", "Security", "High", 98, 85, 4.8, "Completed"),
        ]
        for name, role, desc, tech, dur, domain, complexity, success, leadership, rating, st in projects_data:
            db.add(Project(
                employee_id=alex.id, name=name, role=role, description=desc,
                technologies=tech, duration=dur, domain=domain, complexity=complexity,
                success_score=success, leadership_score=leadership,
                customer_rating=rating, status=st,
            ))
        print("  ✅ Projects created")

        # ════════════════════════════════════════════════════════
        # 14. RECOGNITIONS
        # ════════════════════════════════════════════════════════
        recognitions_data = [
            ("award", "Cloud Excellence Award", "Recognized for leading successful AWS migration reducing latency by 35%", "2025-11-15", "CTO Office"),
            ("innovation", "Innovation Champion", "Designed automated IaC pipeline adopted across 4 engineering teams", "2025-09-22", "Innovation Council"),
            ("peer", "Peer Recognition — 47 Kudos", "Top peer-nominated engineer in Q4 for mentorship and collaboration", "2025-12-01", "Engineering Team"),
            ("mentoring", "Mentor of the Quarter", "Mentored 3 junior engineers through cloud certification journeys", "2025-10-10", "People & Culture"),
            ("eom", "Employee of the Month", "Outstanding contribution to Cloud Migration Phase 1 delivery", "2025-08-01", "Leadership Team"),
            ("top-performer", "Top Performer — H1 2025", "Exceeded all performance objectives with 4.8/5 rating", "2025-07-15", "HR Analytics"),
        ]
        for typ, title, desc, date, awarded_by in recognitions_data:
            db.add(Recognition(
                employee_id=alex.id, type=typ, title=title,
                description=desc, date=date, awarded_by=awarded_by,
            ))
        print("  ✅ Recognitions created")

        # ════════════════════════════════════════════════════════
        # 15. REWARD STORE
        # ════════════════════════════════════════════════════════
        rewards_data = [
            ("Extra WFH Day", "One additional work-from-home day of your choice", 2000, "🏠", "Flexibility", True),
            ("Learning Budget +$100", "Add $100 to your L&D budget this month", 1500, "📚", "Learning", True),
            ("Wellness Voucher", "$50 wellness and mental health credit", 1200, "🧘", "Wellness", True),
            ("Conference Pass", "Attend one industry conference of your choice", 5000, "🎤", "Career", False),
            ("Lunch with Leadership", "Private lunch with C-suite executives", 3500, "🍽️", "Networking", True),
            ("Early Finish Friday", "Leave 2 hours early any Friday this month", 800, "🎉", "Flexibility", True),
        ]
        for name, desc, cost, emoji, cat, available in rewards_data:
            db.add(RewardItem(
                name=name, description=desc, cost=cost,
                emoji=emoji, category=cat, available=available,
            ))
        print("  ✅ Reward store items created")

        db.commit()
        print("\n🎉 Database seeded successfully!")
        print(f"   Login with: alex.carter@company.com / password123")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

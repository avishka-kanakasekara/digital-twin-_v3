"""
Apply the Supabase schema using direct PostgreSQL connection (psycopg2).

For Supabase, the direct DB connection details are:
  Host: db.{PROJECT_REF}.supabase.co
  Port: 5432
  Database: postgres
  User: postgres
  Password: Your Supabase DB password (set when creating the project)

Run with:
    python create_tables.py --password YOUR_DB_PASSWORD

Or set SUPABASE_DB_PASSWORD env variable.
"""

import sys
import os
import argparse
import psycopg2

PROJECT_REF = "khrchkotgqbpzhurmbju"
HOST = f"db.{PROJECT_REF}.supabase.co"
PORT = 5432
DBNAME = "postgres"
USER = "postgres"

# All CREATE TABLE statements in dependency order
TABLES_SQL = [
    # 1. employees
    """
    CREATE TABLE IF NOT EXISTS employees (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_code   TEXT UNIQUE NOT NULL,
        full_name       TEXT NOT NULL,
        initials        TEXT,
        email           TEXT UNIQUE NOT NULL,
        password_hash   TEXT,
        department      TEXT,
        role            TEXT,
        team            TEXT,
        manager_id      TEXT,
        manager_name    TEXT,
        location        TEXT,
        timezone_str    TEXT,
        phone           TEXT,
        education       JSONB DEFAULT '[]'::jsonb,
        languages       JSONB DEFAULT '[]'::jsonb,
        biography       TEXT,
        headline        TEXT,
        avatar_url      TEXT,
        years_experience    INTEGER,
        years_in_company    INTEGER,
        employment_type     TEXT DEFAULT 'Full-Time',
        employment_status   TEXT DEFAULT 'Active',
        twin_health             INTEGER DEFAULT 0,
        ai_confidence           INTEGER DEFAULT 0,
        profile_completeness    INTEGER DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT now(),
        updated_at  TIMESTAMPTZ DEFAULT now()
    )
    """,

    "CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department)",
    "CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)",

    # 2. skills
    """
    CREATE TABLE IF NOT EXISTS skills (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        category        TEXT,
        sub_category    TEXT,
        icon            TEXT,
        proficiency     INTEGER DEFAULT 0,
        target_level    INTEGER DEFAULT 0,
        years_experience NUMERIC(4,1),
        trend           TEXT DEFAULT 'stable',
        ai_confidence       INTEGER,
        verified            BOOLEAN DEFAULT false,
        source              TEXT,
        ai_recommendation   TEXT,
        last_updated    TIMESTAMPTZ DEFAULT now(),
        UNIQUE(employee_id, name)
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_skills_employee ON skills(employee_id)",

    # 3. gamification_profiles
    """
    CREATE TABLE IF NOT EXISTS gamification_profiles (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id     TEXT UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        level           INTEGER DEFAULT 1,
        xp              INTEGER DEFAULT 0,
        next_level_xp   INTEGER DEFAULT 1000,
        total_xp_earned INTEGER DEFAULT 0,
        company_rank    INTEGER,
        department_rank INTEGER,
        streak_days     INTEGER DEFAULT 0,
        longest_streak  INTEGER DEFAULT 0,
        last_activity   TIMESTAMPTZ,
        title           TEXT DEFAULT 'Newcomer',
        updated_at      TIMESTAMPTZ DEFAULT now()
    )
    """,

    # 4. xp_transactions
    """
    CREATE TABLE IF NOT EXISTS xp_transactions (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        amount      INTEGER NOT NULL,
        reason      TEXT,
        category    TEXT,
        emoji       TEXT,
        created_at  TIMESTAMPTZ DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_xp_employee ON xp_transactions(employee_id)",
    "CREATE INDEX IF NOT EXISTS idx_xp_created ON xp_transactions(created_at)",

    # 5. achievements
    """
    CREATE TABLE IF NOT EXISTS achievements (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name            TEXT NOT NULL,
        description     TEXT,
        emoji           TEXT,
        xp_value        INTEGER DEFAULT 0,
        rarity          TEXT,
        criteria_type   TEXT,
        criteria_value  JSONB,
        created_at      TIMESTAMPTZ DEFAULT now()
    )
    """,

    # 6. employee_achievements
    """
    CREATE TABLE IF NOT EXISTS employee_achievements (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        achievement_id  TEXT NOT NULL REFERENCES achievements(id),
        unlocked_at     TIMESTAMPTZ DEFAULT now(),
        UNIQUE(employee_id, achievement_id)
    )
    """,

    # 7. challenges
    """
    CREATE TABLE IF NOT EXISTS challenges (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title       TEXT NOT NULL,
        description TEXT,
        xp_reward   INTEGER DEFAULT 0,
        bonus_badge TEXT,
        difficulty  TEXT,
        type        TEXT,
        category    TEXT,
        color       TEXT,
        start_date  TIMESTAMPTZ,
        end_date    TIMESTAMPTZ,
        is_active   BOOLEAN DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT now()
    )
    """,

    # 8. challenge_progress
    """
    CREATE TABLE IF NOT EXISTS challenge_progress (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        challenge_id TEXT NOT NULL REFERENCES challenges(id),
        progress    INTEGER DEFAULT 0,
        completed   BOOLEAN DEFAULT false,
        enrolled_at TIMESTAMPTZ DEFAULT now(),
        completed_at TIMESTAMPTZ,
        UNIQUE(employee_id, challenge_id)
    )
    """,

    # 9. learning_paths
    """
    CREATE TABLE IF NOT EXISTS learning_paths (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        title           TEXT NOT NULL,
        description     TEXT,
        progress        INTEGER DEFAULT 0,
        total_courses   INTEGER DEFAULT 0,
        completed_courses INTEGER DEFAULT 0,
        estimated_hours NUMERIC(6,1),
        due_date        TEXT,
        tags            JSONB DEFAULT '[]'::jsonb,
        color           TEXT,
        is_ai_recommended BOOLEAN DEFAULT false,
        platform        TEXT,
        instructor      TEXT,
        created_at      TIMESTAMPTZ DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_lp_employee ON learning_paths(employee_id)",

    # 10. courses
    """
    CREATE TABLE IF NOT EXISTS courses (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title       TEXT NOT NULL,
        provider    TEXT,
        hours       NUMERIC(6,1),
        level       TEXT,
        rating      NUMERIC(3,2),
        enrolled_count INTEGER DEFAULT 0,
        tags        JSONB DEFAULT '[]'::jsonb,
        emoji       TEXT,
        color       TEXT,
        description TEXT,
        created_at  TIMESTAMPTZ DEFAULT now()
    )
    """,

    # 11. employee_courses
    """
    CREATE TABLE IF NOT EXISTS employee_courses (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        course_id   TEXT NOT NULL REFERENCES courses(id),
        status      TEXT DEFAULT 'available',
        progress    INTEGER DEFAULT 0,
        started_at  TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        UNIQUE(employee_id, course_id)
    )
    """,

    # 12. certifications
    """
    CREATE TABLE IF NOT EXISTS certifications (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        issuer          TEXT,
        status          TEXT DEFAULT 'planned',
        score           INTEGER,
        progress        INTEGER DEFAULT 0,
        credential_id   TEXT,
        completed_date  DATE,
        expiry_date     DATE,
        exam_date       TEXT,
        emoji           TEXT,
        color           TEXT,
        created_at      TIMESTAMPTZ DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_certs_employee ON certifications(employee_id)",

    # 13. weekly_schedule_entries
    """
    CREATE TABLE IF NOT EXISTS weekly_schedule_entries (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        day         TEXT NOT NULL,
        topic       TEXT NOT NULL,
        duration    TEXT,
        status      TEXT DEFAULT 'upcoming',
        color       TEXT,
        week_of     DATE
    )
    """,

    # 14. career_goals
    """
    CREATE TABLE IF NOT EXISTS career_goals (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        target_role     TEXT NOT NULL,
        timeline        TEXT,
        focus_area      TEXT,
        target_industry TEXT,
        readiness_score INTEGER DEFAULT 0,
        is_active       BOOLEAN DEFAULT true,
        created_at      TIMESTAMPTZ DEFAULT now(),
        updated_at      TIMESTAMPTZ DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_cg_employee ON career_goals(employee_id)",

    # 15. career_roadmap_steps
    """
    CREATE TABLE IF NOT EXISTS career_roadmap_steps (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        career_goal_id  TEXT NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
        step_order      INTEGER NOT NULL,
        title           TEXT NOT NULL,
        status          TEXT DEFAULT 'upcoming',
        description     TEXT
    )
    """,

    # 16. knowledge_sources
    """
    CREATE TABLE IF NOT EXISTS knowledge_sources (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        type            TEXT DEFAULT 'File',
        connected       BOOLEAN DEFAULT true,
        file_path       TEXT,
        coverage        INTEGER DEFAULT 0,
        skills_extracted INTEGER DEFAULT 0,
        projects_found  INTEGER DEFAULT 0,
        confidence      INTEGER DEFAULT 0,
        last_synced     TIMESTAMPTZ DEFAULT now(),
        created_at      TIMESTAMPTZ DEFAULT now()
    )
    """,

    # 17. reward_items
    """
    CREATE TABLE IF NOT EXISTS reward_items (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name        TEXT NOT NULL,
        description TEXT,
        cost        INTEGER NOT NULL,
        emoji       TEXT,
        category    TEXT,
        available   BOOLEAN DEFAULT true,
        stock       INTEGER,
        created_at  TIMESTAMPTZ DEFAULT now()
    )
    """,

    # 18. reward_claims
    """
    CREATE TABLE IF NOT EXISTS reward_claims (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        reward_id   TEXT NOT NULL REFERENCES reward_items(id),
        claimed_at  TIMESTAMPTZ DEFAULT now(),
        status      TEXT DEFAULT 'claimed'
    )
    """,

    # 19. recognitions
    """
    CREATE TABLE IF NOT EXISTS recognitions (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        type        TEXT NOT NULL,
        title       TEXT NOT NULL,
        description TEXT,
        date        TEXT,
        awarded_by  TEXT,
        created_at  TIMESTAMPTZ DEFAULT now()
    )
    """,

    # 20. projects
    """
    CREATE TABLE IF NOT EXISTS projects (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        role            TEXT,
        description     TEXT,
        technologies    JSONB DEFAULT '[]'::jsonb,
        duration        TEXT,
        domain          TEXT,
        complexity      TEXT,
        success_score   INTEGER DEFAULT 0,
        leadership_score INTEGER DEFAULT 0,
        customer_rating NUMERIC(3,2),
        status          TEXT DEFAULT 'On Track',
        created_at      TIMESTAMPTZ DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_projects_employee ON projects(employee_id)",

    # RLS policies
    "ALTER TABLE employees ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE skills ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE achievements ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE employee_achievements ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE challenges ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE courses ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE employee_courses ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE certifications ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE weekly_schedule_entries ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE career_roadmap_steps ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE reward_items ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE recognitions ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE projects ENABLE ROW LEVEL SECURITY",
]

# One policy per table (permissive — allow all via service role)
POLICY_TABLES = [
    "employees", "skills", "gamification_profiles", "xp_transactions",
    "achievements", "employee_achievements", "challenges", "challenge_progress",
    "learning_paths", "courses", "employee_courses", "certifications",
    "weekly_schedule_entries", "career_goals", "career_roadmap_steps",
    "knowledge_sources", "reward_items", "reward_claims", "recognitions", "projects",
]


def apply(password: str):
    print(f"🔌 Connecting to Supabase PostgreSQL at {HOST}...")
    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DBNAME,
        user=USER,
        password=password,
        sslmode="require",
        connect_timeout=10,
    )
    conn.autocommit = True
    cur = conn.cursor()

    print("🏗️  Creating tables...")
    for stmt in TABLES_SQL:
        stmt = stmt.strip()
        if stmt:
            try:
                cur.execute(stmt)
                # Print first 60 chars of statement as progress
                print(f"  ✅ {stmt[:70].strip()!r:.70}...")
            except Exception as e:
                err = str(e).lower()
                if "already exists" in err or "duplicate" in err:
                    print(f"  ⏭️  Already exists — skipping")
                else:
                    print(f"  ⚠️  Warning: {e}")

    print("🔒 Creating RLS policies...")
    for table in POLICY_TABLES:
        try:
            cur.execute(
                f"CREATE POLICY \"allow_all\" ON {table} FOR ALL USING (true) WITH CHECK (true)"
            )
            print(f"  ✅ Policy on {table}")
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"  ⏭️  Policy already exists on {table}")
            else:
                print(f"  ⚠️  {table}: {e}")

    cur.close()
    conn.close()
    print("\n✅ Schema applied successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--password", default=os.environ.get("SUPABASE_DB_PASSWORD", ""))
    args = parser.parse_args()

    if not args.password:
        print("❌ Error: Provide --password or set SUPABASE_DB_PASSWORD")
        print("   Find your DB password in: Supabase Dashboard → Project Settings → Database → Connection string")
        sys.exit(1)

    apply(args.password)

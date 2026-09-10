# Learning Hub (GrowthPath) — setup

End-to-end AI Learning Hub for the Employee Digital Twin. Frontend: `src/views/employee/LearningHub.tsx`. Backend: FastAPI + Supabase + Vertex Gemini.

## Stack conventions (do not diverge)

- **DB:** Supabase Postgres via `get_supabase_admin()` (not SQLAlchemy)
- **AI:** `backend/gemini_client.py` (Vertex) wrapped by `ask_gemini_timed` / `gemini_learning_service.py`
- **Routes:** `/api/learning/{employee_id}/...` (existing shape preserved)

## 1. Apply migration

In Supabase SQL editor, run:

`backend/migrations/learning_hub_ai.sql`

Creates:

- `learning_chat_messages` — AI Coach history
- `learning_feed_cache` — 24h Gemini feed cache
- optional `learning_paths.course_ids` / `ai_rationale`

## 2. Env (backend)

Already used by Vertex Gemini (no separate `GEMINI_API_KEY` required when using service account):

```env
GCP_PROJECT_ID=your-project
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=secrets/your-sa.json
# Optional for cloud hosts: paste full SA JSON
# GOOGLE_CREDENTIALS_JSON={...}
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

If you later switch to Google AI Studio API keys, add `GEMINI_API_KEY` and adapt `gemini_client.py` — current project uses Vertex.

## 3. Run

```bash
# backend
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# frontend
npm run dev
```

## 4. Gemini prompts (structured)

Centralized in `app/services/gemini_learning_service.py`:

| Capability | Function | Behavior |
|---|---|---|
| Paths | `generate_ai_paths` | JSON paths → persist `is_ai_recommended=true`; retry once; rule fallback |
| Feed | `generate_learning_feed` | JSON feed items; 24h cache by employee + input hash; `POST .../feed/refresh` forces regen |
| Gaps | `enrich_skill_gaps` | Priority + one-line rationale + course/path links |
| Coach | `chat_with_coach` | Profile-grounded plain text; persists user/assistant rows |

### Learning score formula

Documented on `compute_learning_score`:

- 35% completion rate
- 20% streak (capped 30 days)
- 25% skill-gap closure
- 10% yearly hours (capped 80h)
- 10% recency (activity in last 14 days)

## 5. Key API methods (frontend `learningAPI`)

- `getProfile`, `getPaths`, `updatePathProgress`, `generatePaths(goal?)`
- `getFeed`, `refreshFeed`
- `getCourses({ search, employee_id, ai_recommended })`
- `enrollCourse`, `updateCourseProgress`
- `getSkillGaps`
- `sendChatMessage`, `getChatHistory`

## 6. UI tabs

Overview · Learning Paths · Skill Gaps · Course Library · **AI Coach**

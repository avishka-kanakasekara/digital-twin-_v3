# Digital Twin v3 — Setup Guide

Personal dashboard with **Career Coach**, **Gamification Hub**, and **Learning Hub** — all powered by a FastAPI + SQLite backend.

---

## Architecture

```
React Frontend (Vite :5173)
        │
        ▼  HTTP REST
FastAPI Backend (:8000)
        │
        ▼
SQLite Database (backend/digitaltwin.db)
```

| Page | Route | Backend API |
|------|-------|-------------|
| Career Coach | `/career-coach` | `/api/career/*` |
| Gamification Hub | `/gamification-hub` | `/api/gamification/*` |
| Learning Hub | `/learning-hub` | `/api/learning/*` |

---

## Quick Start

### 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m scripts.seed_database # Creates DB + seeds demo data
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend setup

```bash
# From project root
npm install
npm run dev
```

App: http://localhost:5173

### 3. One-command start (both servers)

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

---

## Environment

Root `.env`:
```
VITE_API_URL=http://localhost:8000
```

---

## Demo User

After seeding, the app loads **Alex Carter** by default:

- **Email:** alex.carter@company.com
- **Password:** password123

All hub pages (career goals, XP, learning paths, certifications, etc.) are seeded for this user.

---

## API Endpoints (Key)

### Career Coach
- `GET /api/career/{id}/goal` — Active career goal
- `GET /api/career/{id}/roadmap` — Career roadmap steps
- `GET /api/career/{id}/skill-gaps` — Skill gap analysis
- `GET /api/career/{id}/recommendations` — AI course recommendations
- `POST /api/career/{id}/goal` — Create/update goal
- `GET /api/career/market-trends` — Market demand trends

### Gamification Hub
- `GET /api/gamification/{id}/profile` — XP, level, streak
- `GET /api/gamification/leaderboard?current_employee_id={id}` — Leaderboard
- `GET /api/gamification/{id}/challenges` — Active challenges
- `GET /api/gamification/{id}/achievements` — Achievement gallery
- `GET /api/gamification/{id}/xp-history` — XP chart data
- `GET /api/gamification/{id}/streak` — Activity streak calendar
- `GET /api/gamification/{id}/activity` — Recent XP activity
- `GET /api/gamification/rewards` — Reward store

### Learning Hub
- `GET /api/learning/{id}/profile` — Learner stats
- `GET /api/learning/{id}/paths` — Learning paths
- `GET /api/learning/{id}/skill-gaps` — Skill gaps vs target role
- `GET /api/learning/{id}/certifications` — Certification tracker
- `GET /api/learning/{id}/feed` — AI learning feed
- `GET /api/learning/{id}/schedule` — Weekly schedule
- `GET /api/learning/{id}/hours` — Monthly hours chart
- `GET /api/learning/courses?employee_id={id}` — Course library

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Pages show "Failed to load" | Start backend: `uvicorn app.main:app --reload --port 8000` |
| Empty data on pages | Re-seed: `cd backend && python -m scripts.seed_database` |
| CORS errors | Confirm `VITE_API_URL=http://localhost:8000` in `.env` |
| Wrong employee data | Clear localStorage: `localStorage.removeItem('current_employee_id')` and refresh |

---

## Re-seed Database

```bash
cd backend
source venv/bin/activate
python -m scripts.seed_database
```

This drops and recreates all tables with fresh demo data.

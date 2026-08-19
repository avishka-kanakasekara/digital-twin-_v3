# HOW_TO_USE_GAMIFICATION.md
# Gamification System — Plain-English Guide

**Last updated:** August 2026
**Backend:** FastAPI + Supabase
**Frontend:** React — Gamification Hub (/gamification-hub)

---

## 1. How to Add a New Challenge

Challenges are created via the Admin API using a simple HTTP call (curl or Postman).

### Copy-paste curl command:
```bash
curl -X POST http://localhost:8000/api/gamification/admin/challenges \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Your Challenge Title",
    "description": "What the employee needs to do",
    "type": "weekly",
    "difficulty": "Medium",
    "xp_reward": 500,
    "bonus_badge": "🎯",
    "color": "#7c3aed",
    "category": "Learning",
    "end_date": "2026-12-31T00:00:00Z",
    "is_active": true
  }'
```

### Field reference:
- type: weekly / monthly / daily
- difficulty: Easy / Medium / Hard
- category: Learning, Knowledge, Skill, Teamwork, Engagement
  (determines which employee actions auto-increment this challenge)
- xp_reward: XP awarded on completion
- end_date: ISO date — days_left in UI is computed from this

### Edit/deactivate:
```bash
curl -X PATCH http://localhost:8000/api/gamification/admin/challenges/{CHALLENGE_ID} \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

### Verify: Open app → Challenges tab → new challenge appears on next load.

---

## 2. How Challenge Progress Gets Tracked

Progress is AUTOMATIC — it increments when employees take real actions in the app.

### Action → Challenge mapping:
| What the employee does             | Category incremented | Increment |
|------------------------------------|---------------------|-----------|
| Uploads a document (Knowledge page)| Knowledge           | +34%      |
| Adds a certification (Learning)    | Learning            | +100%     |
| Completes a learning path (100%)   | Learning            | +34%      |
| Adds a skill to their profile      | Skill               | +20%      |
| Adds a project                     | Innovation          | +34%      |

### Auto-completion: When a challenge hits 100%, it marks completed, awards XP exactly once, and stops tracking.

### To simulate any event manually (admin/testing):
```bash
curl -X POST http://localhost:8000/api/gamification/admin/fire-event/{EMPLOYEE_ID} \
  -H "Content-Type: application/json" \
  -d '{"event_type": "document_uploaded"}'
```

Available event types: document_uploaded, certification_added, course_completed, skill_added, project_added

---

## 3. How XP Gets Awarded

Every XP change goes through a single service (award_xp). It always:
1. Writes an immutable row to xp_transactions (audit ledger)
2. Adds XP to the employee's balance
3. Recalculates their level (formula: 1000 × 1.15^(level-1))
4. Updates their title: Newcomer → Rising Star → Expert → AI Pioneer → Legend
5. Updates daily streak counter
6. Recalculates ranks for all employees

### XP is awarded when:
- Completing a challenge (xp_reward amount)
- Unlocking an achievement (xp_value amount)
- Uploading a document (+100 XP)
- Adding a certification (+200 XP)
- Completing a learning path (+150 XP)
- Adding a skill (+50 XP)
- First activity of each day (+25 XP daily bonus)
- Admin manual grant (any amount)
- Redeeming a reward (XP is DEDUCTED)

### Admin manual grant:
```bash
curl -X POST http://localhost:8000/api/gamification/admin/xp \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "UUID", "amount": 500, "reason": "Quarterly bonus"}'
```

### View the XP ledger:
```bash
curl http://localhost:8000/api/gamification/{EMPLOYEE_ID}/activity?limit=20
```

---

## 4. How Badges / Achievements Unlock

Achievements unlock automatically after every XP event. No manual action needed.

### Conditions:
| Badge          | Condition                          |
|----------------|------------------------------------|
| First Steps    | Profile has name + role + dept     |
| Twin Synced    | Same as First Steps                |
| Skill Architect| 20+ skills in profile              |
| Certified Expert| 1+ certifications                 |
| Knowledge Oracle| 5+ documents uploaded             |
| Mentor Mind    | 5,000+ total XP ever               |
| AI Pioneer     | AI Readiness score >= 80           |
| Top Performer  | Company rank <= 3                  |
| Innovation Spark| 3+ projects in profile            |
| Streak Legend  | 30 consecutive days of activity    |
| Speed Learner  | Complete 3 challenges              |
| Team Magnet    | 2,000+ total XP                    |

### Guarantee: An achievement CANNOT unlock twice for the same person.

### Force-check achievements (admin):
```bash
curl -X POST http://localhost:8000/api/gamification/admin/check-achievements/{EMPLOYEE_ID}
```

---

## 5. How Reward Redemption Works

### From the UI:
1. Go to Gamification Hub → Reward Store tab
2. Find a reward you can afford
3. Click "Redeem Reward"
4. XP balance updates immediately

### What happens:
1. Re-fetches current XP (prevents double-spend)
2. Checks XP >= cost → 400 error if not enough
3. Checks not already claimed → 409 error if already claimed
4. Deducts XP via the XP service (negative ledger entry)
5. Records redemption in reward_claims
6. Returns updated profile so UI refreshes immediately

### To add a new reward (admin):
```bash
curl -X POST http://localhost:8000/api/gamification/admin/rewards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Lunch",
    "description": "Lunch with your team on us",
    "cost": 1500,
    "emoji": "🍕",
    "category": "Social",
    "available": true
  }'
```

---

## 6. How the Leaderboard Works

- Company rank and department rank are recalculated live after every XP event
- Trend (up/down/stable) compares current rank vs 7 days ago from the XP transaction log
  - up = moved higher in rankings vs last week
  - down = moved lower vs last week
  - stable = same rank (or less than 7 days of history)

### Force-recalculate all ranks:
```bash
curl -X POST http://localhost:8000/api/gamification/admin/recalculate-ranks
```

---

## Quick Reference: All Admin Endpoints

| Action                     | Method | URL                                              |
|----------------------------|--------|--------------------------------------------------|
| Create challenge           | POST   | /api/gamification/admin/challenges               |
| Edit/deactivate challenge  | PATCH  | /api/gamification/admin/challenges/{id}          |
| Grant/deduct XP            | POST   | /api/gamification/admin/xp                       |
| Force achievement check    | POST   | /api/gamification/admin/check-achievements/{id}  |
| Simulate event             | POST   | /api/gamification/admin/fire-event/{id}          |
| Recalculate ranks          | POST   | /api/gamification/admin/recalculate-ranks        |
| Create reward              | POST   | /api/gamification/admin/rewards                  |
| Toggle reward availability | PATCH  | /api/gamification/admin/rewards/{id}             |
| Create achievement         | POST   | /api/gamification/admin/achievements             |

---

## What Is Not Yet Implemented

- Trend arrows show "stable" for the first 7 days of use (by design — needs 7 days of XP history)
- leaderboard_snapshots table was not created (requires Supabase dashboard DDL). Trend uses xp_transactions history instead — functionally identical.
- Admin UI for creating challenges/rewards does not exist — API-only. Add as a future feature if needed.

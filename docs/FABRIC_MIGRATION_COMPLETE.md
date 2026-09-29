# Fabric migration complete

The FastAPI backend uses Microsoft Fabric SQL Database only. The React client talks only to FastAPI. Gemini is unchanged.

## Runtime stack

| Layer | Implementation |
| --- | --- |
| API | FastAPI |
| Database | Fabric SQL via ODBC Driver 18 + Entra token |
| Query gateway | `get_db()` / `backend/app/db/` |
| Auth | Application JWT (optional Microsoft Entra) |
| Files | Local disk, or OneLake when configured |
| AI | Google Gemini / Vertex |

## Setup

1. Configure `backend/.env` with `FABRIC_SQL_SERVER` and `FABRIC_SQL_DATABASE`.
2. Run `az login` (or set a service principal).
3. Apply schema: `python scripts/apply_fabric_schema.py`
4. Seed demo data: `cd backend && python -m scripts.seed_database && python -m scripts.seed_organization_data`
5. Start API: `./backend/start_backend.sh`
6. Start UI: `npm run dev` (`VITE_API_URL=http://127.0.0.1:8000`)

## Verification

```bash
python scripts/verify_fabric_connection.py
python scripts/verify_fabric_migration.py
curl http://127.0.0.1:8000/health/database
```

## Notes

- Schema SQL lives under `fabric/database/`.
- There is no Supabase client, package, or environment variable in the running app.

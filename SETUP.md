# Digital Twin v3 setup

The React frontend calls FastAPI. FastAPI uses Supabase PostgreSQL for operational data, including employee accounts. Login uses the existing application JWT. Uploaded files use the existing configured storage.

## Configure the backend

1. In the Supabase project, open **Connect** and copy the PostgreSQL **Session pooler** URI. Replace the password placeholder with the URL-encoded database password and require TLS with `sslmode=require`.
2. Set `SUPABASE_DB_URL` in the git-ignored `backend/.env.local` or in the deployment secret manager. The backend defaults to `DATABASE_PROVIDER=supabase`. The frontend needs only `VITE_API_URL`.
3. For a fresh project, apply `backend/migrations/supabase_edt.sql` in one transaction before starting the API. For example, with the URI exported in your shell, run `psql "$SUPABASE_DB_URL" -1 -v ON_ERROR_STOP=1 -f backend/migrations/supabase_edt.sql` from the repository root. The original digitaltwin Supabase project already has this schema.
4. Configure a strong application `SECRET_KEY` and use `ENVIRONMENT=production` for a deployment.

## Import the current Fabric records

Run this **before starting the new backend**. Startup populates the learning catalogue. The importer requires empty destination tables and leaves the older Supabase public tables in place.

Pause application writes for the cutover. With the existing Fabric SQL and Microsoft Entra settings in the backend environment, run these commands on a machine with the Microsoft ODBC Driver 18 and access to both databases.

```bash
cd backend
source venv/bin/activate
python -m pip install -r requirements.txt
python -m scripts.import_fabric_to_supabase
```

The importer reads the live Fabric dbo tables, preserves identifiers and password hashes, verifies table counts and commits all rows together. An unmapped table, incompatible column, constraint failure or populated destination stops the import. After a failed import the destination transaction rolls back. Keep the Fabric source available until you verify sign-in and employee records in the new backend.

## Run locally

From `backend`, activate the virtual environment, install `requirements.txt` and run `python -m uvicorn app.main:app --port 8000`. From the repository root run `npm install` and `npm run dev`.

Check `http://localhost:8000/health/database` for a successful Supabase connection. Open `http://localhost:5173` and sign in using an imported account. For isolated regression tests, run `python -m pytest -q` from `backend`. Those tests create a dedicated SQLite database.

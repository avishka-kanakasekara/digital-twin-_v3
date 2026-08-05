"""
Apply Supabase schema via the Management API.

Usage:
    python apply_schema.py --token YOUR_SUPABASE_PAT

Get your Personal Access Token from:
    https://supabase.com/dashboard/account/tokens

Or alternatively, copy-paste supabase_schema.sql into the Supabase SQL Editor:
    https://supabase.com/dashboard/project/khrchkotgqbpzhurmbju/sql/new
"""

import sys
import argparse
import httpx

PROJECT_REF = "khrchkotgqbpzhurmbju"
SCHEMA_FILE = "supabase_schema.sql"
MANAGEMENT_API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"


def apply_schema(token: str):
    with open(SCHEMA_FILE, "r") as f:
        sql = f.read()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    print(f"🚀 Applying schema to Supabase project {PROJECT_REF}...")
    resp = httpx.post(MANAGEMENT_API, json={"query": sql}, headers=headers, timeout=60)

    if resp.status_code in (200, 201):
        print("✅ Schema applied successfully!")
    else:
        print(f"❌ Failed ({resp.status_code}): {resp.text}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply Supabase schema via Management API")
    parser.add_argument("--token", required=True, help="Supabase Personal Access Token")
    args = parser.parse_args()
    apply_schema(args.token)

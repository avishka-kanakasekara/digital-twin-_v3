"""Copy the live dbo tables into an empty edt schema in a single transaction."""

import re
from contextlib import closing
from graphlib import TopologicalSorter
from uuid import UUID

import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values

from app.config import settings
from app.db.fabric_database import _connect_fabric


def postgres_value(value):
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, UUID):
        return str(value)
    return value


def copy_tables(source, target):
    source.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
    source.execute("SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo')")
    source_tables = {r[0] for r in source.fetchall()}
    target.execute("SELECT tablename FROM pg_tables WHERE schemaname='edt'")
    tables = {r[0] for r in target.fetchall()}
    if "employees" not in tables or "employees" not in source_tables:
        raise ValueError("The source and destination both require an employees table")
    unknown = source_tables - tables
    if unknown:
        raise ValueError(f"Review unmapped Fabric tables before importing: {sorted(unknown)}")

    target.execute("""
        SELECT child.relname, parent.relname FROM pg_constraint c
        JOIN pg_class child ON child.oid=c.conrelid
        JOIN pg_class parent ON parent.oid=c.confrelid
        WHERE c.contype='f' AND child.relnamespace='edt'::regnamespace
          AND child.oid <> parent.oid
    """)
    dependencies = {name: set() for name in tables}
    for child, parent in target.fetchall():
        dependencies[child].add(parent)
    ordered = tuple(TopologicalSorter(dependencies).static_order())
    for name in sorted(tables):
        table = sql.Identifier("edt", name)
        target.execute(sql.SQL("LOCK TABLE {} IN EXCLUSIVE MODE").format(table))
        target.execute(sql.SQL("SELECT EXISTS(SELECT FROM {} LIMIT 1)").format(table))
        if target.fetchone()[0]:
            raise ValueError(f"Destination table {name} contains data. Import requires an empty schema.")

    for name in ordered:
        if name not in source_tables:
            continue
        if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", name):
            raise ValueError("Unexpected table identifier")
        source.execute(f"SELECT * FROM [dbo].[{name}]")
        columns = [c[0] for c in source.description]
        table = sql.Identifier("edt", name)
        insert = sql.SQL("INSERT INTO {} ({}) VALUES %s").format(
            table, sql.SQL(", ").join(map(sql.Identifier, columns))
        )
        count = 0
        while batch := source.fetchmany(500):
            rows = [tuple(postgres_value(value) for value in row) for row in batch]
            execute_values(target, insert, rows)
            count += len(rows)
        target.execute(sql.SQL("SELECT count(*) FROM {}").format(table))
        if target.fetchone()[0] != count:
            raise ValueError(f"Row count mismatch in {name}")
        print(f"{name}: {count} rows verified")


def main():
    if not settings.SUPABASE_DB_URL:
        raise SystemExit("Set SUPABASE_DB_URL in backend/.env.local first.")
    with closing(psycopg2.connect(settings.SUPABASE_DB_URL, connect_timeout=8)) as dest:
        with closing(_connect_fabric()) as src, dest:
            with closing(src.cursor()) as source, dest.cursor() as target:
                copy_tables(source, target)
    print("Import committed.")


if __name__ == "__main__":
    main()

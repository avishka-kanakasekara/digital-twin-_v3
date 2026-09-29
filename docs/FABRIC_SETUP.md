# Fabric setup

Official references used for this setup:

- SQL database overview: https://learn.microsoft.com/en-us/fabric/database/sql/overview
- Mirroring into OneLake: https://learn.microsoft.com/en-us/fabric/database/sql/mirroring-overview
- SQL analytics endpoint: https://learn.microsoft.com/en-us/fabric/database/sql/sql-analytics-endpoint
- Entra authentication for Fabric SQL: https://learn.microsoft.com/en-us/fabric/data-warehouse/entra-id-authentication
- Python and Entra, including Fabric SQL database: https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-sql-python-quickstart

## Workspace

Create or choose a Microsoft Fabric workspace. The SQL database, its mirrored OneLake data, and the SQL analytics endpoint live in that workspace.

## SQL database

In the workspace, create an item of type **SQL database** (not a Warehouse). This is the OLTP database. Mirroring to OneLake starts when the database is created. There is no separate copy job in this repository.

## Database name and SQL endpoint

Open the SQL database and copy the connection string from **Settings** or the connection dialog. Put the server host in `FABRIC_SQL_SERVER` and the database name in `FABRIC_SQL_DATABASE`.

The transactional host looks like:

`<workspace-or-server-id>.database.fabric.microsoft.com`

The analytics endpoint is a different host and is read-only. Point the API at the SQL database, and point Power BI at the analytics endpoint.

## Microsoft Entra ID

Fabric SQL does not use SQL passwords for this app. The API asks `DefaultAzureCredential` for a token scoped to `https://database.windows.net/.default`.

Local development:

```bash
az login
```

Production on Azure (App Service, Container Apps, a VM with a managed identity): assign the managed identity access to the database and leave `FABRIC_CLIENT_SECRET` empty.

## Service principal

When the process cannot use `az login` or a managed identity:

1. Create an app registration.
2. Create a client secret outside the repository.
3. Set `FABRIC_TENANT_ID`, `FABRIC_CLIENT_ID`, and `FABRIC_CLIENT_SECRET`.
4. In the Fabric SQL database, create a user for the app and grant it `db_datareader`, `db_datawriter`, and `db_ddladmin` if this identity will run the schema scripts. After schema creation, `db_ddladmin` can be removed.

Example:

```sql
CREATE USER [edt-api] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [edt-api];
ALTER ROLE db_datawriter ADD MEMBER [edt-api];
```

The display name must match the service principal. Confirm the exact `CREATE USER` syntax in the current Fabric SQL database security article if the portal wording differs.

## Permissions

- The human who creates the database needs a workspace role that can create items (Contributor or higher).
- The API identity needs to connect to the SQL database and read/write the application tables.
- OneLake file access needs the identity to have access to the workspace and the lakehouse filesystem.

## Schema

Run these files, in order, in the SQL database query editor or with `sqlcmd` against the transactional endpoint:

1. `fabric/database/001_create_schema.sql`
2. `fabric/database/002_create_tables.sql`
3. `fabric/database/003_create_constraints.sql`
4. `fabric/database/004_create_indexes.sql`
5. `fabric/database/005_create_views.sql`
6. `fabric/database/006_create_functions.sql`
7. `fabric/database/007_create_procedures.sql`

`008_seed_data.sql` points at the Python seeders. It does not insert rows by itself.

Install Microsoft ODBC Driver 18 for SQL Server on the API host.

## OneLake

Create a lakehouse in the same workspace if you want file storage there. Set:

```
ONELAKE_WORKSPACE=<workspace name>
ONELAKE_LAKEHOUSE=<lakehouse name>
ONELAKE_ACCOUNT_URL=https://onelake.dfs.fabric.microsoft.com
```

Files land under `Files/EmployeeDigitalTwin/`. Leave both names empty to keep the current local `UPLOAD_DIR` behavior.

## Environment variables

Copy `backend/.env.example` to `backend/.env`. Do not commit `.env`.

## Local stand-in

```
ENVIRONMENT=development
FABRIC_LOCAL_SQLITE=true
```

This is refused when `ENVIRONMENT=production`.

## Verify

```bash
cd digital-twin-_v3
python scripts/verify_fabric_connection.py
```

A successful Fabric connection prints `database=fabric`. A development SQLite stand-in prints `database=fabric-local-sqlite`. A missing server name exits 2 and prints `REQUIRES FABRIC CONFIGURATION`.

Then start the API and open `GET /health/database`. The response is `{"status":"healthy","database":"fabric"}` and does not include credentials.

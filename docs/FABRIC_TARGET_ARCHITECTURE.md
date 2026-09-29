# Fabric target architecture

```
React
  |
  | HTTPS / REST, existing paths in src/lib/api.ts
  v
FastAPI
  |-- application JWT (existing login)
  |-- optional Microsoft Entra access token
  |
  +--> Fabric SQL Database     operational CRUD
  |
  +--> OneLake                  files, when configured
         |
         | automatic mirroring (Fabric-native, not a second copy maintained by this app)
         v
       SQL analytics endpoint / Power BI / notebooks
```

## Operational database

SQL database in Microsoft Fabric is the transactional store. The API does not use a Warehouse for CRUD. Microsoft documents that a SQL database in Fabric mirrors supported tables into OneLake as Delta tables and exposes a read-only SQL analytics endpoint. That is the analytics path. The application connection string must be the SQL database endpoint (`*.database.fabric.microsoft.com`), not the analytics endpoint.

References:

- https://learn.microsoft.com/en-us/fabric/database/sql/overview
- https://learn.microsoft.com/en-us/fabric/database/sql/mirroring-overview
- https://learn.microsoft.com/en-us/fabric/database/sql/sql-analytics-endpoint

## Connection

`backend/app/db/fabric_database.py` uses ODBC Driver 18.

- Local or managed identity: `DefaultAzureCredential` token for `https://database.windows.net/.default`, passed to pyodbc as `SQL_COPT_SS_ACCESS_TOKEN`.
- Non-interactive secret: `Authentication=ActiveDirectoryServicePrincipal` when `FABRIC_CLIENT_ID` and `FABRIC_CLIENT_SECRET` are set.
- Development only: SQLite when `ENVIRONMENT=development` and `FABRIC_LOCAL_SQLITE=true`. Production ignores that flag.

`backend/app/db/query.py` is the only SQL composer. Routers and existing services call it through `get_db().table(...)`. New employee list/get code goes through `EmployeeRepository`. Values are parameters. Identifiers are validated.

## Files

`backend/app/services/onelake_storage_service.py` writes to `https://onelake.dfs.fabric.microsoft.com` under `{workspace}/{lakehouse}.Lakehouse/Files/EmployeeDigitalTwin/`. Knowledge files, `challenges/{employee_id}/`, and `career-evidence/{employee_id}/` keep the paths the application already stored. If OneLake settings are empty, the same paths stay under `UPLOAD_DIR`.

## Analytics

Do not copy rows into a second operational database. After the Fabric SQL database exists, mirroring populates OneLake. Power BI and notebooks should use the SQL analytics endpoint or the mirrored Delta tables. `fabric/database/005_create_views.sql` adds `v_employee_skill_summary` and `v_gamification_leaderboard` on the operational database for simple reporting.

## AI

Gemini stays in `backend/gemini_client.py`. Services load employee context through the Fabric gateway and send it to Gemini on the server. AI payloads such as `learning_feed_cache.payload` and `career_goals.ai_analysis_json` remain JSON documents.

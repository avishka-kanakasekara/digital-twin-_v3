"""
Parameterized query gateway.

Existing services compose filters with the same method names the application
already used (table/select/eq/insert/update/delete/upsert). Every value is
bound as a parameter. SQL text is built only from validated identifiers.
"""

from __future__ import annotations

import json
import re
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from app.db.errors import FabricDataError
from app.db.fabric_database import FabricDatabase

_IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

# Columns stored as JSON text. Values are parsed back into Python objects.
JSON_COLUMNS = {
    "education", "languages", "criteria_value", "tags", "technologies",
    "required_skills", "matched_employees", "members", "initiatives",
    "target_skills", "course_ids", "payload", "analysis_result", "fact_value",
    "old_value", "new_value", "ai_analysis_json", "missing_requirements",
}

BIT_COLUMNS = {
    "verified", "is_active", "connected", "available", "completed",
    "is_ai_recommended", "visible_to_manager", "requires_evidence",
    "intro_requested", "resolved", "requires_approval", "patent_pending",
    "joined", "pass", "is_business_critical", "approved_by_hr", "shared_with_candidates",
}

PRIMARY_KEYS: dict[str, list[str]] = {
    "learning_feed_cache": ["employee_id"],
    "internal_roles": ["role_id"],
    "lr_id_counters": ["prefix"],
}

# Embedded resource used by the leaderboard: gamification_profiles -> employees.
RELATIONS = {
    ("gamification_profiles", "employees"): ("employee_id", "id"),
}


@dataclass
class QueryResult:
    data: list[dict[str, Any]]
    count: int | None = None


@dataclass
class _Filter:
    op: str
    column: str
    value: Any = None


@dataclass
class _Embed:
    relation: str
    kind: str
    columns: list[str]


@dataclass
class Query:
    db: FabricDatabase
    table_name: str
    operation: str = "select"
    columns: str = "*"
    count_mode: str | None = None
    filters: list[_Filter] = field(default_factory=list)
    orders: list[tuple[str, bool]] = field(default_factory=list)
    row_limit: int | None = None
    range_start: int | None = None
    range_end: int | None = None
    payload: Any = None
    embeds: list[_Embed] = field(default_factory=list)

    def select(self, columns: str = "*", count: str | None = None) -> "Query":
        self.operation = "select"
        self.columns = columns or "*"
        self.count_mode = count
        self.embeds = _parse_embeds(columns or "*")
        return self

    def insert(self, payload: dict | list) -> "Query":
        self.operation = "insert"
        self.payload = payload
        return self

    def update(self, payload: dict) -> "Query":
        self.operation = "update"
        self.payload = payload
        return self

    def delete(self) -> "Query":
        self.operation = "delete"
        return self

    def upsert(self, payload: dict | list, on_conflict: str | None = None) -> "Query":
        self.operation = "upsert"
        self.payload = payload
        self.columns = on_conflict or ""
        return self

    def eq(self, column: str, value: Any) -> "Query":
        self.filters.append(_Filter("eq", column, value))
        return self

    def neq(self, column: str, value: Any) -> "Query":
        self.filters.append(_Filter("neq", column, value))
        return self

    def gt(self, column: str, value: Any) -> "Query":
        self.filters.append(_Filter("gt", column, value))
        return self

    def gte(self, column: str, value: Any) -> "Query":
        self.filters.append(_Filter("gte", column, value))
        return self

    def lt(self, column: str, value: Any) -> "Query":
        self.filters.append(_Filter("lt", column, value))
        return self

    def lte(self, column: str, value: Any) -> "Query":
        self.filters.append(_Filter("lte", column, value))
        return self

    def in_(self, column: str, values: list) -> "Query":
        self.filters.append(_Filter("in", column, list(values or [])))
        return self

    def ilike(self, column: str, pattern: str) -> "Query":
        self.filters.append(_Filter("ilike", column, pattern))
        return self

    def is_(self, column: str, value: Any) -> "Query":
        self.filters.append(_Filter("is", column, value))
        return self

    def order(self, column: str, desc: bool = False, **_kwargs: Any) -> "Query":
        self.orders.append((column, bool(desc)))
        return self

    def limit(self, count: int) -> "Query":
        self.row_limit = int(count)
        return self

    def range(self, start: int, end: int) -> "Query":
        self.range_start = int(start)
        self.range_end = int(end)
        return self

    def execute(self) -> QueryResult:
        if self.operation == "insert":
            return self._insert(self.payload)
        if self.operation == "upsert":
            rows = self.payload if isinstance(self.payload, list) else [self.payload]
            written: list[dict] = []
            with self.db.transaction():
                for row in rows:
                    written.extend(self._upsert_one(row).data)
            return QueryResult(written)
        if self.operation == "update":
            return self._update(self.payload or {})
        if self.operation == "delete":
            return self._delete()
        return self._select()

    def _select(self) -> QueryResult:
        if _empty_in(self.filters):
            return QueryResult([], 0 if self.count_mode else None)

        where_sql, params = self._where()
        join_sql, select_sql = self._select_list()
        order_sql = self._order_by()
        count = None
        if self.count_mode == "exact":
            count_rows = self.db.execute(
                f"SELECT COUNT(*) AS cnt FROM {_qtable(self.table_name, self.db)} t0 {join_sql} {where_sql}",
                params,
            )
            count = int(count_rows[0]["cnt"]) if count_rows else 0

        limit_sql, limit_params = self._limit_clause(order_sql)
        sql = (
            f"SELECT {select_sql} FROM {_qtable(self.table_name, self.db)} t0 "
            f"{join_sql} {where_sql} {order_sql} {limit_sql}"
        )
        rows = [_shape_row(self.table_name, row, self.embeds) for row in self.db.execute(sql, params + limit_params)]
        return QueryResult(rows, count)

    def _insert(self, payload: dict | list) -> QueryResult:
        rows = payload if isinstance(payload, list) else [payload]
        if not rows:
            return QueryResult([])
        written: list[dict] = []
        with self.db.transaction():
            for row in rows:
                written.append(self._insert_one(dict(row)))
        return QueryResult(written)

    def _insert_one(self, row: dict[str, Any]) -> dict[str, Any]:
        pk = _pk(self.table_name)
        if pk == ["id"] and not row.get("id"):
            row["id"] = str(uuid.uuid4())
        cols = list(row.keys())
        _validate_columns(cols)
        values = [_bind(self.table_name, col, row[col]) for col in cols]
        col_sql = ", ".join(_qident(c, self.db) for c in cols)
        placeholders = ", ".join("?" for _ in cols)
        self.db.execute(
            f"INSERT INTO {_qtable(self.table_name, self.db)} ({col_sql}) VALUES ({placeholders})",
            values,
        )
        return self._fetch_pk(row, pk)

    def _upsert_one(self, row: dict[str, Any]) -> QueryResult:
        pk = _pk(self.table_name)
        if self.columns:
            pk = [part.strip() for part in self.columns.split(",") if part.strip()]
        if pk == ["id"] and not row.get("id"):
            row["id"] = str(uuid.uuid4())
        existing = self._fetch_existing(row, pk)
        if existing:
            changes = {k: v for k, v in row.items() if k not in pk}
            if changes:
                self.filters = [_Filter("eq", col, row[col]) for col in pk]
                return self._update(changes)
            return QueryResult([existing])
        return QueryResult([self._insert_one(dict(row))])

    def _update(self, changes: dict[str, Any]) -> QueryResult:
        if not changes:
            return self._select()
        if _empty_in(self.filters):
            return QueryResult([])
        _validate_columns(list(changes.keys()))
        where_sql, where_params = self._where(qualified=False)
        assignments = ", ".join(f"{_qident(col, self.db)} = ?" for col in changes)
        values = [_bind(self.table_name, col, changes[col]) for col in changes]
        self.db.execute(
            f"UPDATE {_qtable(self.table_name, self.db)} SET {assignments} {where_sql}",
            values + where_params,
        )
        return self._select()

    def _delete(self) -> QueryResult:
        if _empty_in(self.filters):
            return QueryResult([])
        current = self._select()
        where_sql, where_params = self._where(qualified=False)
        self.db.execute(
            f"DELETE FROM {_qtable(self.table_name, self.db)} {where_sql}",
            where_params,
        )
        return current

    def _fetch_pk(self, row: dict[str, Any], pk: list[str]) -> dict[str, Any]:
        saved = list(self.filters)
        self.filters = [_Filter("eq", col, row[col]) for col in pk if col in row]
        try:
            found = self._select()
        finally:
            self.filters = saved
        if not found.data:
            raise FabricDataError("Database write could not be read back")
        return found.data[0]

    def _fetch_existing(self, row: dict[str, Any], pk: list[str]) -> dict | None:
        saved = list(self.filters)
        self.filters = [_Filter("eq", col, row[col]) for col in pk if col in row]
        self.operation = "select"
        try:
            found = self._select()
        finally:
            self.filters = saved
        return found.data[0] if found.data else None

    def _where(self, qualified: bool = True) -> tuple[str, list[Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        for item in self.filters:
            if qualified:
                sql_col = _filter_column(self.table_name, item.column, self.embeds, self.db)
            else:
                _validate_ident(item.column.split(".")[-1])
                sql_col = _qident(item.column.split(".")[-1], self.db)
            if item.op == "in":
                if not item.value:
                    clauses.append("1 = 0")
                    continue
                marks = ", ".join("?" for _ in item.value)
                clauses.append(f"{sql_col} IN ({marks})")
                params.extend(_bind(self.table_name, item.column.split(".")[-1], v) for v in item.value)
            elif item.op == "ilike":
                clauses.append(f"LOWER({sql_col}) LIKE LOWER(?)")
                params.append(item.value)
            elif item.op == "is":
                if item.value is None or item.value == "null":
                    clauses.append(f"{sql_col} IS NULL")
                else:
                    clauses.append(f"{sql_col} IS NOT NULL")
            else:
                op = {"eq": "=", "neq": "<>", "gt": ">", "gte": ">=", "lt": "<", "lte": "<="}[item.op]
                clauses.append(f"{sql_col} {op} ?")
                params.append(_bind(self.table_name, item.column.split(".")[-1], item.value))
        if not clauses:
            return "", []
        return "WHERE " + " AND ".join(clauses), params

    def _select_list(self) -> tuple[str, str]:
        parts = _split_select(self.columns)
        base_cols: list[str] = []
        for part in parts:
            if "!inner(" in part or "!left(" in part:
                continue
            if part == "*":
                base_cols.append("t0.*")
            else:
                _validate_ident(part)
                base_cols.append(f"t0.{_qident(part, self.db)}")
        join_sql = []
        for embed in self.embeds:
            relation = RELATIONS.get((self.table_name, embed.relation))
            if not relation:
                raise FabricDataError(f"Unsupported related data request for {embed.relation}")
            local_col, remote_col = relation
            alias = _embed_alias(embed.relation)
            join_kind = "INNER JOIN" if embed.kind == "inner" else "LEFT JOIN"
            join_sql.append(
                f"{join_kind} {_qtable(embed.relation, self.db)} {alias} "
                f"ON t0.{_qident(local_col, self.db)} = {alias}.{_qident(remote_col, self.db)}"
            )
            for col in embed.columns:
                _validate_ident(col)
                base_cols.append(
                    f"{alias}.{_qident(col, self.db)} AS {_qident(_embed_key(embed.relation, col), self.db)}"
                )
        if not base_cols:
            base_cols = ["t0.*"]
        return " ".join(join_sql), ", ".join(base_cols)

    def _order_by(self) -> str:
        if not self.orders:
            return ""
        pieces = []
        for column, desc in self.orders:
            sql_col = _filter_column(self.table_name, column, self.embeds, self.db)
            pieces.append(f"{sql_col} {'DESC' if desc else 'ASC'}")
        return "ORDER BY " + ", ".join(pieces)

    def _limit_clause(self, order_sql: str) -> tuple[str, list[Any]]:
        if self.range_start is not None and self.range_end is not None:
            offset = self.range_start
            fetch = self.range_end - self.range_start + 1
            if self.db.dialect == "sqlite":
                return "LIMIT ? OFFSET ?", [fetch, offset]
            prefix = "" if order_sql else "ORDER BY (SELECT NULL) "
            return f"{prefix}OFFSET ? ROWS FETCH NEXT ? ROWS ONLY", [offset, fetch]
        if self.row_limit is not None:
            if self.db.dialect == "sqlite":
                return "LIMIT ?", [self.row_limit]
            prefix = "" if order_sql else "ORDER BY (SELECT NULL) "
            return f"{prefix}OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY", [self.row_limit]
        return "", []


class FabricClient:
    """Process-wide gateway. Call sites use .table(name) and never open drivers."""

    def __init__(self, database: FabricDatabase | None = None) -> None:
        self.db = database or FabricDatabase()

    def table(self, name: str) -> Query:
        _validate_ident(name)
        return Query(db=self.db, table_name=name)

    def transaction(self):
        return self.db.transaction()


def _pk(table: str) -> list[str]:
    return PRIMARY_KEYS.get(table, ["id"])


def _validate_ident(name: str) -> None:
    if not _IDENT.match(name):
        raise FabricDataError("Invalid database identifier")


def _validate_columns(columns: list[str]) -> None:
    for column in columns:
        _validate_ident(column)


def _qident(name: str, db: FabricDatabase) -> str:
    _validate_ident(name)
    if db.dialect == "sqlite":
        return f'"{name}"'
    return f"[{name}]"


def _qtable(name: str, db: FabricDatabase) -> str:
    _validate_ident(name)
    if db.dialect == "sqlite":
        return f'"{name}"'
    return f"[dbo].[{name}]"


def _filter_column(table: str, column: str, embeds: list[_Embed], db: FabricDatabase) -> str:
    if "." in column:
        relation, remote = column.split(".", 1)
        _validate_ident(relation)
        _validate_ident(remote)
        if any(embed.relation == relation for embed in embeds) or (table, relation) in RELATIONS:
            return f"{_embed_alias(relation)}.{_qident(remote, db)}"
        raise FabricDataError("Invalid filter column")
    _validate_ident(column)
    return f"t0.{_qident(column, db)}" if True else _qident(column, db)


def _bind(table: str, column: str, value: Any) -> Any:
    if isinstance(value, bool) or column in BIT_COLUMNS and isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, bool):
        return 1 if value else 0
    if column in JSON_COLUMNS:
        if value is None:
            return None
        if isinstance(value, str):
            return value
        return json.dumps(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value


def _shape_row(table: str, row: dict[str, Any], embeds: list[_Embed]) -> dict[str, Any]:
    shaped: dict[str, Any] = {}
    embed_data: dict[str, dict[str, Any]] = {embed.relation: {} for embed in embeds}
    for key, value in row.items():
        placed = False
        for embed in embeds:
            prefix = _embed_key(embed.relation, "")
            if key.startswith(prefix):
                embed_data[embed.relation][key[len(prefix):]] = _coerce(key[len(prefix):], value)
                placed = True
                break
        if not placed:
            shaped[key] = _coerce(key, value)
    for relation, payload in embed_data.items():
        shaped[relation] = payload
    return shaped


def _coerce(column: str, value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if column in BIT_COLUMNS and value is not None:
        return bool(value)
    if column in JSON_COLUMNS and isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


def _parse_embeds(columns: str) -> list[_Embed]:
    embeds: list[_Embed] = []
    for part in _split_select(columns):
        match = re.fullmatch(r"(\w+)!(inner|left)\((.*)\)", part.strip())
        if not match:
            continue
        cols = [c.strip() for c in match.group(3).split(",") if c.strip()]
        embeds.append(_Embed(match.group(1), match.group(2), cols))
    return embeds


def _split_select(columns: str) -> list[str]:
    parts: list[str] = []
    buf: list[str] = []
    depth = 0
    for char in columns:
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
        elif char == "," and depth == 0:
            parts.append("".join(buf).strip())
            buf = []
            continue
        buf.append(char)
    if buf:
        parts.append("".join(buf).strip())
    return [part for part in parts if part]


def _embed_alias(relation: str) -> str:
    return f"e_{relation}"


def _embed_key(relation: str, column: str) -> str:
    return f"__{relation}__{column}"


def _empty_in(filters: list[_Filter]) -> bool:
    return any(item.op == "in" and not item.value for item in filters)

"""SQL auth persistence (SQLite default; Postgres when DATABASE_URL is postgresql://)."""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

from app.db.postgres import SCHEMA_SQL, database_url, use_postgres_auth

_DATA = Path(__file__).resolve().parent.parent / "data"
_SQLITE_DEFAULT = _DATA / "auth.db"


def use_db_auth() -> bool:
    """True when SQL auth backend is active (Postgres or SQLite file)."""
    if use_postgres_auth():
        return True
    return os.environ.get("USE_DB_AUTH", "").lower() in ("1", "true", "yes")


def sqlite_path() -> Path:
    raw = os.environ.get("AUTH_SQLITE_PATH")
    if raw:
        return Path(raw)
    return _SQLITE_DEFAULT


def backend_name() -> str:
    url = database_url() or ""
    if use_postgres_auth() and url.startswith(("postgres://", "postgresql://")):
        return "postgres"
    if use_db_auth():
        return "sqlite"
    return "json"


@contextmanager
def connect() -> Iterator[Any]:
    url = database_url() or ""
    if use_postgres_auth() and url.startswith(("postgres://", "postgresql://")):
        import psycopg

        with psycopg.connect(url) as conn:
            yield conn
        return
    _DATA.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(sqlite_path()))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def _exec(conn: Any, sql: str, params: tuple = ()) -> Any:
    # psycopg uses %s, sqlite uses ?
    url = database_url() or ""
    if use_postgres_auth() and url.startswith(("postgres://", "postgresql://")):
        return conn.execute(sql, params)
    q = sql.replace("%s", "?")
    return conn.execute(q, params)


def apply_schema() -> Dict[str, Any]:
    with connect() as conn:
        if backend_name() == "postgres":
            conn.execute(SCHEMA_SQL)
        else:
            # SQLite-friendly DDL
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS intellens_users (
                  id TEXT PRIMARY KEY,
                  email TEXT UNIQUE,
                  name TEXT,
                  kind TEXT NOT NULL DEFAULT 'registered',
                  account_type TEXT,
                  org_id TEXT,
                  role TEXT,
                  email_verified INTEGER DEFAULT 0,
                  active INTEGER DEFAULT 1,
                  password_salt TEXT,
                  password_hash TEXT,
                  preferences TEXT DEFAULT '{}',
                  terms_version TEXT,
                  privacy_version TEXT,
                  terms_accepted_at TEXT,
                  created_at TEXT,
                  extra TEXT DEFAULT '{}'
                );
                CREATE TABLE IF NOT EXISTS intellens_sessions (
                  token TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL,
                  created_at TEXT
                );
                CREATE TABLE IF NOT EXISTS intellens_auth_tokens (
                  token TEXT PRIMARY KEY,
                  kind TEXT NOT NULL,
                  email TEXT,
                  payload TEXT DEFAULT '{}',
                  created_at TEXT
                );
                CREATE TABLE IF NOT EXISTS intellens_billing (
                  id TEXT PRIMARY KEY,
                  org_id TEXT,
                  kind TEXT,
                  status TEXT,
                  amount_inr REAL,
                  payload TEXT DEFAULT '{}',
                  created_at TEXT
                );
                CREATE TABLE IF NOT EXISTS intellens_legal_attestations (
                  id TEXT PRIMARY KEY,
                  kind TEXT,
                  status TEXT,
                  attested_by TEXT,
                  note TEXT,
                  created_at TEXT
                );
                CREATE TABLE IF NOT EXISTS intellens_label_drafts (
                  id TEXT PRIMARY KEY,
                  org_id TEXT,
                  company_id TEXT,
                  status TEXT,
                  payload TEXT NOT NULL DEFAULT '{}',
                  updated_at TEXT
                );
                """
            )
    return {"ok": True, "backend": backend_name()}


def upsert_user(user: Dict[str, Any]) -> None:
    prefs = json.dumps(user.get("preferences") or {})
    extra = {
        k: user[k]
        for k in user
        if k
        not in {
            "id",
            "email",
            "name",
            "kind",
            "account_type",
            "org_id",
            "role",
            "email_verified",
            "active",
            "password_salt",
            "password_hash",
            "preferences",
            "terms_version",
            "privacy_version",
            "terms_accepted_at",
            "created_at",
        }
    }
    with connect() as conn:
        _exec(
            conn,
            """
            INSERT INTO intellens_users (
              id, email, name, kind, account_type, org_id, role,
              email_verified, active, password_salt, password_hash,
              preferences, terms_version, privacy_version, terms_accepted_at, created_at, extra
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT(id) DO UPDATE SET
              email=excluded.email, name=excluded.name, kind=excluded.kind,
              account_type=excluded.account_type, org_id=excluded.org_id, role=excluded.role,
              email_verified=excluded.email_verified, active=excluded.active,
              password_salt=excluded.password_salt, password_hash=excluded.password_hash,
              preferences=excluded.preferences, terms_version=excluded.terms_version,
              privacy_version=excluded.privacy_version,
              terms_accepted_at=excluded.terms_accepted_at, extra=excluded.extra
            """,
            (
                user["id"],
                user.get("email"),
                user.get("name"),
                user.get("kind", "registered"),
                user.get("account_type"),
                user.get("org_id"),
                user.get("role"),
                1 if user.get("email_verified") else 0,
                0 if user.get("active") is False else 1,
                user.get("password_salt"),
                user.get("password_hash"),
                prefs,
                user.get("terms_version"),
                user.get("privacy_version"),
                user.get("terms_accepted_at"),
                user.get("created_at"),
                json.dumps(extra),
            ),
        )


def _row_user(row: Any) -> Dict[str, Any]:
    d = dict(row)
    prefs = d.get("preferences") or "{}"
    if isinstance(prefs, str):
        prefs = json.loads(prefs)
    extra = d.get("extra") or "{}"
    if isinstance(extra, str):
        extra = json.loads(extra) if extra else {}
    out = {
        "id": d["id"],
        "email": d.get("email"),
        "name": d.get("name"),
        "kind": d.get("kind"),
        "account_type": d.get("account_type"),
        "org_id": d.get("org_id"),
        "role": d.get("role"),
        "email_verified": bool(d.get("email_verified")),
        "active": bool(d.get("active", 1)),
        "password_salt": d.get("password_salt"),
        "password_hash": d.get("password_hash"),
        "preferences": prefs,
        "terms_version": d.get("terms_version"),
        "privacy_version": d.get("privacy_version"),
        "terms_accepted_at": d.get("terms_accepted_at"),
        "created_at": d.get("created_at"),
    }
    out.update(extra or {})
    return out


def list_users() -> List[Dict[str, Any]]:
    with connect() as conn:
        cur = _exec(conn, "SELECT * FROM intellens_users")
        rows = cur.fetchall()
    return [_row_user(r) for r in rows]


def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    with connect() as conn:
        cur = _exec(conn, "SELECT * FROM intellens_users WHERE id=%s", (user_id,))
        row = cur.fetchone()
    return _row_user(row) if row else None


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with connect() as conn:
        cur = _exec(
            conn,
            "SELECT * FROM intellens_users WHERE lower(email)=lower(%s)",
            (email,),
        )
        row = cur.fetchone()
    return _row_user(row) if row else None


def replace_all_users(users: List[Dict[str, Any]]) -> None:
    with connect() as conn:
        _exec(conn, "DELETE FROM intellens_users")
    for u in users:
        upsert_user(u)


def put_session(token: str, user_id: str, created_at: str) -> None:
    with connect() as conn:
        _exec(
            conn,
            """
            INSERT INTO intellens_sessions (token, user_id, created_at)
            VALUES (%s,%s,%s)
            ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id
            """,
            (token, user_id, created_at),
        )


def get_session(token: str) -> Optional[Dict[str, str]]:
    with connect() as conn:
        cur = _exec(
            conn, "SELECT token, user_id, created_at FROM intellens_sessions WHERE token=%s", (token,)
        )
        row = cur.fetchone()
    if not row:
        return None
    d = dict(row)
    return {"user_id": d["user_id"], "created_at": d["created_at"]}


def delete_session(token: str) -> None:
    with connect() as conn:
        _exec(conn, "DELETE FROM intellens_sessions WHERE token=%s", (token,))


def delete_sessions_for_user(user_id: str) -> None:
    with connect() as conn:
        _exec(conn, "DELETE FROM intellens_sessions WHERE user_id=%s", (user_id,))


def clear_sessions() -> None:
    with connect() as conn:
        _exec(conn, "DELETE FROM intellens_sessions")


def put_token(token: str, kind: str, email: str, payload: Dict[str, Any], created_at: str) -> None:
    with connect() as conn:
        _exec(
            conn,
            """
            INSERT INTO intellens_auth_tokens (token, kind, email, payload, created_at)
            VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT(token) DO UPDATE SET kind=excluded.kind, payload=excluded.payload
            """,
            (token, kind, email, json.dumps(payload), created_at),
        )


def pop_token(token: str) -> Optional[Dict[str, Any]]:
    with connect() as conn:
        cur = _exec(conn, "SELECT * FROM intellens_auth_tokens WHERE token=%s", (token,))
        row = cur.fetchone()
        if not row:
            return None
        _exec(conn, "DELETE FROM intellens_auth_tokens WHERE token=%s", (token,))
    d = dict(row)
    payload = d.get("payload") or "{}"
    if isinstance(payload, str):
        payload = json.loads(payload)
    return {"kind": d["kind"], "email": d.get("email"), "created_at": d.get("created_at"), **payload}


def clear_tokens() -> None:
    with connect() as conn:
        _exec(conn, "DELETE FROM intellens_auth_tokens")


def insert_billing(row: Dict[str, Any]) -> None:
    with connect() as conn:
        _exec(
            conn,
            """
            INSERT INTO intellens_billing (id, org_id, kind, status, amount_inr, payload, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                row["id"],
                row.get("org_id"),
                row.get("kind"),
                row.get("status"),
                row.get("amount_inr"),
                json.dumps(row.get("payload") or {}),
                row.get("created_at"),
            ),
        )


def list_billing(org_id: Optional[str] = None) -> List[Dict[str, Any]]:
    with connect() as conn:
        if org_id:
            cur = _exec(conn, "SELECT * FROM intellens_billing WHERE org_id=%s", (org_id,))
        else:
            cur = _exec(conn, "SELECT * FROM intellens_billing")
        rows = cur.fetchall()
    out = []
    for r in rows:
        d = dict(r)
        payload = d.get("payload") or "{}"
        if isinstance(payload, str):
            payload = json.loads(payload)
        out.append({**d, "payload": payload})
    return out


def insert_attestation(row: Dict[str, Any]) -> None:
    with connect() as conn:
        _exec(
            conn,
            """
            INSERT INTO intellens_legal_attestations
              (id, kind, status, attested_by, note, created_at)
            VALUES (%s,%s,%s,%s,%s,%s)
            """,
            (
                row["id"],
                row["kind"],
                row["status"],
                row.get("attested_by"),
                row.get("note"),
                row.get("created_at"),
            ),
        )


def latest_attestation(kind: str) -> Optional[Dict[str, Any]]:
    with connect() as conn:
        cur = _exec(
            conn,
            """
            SELECT * FROM intellens_legal_attestations WHERE kind=%s
            ORDER BY created_at DESC LIMIT 1
            """,
            (kind,),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def wipe_all() -> None:
    apply_schema()
    with connect() as conn:
        for table in (
            "intellens_sessions",
            "intellens_auth_tokens",
            "intellens_users",
            "intellens_billing",
            "intellens_legal_attestations",
            "intellens_label_drafts",
        ):
            try:
                _exec(conn, f"DELETE FROM {table}")
            except Exception:
                pass

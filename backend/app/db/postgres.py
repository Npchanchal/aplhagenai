"""Optional Postgres connectivity for production (users/orgs/sessions migration path)."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

# Applied when DATABASE_URL is set — auth still uses JSON until USE_POSTGRES_AUTH=1
# and a cutover migration is run (see docs/INFRA_PRODUCTION.md).

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS intellens_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  kind TEXT NOT NULL DEFAULT 'registered',
  account_type TEXT,
  org_id TEXT,
  role TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  password_salt TEXT,
  password_hash TEXT,
  preferences JSONB DEFAULT '{}',
  terms_version TEXT,
  privacy_version TEXT,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  extra JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS intellens_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS intellens_auth_tokens (
  token TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  email TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS intellens_orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL,
  account_type TEXT,
  seats INT NOT NULL,
  seats_used INT NOT NULL DEFAULT 0,
  payload JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intellens_billing (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  kind TEXT,
  status TEXT,
  amount_inr DOUBLE PRECISION,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS intellens_legal_attestations (
  id TEXT PRIMARY KEY,
  kind TEXT,
  status TEXT,
  attested_by TEXT,
  note TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS intellens_label_drafts (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  company_id TEXT,
  status TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ
);
"""


def database_url() -> Optional[str]:
    return os.environ.get("DATABASE_URL") or os.environ.get("INTELLENS_DATABASE_URL")


def postgres_enabled() -> bool:
    return bool(database_url())


def use_postgres_auth() -> bool:
    return postgres_enabled() and os.environ.get("USE_POSTGRES_AUTH", "").lower() in (
        "1",
        "true",
        "yes",
    )


def postgres_status() -> Dict[str, Any]:
    from app.db.auth_db import backend_name, use_db_auth

    url = database_url()
    if not url:
        return {
            "configured": False,
            "auth_backend": backend_name(),
            "db_auth": use_db_auth(),
            "note": "Set DATABASE_URL and run schema; USE_POSTGRES_AUTH=1 to cut over session auth.",
        }
    try:
        import psycopg  # type: ignore

        with psycopg.connect(url, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return {
            "configured": True,
            "reachable": True,
            "auth_backend": "postgres" if use_postgres_auth() else "json",
            "use_postgres_auth": use_postgres_auth(),
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "configured": True,
            "reachable": False,
            "auth_backend": "json",
            "error": str(exc),
        }


def apply_schema() -> Dict[str, Any]:
    url = database_url()
    if not url:
        raise RuntimeError("DATABASE_URL not set")
    import psycopg  # type: ignore

    with psycopg.connect(url) as conn:
        conn.execute(SCHEMA_SQL)
        conn.commit()
    return {"ok": True, "schema": "intellens_*"}

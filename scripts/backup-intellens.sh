#!/usr/bin/env bash
# Backup IntelLens JSON stores + optional Postgres dump.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${INTELLENS_BACKUP_DIR:-$ROOT/backups}/$STAMP"
mkdir -p "$OUT"

echo "Backing up to $OUT"
cp -a "$ROOT/backend/app/data/." "$OUT/data/" 2>/dev/null || true
if [[ -n "${DATABASE_URL:-}" ]]; then
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump "$DATABASE_URL" > "$OUT/postgres.sql"
    echo "Wrote postgres.sql"
  else
    echo "pg_dump not found — skipped Postgres dump"
  fi
fi
if [[ -f "${AUTH_SQLITE_PATH:-$ROOT/backend/app/data/auth.db}" ]]; then
  cp -a "${AUTH_SQLITE_PATH:-$ROOT/backend/app/data/auth.db}" "$OUT/auth.db" || true
fi
tar -czf "$OUT.tgz" -C "$(dirname "$OUT")" "$(basename "$OUT")"
echo "Archive: $OUT.tgz"

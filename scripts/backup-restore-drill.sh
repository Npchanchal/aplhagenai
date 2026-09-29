#!/usr/bin/env bash
# Local backup drill (W8.6). Proves backup-intellens.sh archives the score ledger.
# Does not touch AWS. A production restore still needs the EFS backup plan applied.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
INTELLENS_BACKUP_DIR="$TMP" "$ROOT/scripts/backup-intellens.sh" >/tmp/citealpha-backup-drill.log
ARCHIVE="$(find "$TMP" -name '*.tgz' | head -1)"
test -n "$ARCHIVE"
tar -tzf "$ARCHIVE" | grep -q 'score_ledger.jsonl'
echo "backup drill ok"

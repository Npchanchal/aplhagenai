#!/usr/bin/env bash
# The daily review runs inside the API process (INTELLENS_GUIDANCE_REVIEW=1).
# This script only removes an older user crontab line, if one is still installed.
set -euo pipefail
MARK="# citealpha-guidance-review"
existing="$(crontab -l 2>/dev/null || true)"
if ! printf '%s\n' "$existing" | grep -F "$MARK" >/dev/null; then
  echo "no guidance-review crontab entry"
  exit 0
fi
printf '%s\n' "$existing" | grep -v -F "$MARK" | sed '/^$/d' | crontab -
echo "removed guidance-review crontab entry"

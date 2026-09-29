"""Universe-wide source URL / quote verification (plan W2.7).

    python -m app.jobs.verify_sources              # check + write Trust report
    python -m app.jobs.verify_sources --write      # also mark failures not citeable + queue
    python -m app.jobs.verify_sources --limit 20

Schedule: docker compose scheduler (INTELLENS_VERIFY_SOURCES=1, at most once per 24h)
or cron: python -m app.jobs.verify_sources --write
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional

from app.services.source_verify import verify_all_bindings


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--write",
        action="store_true",
        help="mark failed quotes citeable=false and enqueue re-cite",
    )
    ap.add_argument("--limit", type=int, default=0, help="max bindings (0 = all)")
    args = ap.parse_args(argv)
    limit = args.limit if args.limit and args.limit > 0 else None
    report = verify_all_bindings(write=args.write, limit=limit)
    json.dump(report, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0 if report.get("failed", 0) == 0 or not args.write else 0


if __name__ == "__main__":
    raise SystemExit(main())

"""CLI entry: python -m app.jobs.sensex_ir_crawl [--live] [--dry-run] [--limit N]"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional

from app.services.crawl import run_sensex_ir_crawl


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Sensex IR crawl → pending document review")
    p.add_argument("--limit", type=int, default=30)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument(
        "--live",
        action="store_true",
        help="HTTP-fetch allowlisted IR URLs (falls back to catalog digest on error)",
    )
    args = p.parse_args(argv)
    report = run_sensex_ir_crawl(limit=args.limit, dry_run=args.dry_run, live=args.live)
    print(json.dumps(report, indent=2))
    return 0 if report.get("failed", 0) == 0 or args.dry_run else 1


if __name__ == "__main__":
    sys.exit(main())

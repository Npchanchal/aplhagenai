"""CLI: python -m app.jobs.classify_india_coverage [--cohort nifty50] [--limit N]

Walks a cohort, optionally ingesting/extracting, and stamps coverage_status.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Optional

from app.services.india_coverage import roll_cohort, universe_coverage


def main(argv: Optional[list] = None) -> int:
    p = argparse.ArgumentParser(description="Classify India listing GCI coverage")
    p.add_argument("--cohort", default="nifty50", choices=["nifty50", "in1000", "nse_all", "bse_only", "all"])
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--live", action="store_true")
    p.add_argument("--no-extract", action="store_true")
    p.add_argument("--no-discover", action="store_true", help="With --live, skip NSE discovery")
    p.add_argument("--summary", action="store_true", help="Print universe tallies only")
    args = p.parse_args(argv)
    if args.summary:
        print(json.dumps(universe_coverage(), indent=2))
        return 0
    report = roll_cohort(
        args.cohort,
        limit=args.limit,
        live=args.live,
        extract=not args.no_extract,
        discover=args.live and not args.no_discover,
    )
    slim = {k: v for k, v in report.items() if k != "results"}
    print(json.dumps(slim, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

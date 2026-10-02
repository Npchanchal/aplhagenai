"""CLI: python -m app.jobs.extract_india_guidance [--cohort nifty50] [--limit N]

Extracts guidance shells from accepted filings. Does not invent actuals.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Optional

from app.services.extract_pipeline import run_extract_cohort
from app.services.india_coverage import cohort_ids


def main(argv: Optional[list] = None) -> int:
    p = argparse.ArgumentParser(description="Extract India guidance from accepted filings")
    p.add_argument("--cohort", default="nifty50", choices=["nifty50", "in1000", "nse_all", "bse_only", "all"])
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--no-relabel", action="store_true")
    args = p.parse_args(argv)
    ids = cohort_ids(args.cohort)
    if args.limit:
        ids = ids[: args.limit]
    report = run_extract_cohort(ids, relabel=not args.no_relabel)
    print(json.dumps({k: v for k, v in report.items() if k != "results"}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

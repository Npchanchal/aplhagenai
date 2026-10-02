"""CLI: python -m app.jobs.ingest_india_filings [--live] [--discover] [--dry-run] [--limit N]

Fetches allowlisted URLs already recorded on outcome rows for the promise
cohort; ``--discover`` adds NSE con-call / presentation / results filings.
Does not invent filings or scores.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Optional

from app.services.exchange_filings import ingest_promise_cohort
from app.services.score_sla import append_pipeline_event


def main(argv: Optional[list] = None) -> int:
    p = argparse.ArgumentParser(description="Ingest India exchange filings for the promise cohort")
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--live", action="store_true", help="HTTP-fetch allowlisted outcome URLs")
    p.add_argument("--discover", action="store_true", help="Also discover NSE filings by symbol")
    args = p.parse_args(argv)
    report = ingest_promise_cohort(
        live=args.live, dry_run=args.dry_run, limit=args.limit, discover=args.discover
    )
    if not args.dry_run:
        for company in report.get("results") or []:
            for row in company.get("results") or []:
                if row.get("ok") and row.get("doc_id"):
                    append_pipeline_event(
                        {
                            "kind": "filing_seen",
                            "company_id": company.get("company_id"),
                            "doc_id": row.get("doc_id"),
                            "url": row.get("url"),
                            "action": "exchange_filing",
                        }
                    )
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

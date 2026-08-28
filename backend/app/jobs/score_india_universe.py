"""Score full India NSE/BSE universe with active gci_scoring (default v3).

  python -m app.jobs.score_india_universe
  python -m app.jobs.score_india_universe --limit 100
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional

from app.data.gci_score_cache import build_india_gci_cache


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Score NSE+BSE listings with GCI v2")
    p.add_argument("--limit", type=int, default=None)
    args = p.parse_args(argv)
    report = build_india_gci_cache(limit=args.limit)
    print(
        json.dumps(
            {
                "ok": True,
                "algorithm": report.get("algorithm"),
                "count": report.get("count"),
                "scored_count": report.get("scored_count"),
                "horizons_yoy_count": report.get("horizons_yoy_count"),
                "horizons_full_count": report.get("horizons_full_count"),
                "as_of": report.get("as_of"),
                "note": report.get("note"),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Build India GCI depth: citations + multi-horizon deltas + listing scores.

  python -m app.jobs.build_universe_gci_depth
  python -m app.jobs.build_universe_gci_depth --limit 200
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(
        description="Ensure Sensex citations, rebuild India GCI cache with WoW/MoM/QoQ/YoY"
    )
    p.add_argument("--limit", type=int, default=None, help="Limit listing universe (debug)")
    p.add_argument("--skip-cache", action="store_true", help="Skip India listing score rebuild")
    p.add_argument("--skip-citations", action="store_true", help="Skip citation corpus / index")
    args = p.parse_args(argv)

    out: dict = {"ok": True}

    if not args.skip_citations:
        from app.services.citation_corpus import (
            build_citation_index,
            ensure_sensex_citation_corpus,
        )
        from app.services.pit_warehouse import ensure_sensex_pit_warehouse

        cites = ensure_sensex_citation_corpus()
        pit = ensure_sensex_pit_warehouse()
        index = build_citation_index(citeable_only=False)
        out["citations"] = {
            "companies": cites.get("companies"),
            "linked": cites.get("linked"),
            "docs_touched": cites.get("docs_touched"),
            "index_citations": index.get("citation_count"),
            "index_citeable": index.get("citeable_count"),
            "index_path": index.get("path"),
        }
        out["pit"] = {
            "companies": pit.get("companies"),
            "min_n": pit.get("min_n"),
            "series_kind": pit.get("series_kind"),
        }

    if not args.skip_cache:
        from app.data.gci_score_cache import build_india_gci_cache

        report = build_india_gci_cache(limit=args.limit)
        out["gci_cache"] = {
            "algorithm": report.get("algorithm"),
            "count": report.get("count"),
            "scored_count": report.get("scored_count"),
            "horizons_yoy_count": report.get("horizons_yoy_count"),
            "horizons_full_count": report.get("horizons_full_count"),
            "as_of": report.get("as_of"),
        }

    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

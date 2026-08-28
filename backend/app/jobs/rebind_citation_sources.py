"""Rebuild hand-labeled citation corpus + index after verified source updates.

Usage: python3 -m app.jobs.rebind_citation_sources
"""

from __future__ import annotations

from app.data import doc_store
from app.data.seed import reset_data
from app.services.citation_corpus import build_citation_index, ensure_sensex_citation_corpus


def main() -> None:
    reset_data()
    doc_store.reset_docs()
    report = ensure_sensex_citation_corpus()
    index = build_citation_index(citeable_only=False)
    print({"corpus": report, "index": index})


if __name__ == "__main__":
    main()

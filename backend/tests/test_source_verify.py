"""Source URL verification for citeable outcomes."""

import pytest

from app.data.verified_sensex_sources import VERIFIED_SENSEX_SOURCES
from app.services.source_verify import quote_in_text, verify_source_binding


def test_quote_in_text_normalizes_dashes():
    assert quote_in_text("3.45% to 3.5%", "margins stable at 3.45% to 3.5% printed")


@pytest.mark.parametrize(
    "company_id",
    [
        "indusindbk",
        "axisbank",
        "techm",
        "sunpharma",
    ],
)
def test_verified_catalog_quote_on_url(company_id: str):
    rows = VERIFIED_SENSEX_SOURCES.get(company_id) or []
    assert rows, f"missing verified rows for {company_id}"
    row = rows[0]
    ok = verify_source_binding(row["source_url"], row["quote_span"])
    assert ok is not False, f"quote missing on {row['source_url']}: {row['quote_span']!r}"

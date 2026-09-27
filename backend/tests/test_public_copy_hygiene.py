"""Public copy must stay factual (no recommendation phrasing) and match shipped data."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

FRONTEND = Path(__file__).resolve().parents[2] / "frontend"

PUBLIC_COPY_FILES = [
    FRONTEND / "src/i18n/locales/en.json",
    FRONTEND / "src/lib/seoRoutes.json",
    FRONTEND / "src/lib/glossary.ts",
    FRONTEND / "src/lib/tours.ts",
    FRONTEND / "src/lib/blogPosts.ts",
    FRONTEND / "scripts/seo-shared.mjs",
    FRONTEND / "public/llms.txt",
]

RECOMMENDATION_PATTERNS = [
    r"\b(buy|sell|accumulate|avoid|reduce|add)\s+(this|the|these)\s+(stock|stocks|share|shares|name|names)\b",
    r"\btop\s+picks?\b",
    r"\b(strong\s+)?(buy|sell|hold)\s+(rating|signal|call|recommendation)s?\b",
    r"\b(over|under)weight\b",
    r"\btarget\s+price\b",
    r"\bmulti-?bagger\b",
    r"\boutperform(s|ing)?\s+the\s+(market|index|sensex|nifty)\b",
]

NEGATION = re.compile(r"\b(not|no|never|without|nor)\b[^.]{0,30}$", re.IGNORECASE)

RETIRED_CLAIMS = [
    r"Sensex\s*(→|and|&amp;|&|/)\s*Nifty\s+(names|by)",
    r"research OS\b",
    r'href="\$\{SITE\}/api/meta"',
]


def _copy_text(path: Path) -> str:
    if path.suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return "\n".join(str(v) for v in data.values())
        return json.dumps(data, ensure_ascii=False)
    return path.read_text(encoding="utf-8")


@pytest.mark.parametrize("path", PUBLIC_COPY_FILES, ids=lambda p: p.name)
def test_public_copy_has_no_recommendation_phrasing(path: Path):
    text = _copy_text(path)
    hits = [
        m.group(0)
        for pat in RECOMMENDATION_PATTERNS
        for m in re.finditer(pat, text, flags=re.IGNORECASE)
        if not NEGATION.search(text[max(0, m.start() - 40) : m.start()])
    ]
    assert not hits, f"{path.name}: recommendation-style phrasing {hits}"


def test_negation_guard_still_catches_recommendations():
    text = "Analysts should buy this stock. Not a Buy, Hold, or Sell recommendation."
    hits = [
        m.group(0)
        for pat in RECOMMENDATION_PATTERNS
        for m in re.finditer(pat, text, flags=re.IGNORECASE)
        if not NEGATION.search(text[max(0, m.start() - 40) : m.start()])
    ]
    assert hits == ["buy this stock"]


@pytest.mark.parametrize("path", PUBLIC_COPY_FILES, ids=lambda p: p.name)
def test_public_copy_has_no_retired_claims(path: Path):
    text = _copy_text(path)
    hits = [m.group(0) for pat in RETIRED_CLAIMS for m in re.finditer(pat, text)]
    assert not hits, f"{path.name}: retired claim {hits}"


def test_static_worked_example_matches_live_infosys_data():
    gci = client.get("/api/companies/infy/gci").json()
    rows = {
        o["period"]: o
        for o in gci["outcomes"]
        if o.get("thread_id") == "infy-rev-cc" and o.get("actual_value") is not None
    }
    static_html = (FRONTEND / "scripts/seo-shared.mjs").read_text(encoding="utf-8")
    for period in ("FY22", "FY23", "FY24"):
        o = rows[period]
        assert o["citeable"] is True
        assert o["source_url"] in static_html
        line = (
            f"{period} — guided {o['guided_low']:g}–{o['guided_high']:g}%, "
            f"actual {o['actual_value']:g}% — <strong>{o['label']}</strong> "
            f"(reported {o['as_of']})"
        )
        assert line in static_html or line.replace("4–7%", "4.0–7.0%") in static_html, line

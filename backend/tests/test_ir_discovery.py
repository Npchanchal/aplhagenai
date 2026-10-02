"""AI-guided walk of an issuer's own site: links come only from fetched pages."""

from __future__ import annotations

import pytest

from app.services import ir_discovery as ir


@pytest.fixture(autouse=True)
def _isolate(tmp_path, monkeypatch):
    monkeypatch.setenv("INTELLENS_DATA_DIR", str(tmp_path))
    ir.reset_ir_crawl()
    yield
    ir.reset_ir_crawl()


HOME = "https://www.tatasteel.com/"
IR = "https://www.tatasteel.com/investors/"
SITE = {
    HOME: b"""<html><a href="/investors/">Investors</a>
        <a href="https://www.tatasteel.com/investors/investor-charter/">Investor Charter</a>
        <a href="https://www.moneycontrol.com/tata-steel">News</a>
        <a href="mailto:ir@tatasteel.com">Mail</a></html>""",
    IR: b"""<html>
        <a href="/media/1/q4fy26-earnings-call-transcript.pdf#page=2">Q4 FY26 earnings call transcript</a>
        <a href="/media/2/4qfy26-results-presentation.pdf">Results presentation</a>
        <a href="/media/3/investor-day-2021.pdf">Investor day 2021 presentation</a>
        <a href="https://www.infosys.com/q4-transcript.pdf">Other issuer</a></html>""",
}


def test_page_links_keep_issuer_hosts_and_resolve_relative():
    links = ir.page_links(SITE[IR].decode(), IR, "tatasteel")
    urls = [l["url"] for l in links]
    assert urls[0] == "https://www.tatasteel.com/media/1/q4fy26-earnings-call-transcript.pdf"
    assert not any("infosys" in u for u in urls)
    home = [l["url"] for l in ir.page_links(SITE[HOME].decode(), HOME, "tatasteel")]
    assert IR in home and not any("moneycontrol" in u or u.startswith("mailto") for u in home)


def test_crawl_follows_chosen_pages_and_ignores_invented_numbers():
    def choose(company, page_url, links):
        if page_url == HOME:
            return {"documents": [{"n": 99, "kind": "concall"}], "pages": [0, 42]}
        return {
            "documents": [
                {"n": 0, "kind": "concall"},
                {"n": 1, "kind": "presentation"},
                {"n": 2, "kind": "presentation"},
                {"n": 0, "kind": "made_up"},
            ],
            "pages": [],
        }

    docs = ir.discover_from_issuer_site(
        "tatasteel", fetch=lambda u: SITE[u], choose=choose, company_name="Tata Steel"
    )
    assert [d["url"].rsplit("/", 1)[-1] for d in docs] == [
        "q4fy26-earnings-call-transcript.pdf",
        "4qfy26-results-presentation.pdf",
    ]
    assert all(d["found_by"] == "ir_crawl" and d["date"] is None for d in docs)


def test_keyword_fallback_skips_charter_pages():
    home = ir.page_links(SITE[HOME].decode(), HOME, "tatasteel")
    picked = ir._keyword_choose("Tata Steel", HOME, home)
    assert [home[n]["url"] for n in picked["pages"]] == [IR]
    docs = ir.page_links(SITE[IR].decode(), IR, "tatasteel")
    kinds = {docs[d["n"]]["url"].rsplit("/", 1)[-1]: d["kind"] for d in ir._keyword_choose("Tata Steel", IR, docs)["documents"]}
    assert kinds["q4fy26-earnings-call-transcript.pdf"] == "concall"


def test_rank_documents_transcripts_first_caps_kinds_and_drops_stale_years():
    docs = [
        {"url": f"p{i}", "category": "presentation", "rank": 1, "year": 2026} for i in range(5)
    ] + [
        {"url": "t", "category": "concall", "rank": 0, "year": 2026},
        {"url": "old", "category": "concall", "rank": 0, "year": 2019},
        {"url": "undated", "category": "annual_report", "rank": 3, "year": None},
    ]
    out = ir.rank_documents(docs, max_docs=8)
    assert out[0]["url"] == "t"
    assert sum(1 for d in out if d["category"] == "presentation") == ir.PER_KIND_CAP
    assert "old" not in [d["url"] for d in out]
    assert "undated" in [d["url"] for d in out]


@pytest.mark.parametrize(
    ("text", "year"),
    [("4qfy26-results-presentation.pdf", 2026), ("Annual Report 2024-25", 2025),
     ("FY 27 outlook", 2027), ("/media/25699/irnsebse.pdf", None),
     ("/media/1609/annual-report-2008-09.pdf", 2009), ("/media/1608/annual-report-07-08.pdf", 2008),
     ("/financial-results/2025-2026/quarter-1/x.pdf", 2026)],
)
def test_latest_year(text, year):
    assert ir.latest_year(text) == year


def test_crawl_off_by_default_and_respects_refresh(monkeypatch):
    from app.services import exchange_filings as ef

    fetched = []
    monkeypatch.setattr(ef, "fetch_bytes", lambda u, cid=None, **kw: fetched.append(u) or b"<html></html>")
    monkeypatch.setattr(ir, "fetch_bytes", lambda u, cid=None, **kw: fetched.append(u) or b"<html></html>")
    monkeypatch.delenv("INTELLENS_IR_CRAWL_DISCOVERY", raising=False)
    assert ir.discover_from_issuer_site("tatasteel") == []
    assert fetched == []
    monkeypatch.setenv("INTELLENS_IR_CRAWL_DISCOVERY", "1")
    ir.discover_from_issuer_site("tatasteel", choose=lambda *a: {})
    first = len(fetched)
    assert first > 0
    ir.reset_ir_crawl()
    ir.discover_from_issuer_site("tatasteel", choose=lambda *a: {})
    assert len(fetched) == first


def test_language_copies_are_not_followed():
    assert ir._is_language_copy("https://www.hdfcbank.com/hindi/about-us/investor-relations")
    assert not ir._is_language_copy("https://www.hdfcbank.com/about-us/investor-relations")


def test_start_urls_prefer_curated_investor_page():
    assert ir.start_urls("asianpaints")[0] == "https://www.asianpaints.com/more/investors.html"
    # Axis's curated page is on axisbank.com; only axis.bank.in is allowed for it.
    assert ir.start_urls("axisbank")[0] == "https://www.axis.bank.in/"
    assert ir.start_urls("maxhealth") == [
        "https://www.maxhealthcare.in/",
        "https://www.maxhealthcare.in/investors/",
    ]
    assert ir.start_urls("no_such_company") == []

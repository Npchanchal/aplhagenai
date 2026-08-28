"""World-class citation object + lookup."""

from app.services.citations import (
    bibliographic_line,
    citation_id_for,
    document_to_citation,
    external_highlight_url,
    format_ic_footnote,
    format_markdown,
    highlight_url,
    is_indexed_excerpt_source,
    lookup_citation,
    list_company_citations,
)
from app.services.repository import get_company_gci
from app.services.research import research_chat


def test_bibliographic_and_markdown():
    rec = {
        "name": "Infosys Ltd",
        "ticker": "INFY",
        "title": "Q4 transcript",
        "date": "2025-04-17",
        "source_url": "https://example.com/ir",
        "citation_id": "cite_abc",
        "quote_span": "growth 5-7%",
        "locator": "FY25 · revenue growth pct",
        "n": 1,
    }
    line = bibliographic_line(rec)
    assert "Infosys" in line and "cite_abc" in line and "growth 5-7%" in line
    md = format_markdown(rec)
    assert "[1]" in md and "example.com" in md
    note = format_ic_footnote(rec)
    assert "INFY" in note and "cite_abc" in note


def test_research_chat_numbered_citations():
    out = research_chat("What is margin guidance?", company_id="infy")
    assert "answer" in out
    if not out.get("refused") and out.get("citations"):
        assert "[1]" in out["answer"]
        c0 = out["citations"][0]
        assert c0.get("n") == 1
        assert c0.get("citation_id", "").startswith("cite_")
        assert c0.get("bibliographic")
        assert c0.get("markdown")
        assert c0.get("locator")


def test_lookup_infy_outcome_citation():
    detail = get_company_gci("infy")
    citeable = next((o for o in detail.outcomes if o.citeable and o.citation_id), None)
    assert citeable is not None
    found = lookup_citation(citeable.citation_id)
    assert found and found["citation_id"] == citeable.citation_id
    assert found.get("quote") or found.get("quote_span")
    assert found.get("permalink", "").startswith("/c/")
    assert found.get("document_text")
    assert found.get("quote_span") in found["document_text"] or found.get("excerpt_only")
    if found.get("source_verified") is not False:
        assert found.get("highlight_url")
        assert "#:~:text=" in found["highlight_url"] or "#search=" in found["highlight_url"]
    if found.get("span_start") is not None and found.get("span_end") is not None:
        snippet = found["document_text"][found["span_start"] : found["span_end"]]
        assert snippet


def test_list_company_citations_infy():
    rows = list_company_citations("infy", citeable_only=True)
    assert rows
    assert all(r.get("citeable") for r in rows)
    assert rows[0].get("n") == 1


def test_curated_excerpt_no_external_highlight():
    assert is_indexed_excerpt_source(
        source_url="https://www.bseindia.com/stock-share-price/indusindbk/",
        source_ref="INDUSINDBK-IR-curated",
    )
    assert external_highlight_url(
        source_url="https://www.bseindia.com/stock-share-price/indusindbk/",
        source_ref="INDUSINDBK-IR-curated",
        quote="FY26 margin framing 12–16%",
    ) is None
    line = bibliographic_line(
        {
            "name": "IndusInd Bank Ltd.",
            "title": "FY26 margin",
            "date": "2025-07-01",
            "source_url": "https://www.indusind.com/in/en/personal/investors.html",
            "source_ref": "INDUSINDBK-IR-curated",
            "citation_id": "cite_test",
            "quote_span": "FY26 margin framing 12–16%",
        }
    )
    assert "indexed excerpt" in line.lower()


def test_lookup_indusind_curated_citation():
    detail = get_company_gci("indusindbk")
    citeable = next((o for o in detail.outcomes if o.citeable and o.citation_id), None)
    assert citeable is not None
    found = lookup_citation(citeable.citation_id)
    assert found
    assert found.get("indexed_excerpt") is not True
    assert "indusind.com" in (found.get("source_url") or "")
    assert found.get("quote_span") in (found.get("document_text") or "")
    assert found.get("source_ref", "").endswith("REMARKS") or "INDUSIND" in found.get("source_ref", "")


def test_document_citation_stable():
    doc = {
        "id": "doc-1",
        "company_id": "infy",
        "ticker": "INFY",
        "name": "Infosys",
        "doc_type": "transcript",
        "title": "Call",
        "date": "2025-01-01",
        "url": "https://example.com/t",
        "snippet": "We expect margins to remain in a tight band.",
        "body": "We expect margins to remain in a tight band. Extra.",
    }
    a = document_to_citation(doc, n=1)
    b = document_to_citation(doc, n=1)
    assert a["citation_id"] == b["citation_id"]
    assert a["citation_id"] == citation_id_for(
        company_id="infy",
        period="2025-01-01",
        metric="transcript",
        source_url="https://example.com/t",
        quote_span="We expect margins to remain in a tight band."[:80],
        doc_id="doc-1",
    )
    assert a.get("highlight_url")
    assert "#:~:text=" in a["highlight_url"]


def test_highlight_url_html_and_pdf():
    html = highlight_url("https://ir.example.com/call.html", "growth 5-7%")
    assert html is not None and html.startswith("https://ir.example.com/call.html")
    assert "#:~:text=" in html
    assert "growth" in html
    pdf = highlight_url(
        "https://www.cipla.com/sites/default/files/Transcript-Q4FY23.pdf",
        "EBITDA margin was 24.5%",
    )
    assert pdf is not None and "#search=" in pdf
    assert highlight_url(None, "x") is None
    bare = highlight_url("https://example.com/a", None)
    assert bare == "https://example.com/a"


def test_api_citation_and_document_source():
    from fastapi.testclient import TestClient

    from app.main import app

    detail = get_company_gci("infy")
    citeable = next((o for o in detail.outcomes if o.citeable and o.citation_id), None)
    assert citeable is not None
    client = TestClient(app)
    r = client.get(f"/api/citations/{citeable.citation_id}")
    assert r.status_code == 200
    body = r.json()
    assert body.get("document_text")
    if body.get("source_verified") is not False:
        assert body.get("highlight_url")
    if citeable.doc_id:
        d = client.get(f"/api/documents/{citeable.doc_id}")
        assert d.status_code == 200
        assert d.json().get("text")
    missing = client.get("/api/documents/does-not-exist")
    assert missing.status_code == 404

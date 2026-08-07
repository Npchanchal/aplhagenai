"""Phase implementation tests (0–8)."""

from app.data.hand_labeled import HAND_LABELED, HAND_LABELED_COMPANY_IDS
from app.data.seed import reset_data
from app.data import doc_store, consensus_store
from app.services import ingest, research
from app.services.extraction import extract_guidance
from app.services.feature_flags import flags_dict
from app.services.repository import commit_pending_extract, save_pending_extract


def setup_function():
    reset_data()
    doc_store.reset_docs()


def test_phase0_flags_and_sensex_labeled():
    assert "FREEZE_DEMO_PAD" in flags_dict()
    assert len(HAND_LABELED_COMPANY_IDS) == 30


def test_phase1_every_hand_label_has_source():
    for cid, rows in HAND_LABELED.items():
        assert rows, cid
        for r in rows:
            assert r.get("source_url"), (cid, r.get("period"))
            assert r.get("quote_span"), (cid, r.get("period"))


def test_phase2_ingest_paste_and_dedupe():
    d1 = ingest.ingest_paste("infy", "Unique guidance text alpha-beta-gamma 12%")
    d2 = ingest.ingest_paste("infy", "Unique guidance text alpha-beta-gamma 12%")
    assert d1["doc_id"] == d2["doc_id"]
    docs = doc_store.list_documents(company_id="infy")
    assert any(d["doc_id"] == d1["doc_id"] for d in docs)


def test_phase3_extract_needs_review_then_commit():
    text = get_data_transcript()
    stmts = extract_guidance(text, company_id="infy", period="FY26")
    assert stmts
    assert all(s.get("needs_review") for s in stmts)
    batch = save_pending_extract("infy", stmts)
    out = commit_pending_extract(batch["id"], [0])
    assert out["committed"] == 1


def test_phase3_commit_applies_edits_and_records_reviews():
    from app.data.seed import get_data

    text = get_data_transcript()
    stmts = extract_guidance(text, company_id="infy", period="FY26")
    assert stmts
    batch = save_pending_extract("infy", stmts)
    out = commit_pending_extract(
        batch["id"],
        [0],
        edits={0: {"guided_low": 6.0, "guided_high": 8.0, "guided_value": 7.0}},
        reviewer="test-desk",
    )
    assert out["committed"] == 1
    assert out["edited"] == 1
    data = get_data()
    committed = data["outcomes"]["infy"][-1]
    assert committed["guided_low"] == 6.0
    assert committed["guided_high"] == 8.0
    assert committed["review_status"] == "edited"
    queue_reviews = [r for r in data.get("reviews", []) if r.get("source") == "extract_queue"]
    assert queue_reviews
    assert queue_reviews[-1]["action"] == "edit"
    assert queue_reviews[-1]["reviewer"] == "test-desk"


def get_data_transcript():
    from app.data.seed import get_data

    return get_data()["sample_transcripts"]["infy"]


def test_phase4_cite_only_refuse():
    out = research.research_chat("xyzzy_no_match_99999")
    assert out.get("refused") is True
    assert out.get("citations") == []


def test_phase4_eval_rate():
    cases = [
        {"q": "guidance", "company_id": "infy", "expect_company_id": "infy"},
        {"q": "zzz_nope_12345", "expect_refuse": True},
    ]
    # seed docs first
    doc_store.seed_from_outcomes_and_transcripts()
    res = research.chat_eval_hit_rate(cases)
    assert res["rate"] >= 0.5


def test_phase6_consensus_import():
    n = consensus_store.import_rows(
        [
            {
                "company_id": "infy",
                "period": "FY25",
                "metric": "revenue_growth_cc_pct",
                "street_consensus": 2.5,
            }
        ]
    )
    assert n == 1
    assert consensus_store.lookup("infy", "FY25", "revenue_growth_cc_pct") == 2.5


def test_phase7_nifty_scaffold():
    from app.data.universe import NIFTY_EXTRA

    assert len(NIFTY_EXTRA) >= 5

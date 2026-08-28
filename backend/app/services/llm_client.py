"""OpenAI-compatible LLM + embeddings client (urllib only — no SDK required).

Uses OPENAI_API_KEY or INTELLENS_LLM_API_KEY. When unset, callers fall back locally.
"""

from __future__ import annotations

import json
import math
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Sequence


def llm_api_key() -> Optional[str]:
    key = (
        os.environ.get("INTELLENS_LLM_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or ""
    ).strip()
    return key or None


def llm_base_url() -> str:
    return (
        os.environ.get("INTELLENS_LLM_BASE_URL")
        or os.environ.get("OPENAI_BASE_URL")
        or "https://api.openai.com/v1"
    ).rstrip("/")


def llm_chat_model() -> str:
    return os.environ.get("INTELLENS_LLM_MODEL") or "gpt-4o-mini"


def embed_model() -> str:
    return os.environ.get("INTELLENS_EMBED_MODEL") or "text-embedding-3-small"


def llm_configured() -> bool:
    return llm_api_key() is not None


def _post_json(path: str, payload: Dict[str, Any], *, timeout: float = 45.0) -> Dict[str, Any]:
    key = llm_api_key()
    if not key:
        raise RuntimeError("LLM API key not configured")
    url = f"{llm_base_url()}{path}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
            "User-Agent": "CiteAlpha-GCI/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:500]
        raise RuntimeError(f"LLM HTTP {e.code}: {body}") from e


def chat_completion(
    messages: Sequence[Dict[str, str]],
    *,
    temperature: float = 0.0,
    max_tokens: int = 1200,
) -> str:
    doc = _post_json(
        "/chat/completions",
        {
            "model": llm_chat_model(),
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": list(messages),
        },
    )
    choices = doc.get("choices") or []
    if not choices:
        raise RuntimeError("LLM returned no choices")
    content = (choices[0].get("message") or {}).get("content") or ""
    return str(content).strip()


def embed_texts(texts: Sequence[str]) -> List[List[float]]:
    if not texts:
        return []
    # OpenAI embeds API accepts batch
    doc = _post_json(
        "/embeddings",
        {"model": embed_model(), "input": list(texts)},
        timeout=60.0,
    )
    data = sorted(doc.get("data") or [], key=lambda r: int(r.get("index", 0)))
    return [list(r.get("embedding") or []) for r in data]


def cosine(a: Sequence[float], b: Sequence[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1e-9
    nb = math.sqrt(sum(y * y for y in b)) or 1e-9
    return float(dot / (na * nb))


_GUIDANCE_JSON_HINT = """Extract quantified management guidance from the transcript.
Return ONLY a JSON array. Each object keys:
metric (snake_id e.g. revenue_growth_pct, ebitda_margin_pct, capex_inr_cr),
guided_value (number), guided_low, guided_high, guided_text, quote_span,
speaker (CFO|CEO|Management), confidence (0.5-0.95).
If none found return []. No markdown fences."""


def extract_guidance_via_llm(
    text: str,
    *,
    company_id: str,
    period: str,
    source_ref: str,
) -> List[Dict[str, Any]]:
    """Call chat model; parse JSON array of statements. Raises on transport/parse failure."""
    excerpt = (text or "")[:12000]
    raw = chat_completion(
        [
            {"role": "system", "content": _GUIDANCE_JSON_HINT},
            {
                "role": "user",
                "content": f"company_id={company_id} period={period}\n\n{excerpt}",
            },
        ]
    )
    # Strip optional ```json fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    parsed = json.loads(cleaned)
    if not isinstance(parsed, list):
        raise RuntimeError("LLM extract did not return a JSON array")
    out: List[Dict[str, Any]] = []
    for row in parsed:
        if not isinstance(row, dict) or not row.get("metric"):
            continue
        mid = float(row.get("guided_value") or 0)
        low = row.get("guided_low")
        high = row.get("guided_high")
        low_f = float(low) if low is not None else mid
        high_f = float(high) if high is not None else mid
        quote = str(row.get("quote_span") or row.get("guided_text") or "")[:200]
        out.append(
            {
                "company_id": company_id,
                "period": period,
                "metric": str(row["metric"]),
                "guided_value": mid,
                "guided_low": low_f,
                "guided_high": high_f,
                "actual_value": None,
                "guided_text": str(row.get("guided_text") or quote)[:240],
                "confidence": float(row.get("confidence") or 0.75),
                "speaker": str(row.get("speaker") or "Management"),
                "thread_id": f"{company_id}-{row['metric']}",
                "dropped": False,
                "source_url": None,
                "source_ref": source_ref,
                "quote_span": quote,
                "as_of": None,
                "review_status": "pending",
                "needs_review": True,
                "extract_engine": "llm_v1",
            }
        )
    from app.data.metric_catalog import normalize_statement_metrics

    return normalize_statement_metrics(out)


def rewrite_cite_only_answer(
    question: str,
    snippets: Sequence[str],
    *,
    gci_note: str = "",
) -> str:
    """Optional LLM polish — must stay grounded in snippets (caller still refuses if empty)."""
    joined = " | ".join(snippets[:4])
    raw = chat_completion(
        [
            {
                "role": "system",
                "content": (
                    "You are CiteAlpha Research. Answer ONLY using the provided source snippets. "
                    "Do not invent numbers or filings. End with: Not investment advice."
                ),
            },
            {
                "role": "user",
                "content": f"Question: {question}\nContext:{gci_note}\nSnippets: {joined}",
            },
        ],
        max_tokens=400,
    )
    return raw

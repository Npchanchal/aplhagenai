"""Live AlphaHunter / facts connector — HTTP pull when vendor URL is configured."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional


def connector_status() -> Dict[str, Any]:
    url = (os.environ.get("ALPHAHUNTER_API_URL") or os.environ.get("FACTS_API_URL") or "").strip()
    key_set = bool(
        os.environ.get("ALPHAHUNTER_API_KEY") or os.environ.get("FACTS_API_KEY")
    )
    return {
        "configured": bool(url),
        "api_key_set": key_set,
        "url_host": url.split("/")[2] if url.startswith("http") and len(url.split("/")) > 2 else None,
        "pull_path": "/api/import/alphahunter/live",
        "note": (
            "Live connector ready — GET JSON facts from ALPHAHUNTER_API_URL"
            if url
            else "Set ALPHAHUNTER_API_URL (+ optional ALPHAHUNTER_API_KEY) for live pull; paste import remains available"
        ),
    }


def _fetch_remote(url: str, api_key: Optional[str]) -> Any:
    headers = {"Accept": "application/json", "User-Agent": "CiteAlpha-GCI/1.0"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
        headers["X-API-Key"] = api_key
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:500]
        raise RuntimeError(f"Vendor HTTP {e.code}: {body}") from e
    except Exception as e:
        raise RuntimeError(f"Vendor fetch failed: {e}") from e


def _normalize_payload(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return [dict(x) for x in payload if isinstance(x, dict)]
    if isinstance(payload, dict):
        for key in ("facts", "data", "items", "results", "records"):
            if isinstance(payload.get(key), list):
                return [dict(x) for x in payload[key] if isinstance(x, dict)]
        # Single fact object
        if payload.get("metric") or payload.get("guided_value") is not None:
            return [dict(payload)]
    raise RuntimeError("Vendor payload must be a facts list or {facts:[...]}")


def pull_facts(*, company_id: Optional[str] = None) -> Dict[str, Any]:
    """Pull live facts JSON from configured vendor URL."""
    base = (os.environ.get("ALPHAHUNTER_API_URL") or os.environ.get("FACTS_API_URL") or "").strip()
    if not base:
        raise RuntimeError("ALPHAHUNTER_API_URL not configured")
    api_key = (
        os.environ.get("ALPHAHUNTER_API_KEY")
        or os.environ.get("FACTS_API_KEY")
        or ""
    ).strip() or None

    url = base
    if company_id:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}company_id={company_id}"

    raw = _fetch_remote(url, api_key)
    facts = _normalize_payload(raw)
    return {
        "ok": True,
        "source": "live_connector",
        "url_host": connector_status()["url_host"],
        "fact_count": len(facts),
        "facts": facts,
    }

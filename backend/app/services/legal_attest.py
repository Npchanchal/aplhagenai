"""Legal counsel attestation — closes Terms/Privacy gate in-product."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException

from app.data.seed import get_data, save_data
from app.services.legal import LEGAL_ENTITY, PRIVACY_VERSION, TERMS_VERSION


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _attestation_from_sqlite(kind: str) -> Optional[Dict[str, Any]]:
    try:
        from app.db.auth_db import latest_attestation, use_db_auth

        if use_db_auth():
            row = latest_attestation(kind)
            if row:
                return row
    except Exception:
        pass
    return None


def counsel_status() -> str:
    env = os.environ.get("INTELLENS_LEGAL_COUNSEL_STATUS", "")
    if env == "counsel_approved":
        return "counsel_approved"
    att = _attestation_from_sqlite("terms_privacy")
    if att and att.get("status") == "counsel_approved":
        return "counsel_approved"
    data = get_data()
    att = (data.get("legal_attestations") or {}).get("terms_privacy")
    if att and att.get("status") == "counsel_approved":
        return "counsel_approved"
    return env or "scaffold_pending_counsel_signoff"


def sebi_retail_status() -> str:
    if os.environ.get("INTELLENS_RETAIL_MARKETING", "").lower() in ("1", "true", "yes"):
        return "counsel_approved"
    att = _attestation_from_sqlite("sebi_retail")
    if att and att.get("status") == "counsel_approved":
        return "counsel_approved"
    data = get_data()
    att = (data.get("legal_attestations") or {}).get("sebi_retail")
    if att and att.get("status") == "counsel_approved":
        return "counsel_approved"
    return "pending_sebi_counsel"


def attest(
    *,
    kind: str,
    attested_by: str,
    note: str = "",
    admin_key_ok: bool = False,
) -> Dict[str, Any]:
    if not admin_key_ok:
        raise HTTPException(status_code=403, detail="Admin API key required for legal attestation")
    if kind not in ("terms_privacy", "sebi_retail"):
        raise HTTPException(status_code=400, detail="kind must be terms_privacy|sebi_retail")
    row = {
        "id": str(uuid.uuid4()),
        "kind": kind,
        "status": "counsel_approved",
        "attested_by": attested_by,
        "note": note
        or f"Attested for {LEGAL_ENTITY}; terms={TERMS_VERSION} privacy={PRIVACY_VERSION}",
        "created_at": _now(),
        "terms_version": TERMS_VERSION,
        "privacy_version": PRIVACY_VERSION,
    }
    data = get_data()
    data.setdefault("legal_attestations", {})[kind] = row
    save_data()
    if kind == "sebi_retail":
        os.environ["INTELLENS_RETAIL_MARKETING"] = "true"
    if kind == "terms_privacy":
        os.environ["INTELLENS_LEGAL_COUNSEL_STATUS"] = "counsel_approved"
    try:
        from app.db.auth_db import insert_attestation, use_db_auth

        if use_db_auth():
            insert_attestation(row)
    except Exception:
        pass
    return row


def snapshot() -> Dict[str, Any]:
    data = get_data()
    attestations = dict(data.get("legal_attestations") or {})
    for kind in ("terms_privacy", "sebi_retail"):
        row = _attestation_from_sqlite(kind)
        if row:
            attestations[kind] = row
    return {
        "counsel_status": counsel_status(),
        "sebi_retail_status": sebi_retail_status(),
        "attestations": attestations,
        "terms_version": TERMS_VERSION,
        "privacy_version": PRIVACY_VERSION,
        "legal_entity": LEGAL_ENTITY,
    }

"""MSA billing (B2B) + retail paywall (B2C)."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from app.data.seed import get_data, save_data

# Illustrative INR list prices — commercial pack is source of truth for contracts
RETAIL_PRICE_INR = float(os.environ.get("RETAIL_PRICE_INR", "4999"))
DESK_SEAT_INR = float(os.environ.get("DESK_SEAT_INR", "45000"))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _store() -> Dict[str, Any]:
    data = get_data()
    return data.setdefault("billing", {"invoices": [], "subscriptions": {}})


def retail_marketing_allowed() -> bool:
    return os.environ.get("INTELLENS_RETAIL_MARKETING", "").lower() in ("1", "true", "yes")


def create_msa_invoice(
    *,
    org_id: str,
    plan: str,
    seats: int,
    amount_inr: Optional[float] = None,
    po_number: Optional[str] = None,
) -> Dict[str, Any]:
    plan_n = (plan or "desk").lower()
    seats_n = max(1, int(seats))
    if amount_inr is None:
        amount_inr = DESK_SEAT_INR * seats_n if plan_n in ("desk", "pilot") else DESK_SEAT_INR * seats_n
    inv = {
        "id": f"msa-{uuid.uuid4().hex[:10]}",
        "org_id": org_id,
        "kind": "msa",
        "plan": plan_n,
        "seats": seats_n,
        "amount_inr": float(amount_inr),
        "currency": "INR",
        "status": "issued",
        "po_number": po_number,
        "esign_status": "pending",
        "created_at": _now(),
        "pay_url": f"/billing/pay?invoice=msa-{uuid.uuid4().hex[:8]}",
    }
    store = _store()
    store["invoices"].append(inv)
    save_data()
    try:
        from app.db.auth_db import insert_billing, use_db_auth

        if use_db_auth():
            insert_billing(
                {
                    "id": inv["id"],
                    "org_id": org_id,
                    "kind": "msa",
                    "status": "issued",
                    "amount_inr": inv["amount_inr"],
                    "payload": inv,
                    "created_at": inv["created_at"],
                }
            )
    except Exception:
        pass
    return inv


def sign_msa(invoice_id: str, *, signer_email: str) -> Dict[str, Any]:
    store = _store()
    for inv in store["invoices"]:
        if inv["id"] == invoice_id and inv.get("kind") == "msa":
            inv["esign_status"] = "signed"
            inv["signed_by"] = signer_email
            inv["signed_at"] = _now()
            inv["status"] = "active"
            store["subscriptions"][inv["org_id"]] = {
                "plan": inv["plan"],
                "seats": inv["seats"],
                "invoice_id": inv["id"],
                "status": "active",
            }
            save_data()
            return inv
    raise HTTPException(status_code=404, detail="MSA invoice not found")


def create_retail_checkout(*, org_id: str, user_email: str) -> Dict[str, Any]:
    if not retail_marketing_allowed():
        raise HTTPException(
            status_code=403,
            detail=(
                "Retail paywall disabled until SEBI counsel approval "
                "(set INTELLENS_RETAIL_MARKETING=true)"
            ),
        )
    order = {
        "id": f"ret-{uuid.uuid4().hex[:10]}",
        "org_id": org_id,
        "kind": "retail_paywall",
        "amount_inr": RETAIL_PRICE_INR,
        "currency": "INR",
        "status": "pending_payment",
        "user_email": user_email,
        "upi_intent": f"upi://pay?pa=citealpha@ocotillo&pn=CiteAlpha&am={RETAIL_PRICE_INR:.2f}&cu=INR",
        "created_at": _now(),
    }
    store = _store()
    store["invoices"].append(order)
    save_data()
    return order


def confirm_retail_payment(order_id: str, *, payment_ref: str = "") -> Dict[str, Any]:
    """Confirm retail paywall. Demo refs (`upi-demo`) only when BILLING_DEMO=1."""
    ref = (payment_ref or "").strip()
    demo = os.environ.get("BILLING_DEMO", "").lower() in ("1", "true", "yes")
    if not ref:
        raise HTTPException(status_code=400, detail="payment_ref required")
    if ref.lower() in ("upi-demo", "demo", "test") and not demo:
        raise HTTPException(
            status_code=400,
            detail="Demo payment_ref rejected — set BILLING_DEMO=1 for stubs, or use a real UPI/PSP reference",
        )
    if len(ref) < 6 and not demo:
        raise HTTPException(status_code=400, detail="payment_ref too short")
    store = _store()
    for inv in store["invoices"]:
        if inv["id"] == order_id and inv.get("kind") == "retail_paywall":
            inv["status"] = "paid"
            inv["payment_ref"] = ref
            inv["paid_at"] = _now()
            inv["billing_demo"] = demo and ref.lower() in ("upi-demo", "demo", "test")
            store["subscriptions"][inv["org_id"]] = {
                "plan": "retail",
                "status": "active",
                "order_id": inv["id"],
            }
            save_data()
            return inv
    raise HTTPException(status_code=404, detail="Retail order not found")


def create_msa_from_pilot(
    *,
    org_id: str,
    seats: int = 5,
    signer_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """Pilot → paid path: issue Desk MSA after pilot checklist is ready."""
    inv = create_msa_invoice(org_id=org_id, plan="desk", seats=seats)
    inv["conversion_path"] = "pilot_to_desk"
    inv["signer_hint"] = signer_hint
    inv["next_steps"] = [
        "Complete pilot checklist on Desk → CSM",
        "Sign MSA (e-sign or wet-ink via counsel)",
        "Provision Desk seats; optional One-Stop upgrade",
        "Wire live PSP (Razorpay) when merchant account is ready — not in-app yet",
    ]
    save_data()
    return inv


def list_invoices(org_id: Optional[str] = None) -> List[Dict[str, Any]]:
    rows = list(_store().get("invoices") or [])
    if org_id:
        rows = [r for r in rows if r.get("org_id") == org_id]
    return rows


def subscription_for(org_id: str) -> Optional[Dict[str, Any]]:
    return (_store().get("subscriptions") or {}).get(org_id)

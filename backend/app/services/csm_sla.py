"""CSM desk, SLA status, and VPC deploy posture (productized MSA surfaces)."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException

from app.data.seed import get_data, save_data
from app.services import orgs as org_svc
from app.services import labeling_queue as lq


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sla_targets() -> Dict[str, Any]:
    plan_defaults = {
        "pilot": {"uptime_pct": 99.0, "sev1_hours": 48, "channel": "email"},
        "desk": {"uptime_pct": 99.0, "sev1_hours": 24, "channel": "email+slack"},
        "enterprise": {"uptime_pct": 99.5, "sev1_hours": 4, "channel": "named_csm"},
        "onestop": {"uptime_pct": 99.5, "sev1_hours": 4, "channel": "named_csm"},
    }
    return plan_defaults


def sla_status(org_id: str = "demo") -> Dict[str, Any]:
    snap = org_svc.org_snapshot(org_id)
    plan = snap.get("plan") or "pilot"
    targets = sla_targets().get(plan, sla_targets()["pilot"])
    # Observed uptime from in-process health pings (best-effort demo meter)
    meter = get_data().setdefault(
        "sla_meter",
        {"checks": 0, "ok": 0, "last_ok_at": None, "last_fail_at": None},
    )
    checks = int(meter.get("checks") or 0)
    ok = int(meter.get("ok") or 0)
    observed = round(100.0 * ok / checks, 3) if checks else None
    return {
        "org_id": org_id,
        "plan": plan,
        "targets": targets,
        "observed": {
            "uptime_pct": observed,
            "checks": checks,
            "ok": ok,
            "last_ok_at": meter.get("last_ok_at"),
            "last_fail_at": meter.get("last_fail_at"),
            "note": "In-process meter since process start — contract SLA is MSA-defined",
        },
        "within_target": (
            None if observed is None else observed >= float(targets["uptime_pct"])
        ),
        "reference": "docs/customer/COVERAGE_AND_SLA.md",
    }


def record_health(ok: bool = True) -> None:
    data = get_data()
    meter = data.setdefault(
        "sla_meter",
        {"checks": 0, "ok": 0, "last_ok_at": None, "last_fail_at": None},
    )
    meter["checks"] = int(meter.get("checks") or 0) + 1
    if ok:
        meter["ok"] = int(meter.get("ok") or 0) + 1
        meter["last_ok_at"] = _now()
    else:
        meter["last_fail_at"] = _now()
    # Avoid writing store on every health probe in hot path — soft save
    try:
        save_data()
    except Exception:
        pass


def csm_dashboard(org_id: str = "demo") -> Dict[str, Any]:
    snap = org_svc.org_snapshot(org_id)
    queue = lq.list_queue(org_id=org_id)
    open_q = [r for r in queue if r.get("status") in ("queued", "in_progress")]
    tickets = [t for t in (get_data().get("csm_tickets") or []) if t.get("org_id") == org_id]
    open_t = [t for t in tickets if t.get("status") != "closed"]
    return {
        "org": snap,
        "csm": {
            "named": snap.get("csm") or "Assigned at convert",
            "email": os.environ.get("CSM_EMAIL", "csm@intellens.example"),
            "qbr_cadence": "quarterly",
            "next_qbr_hint": "Schedule via named CSM after Pilot→paid convert",
        },
        "sla": sla_status(org_id),
        "labeling_open": len(open_q),
        "tickets_open": len(open_t),
        "tickets": tickets[-20:],
        "vpc": vpc_posture(),
        "note": "CSM / SLA / VPC surfaces for Enterprise & One-Stop — commercial terms in MSA",
    }


def create_ticket(
    *,
    org_id: str,
    subject: str,
    severity: str = "3",
    body: str = "",
    requested_by: str = "api",
) -> Dict[str, Any]:
    if not subject.strip():
        raise HTTPException(status_code=400, detail="subject required")
    sev = severity if severity in ("1", "2", "3") else "3"
    ticket = {
        "id": f"csm_{uuid4().hex[:10]}",
        "org_id": org_id,
        "subject": subject.strip(),
        "severity": sev,
        "body": body or "",
        "status": "open",
        "requested_by": requested_by,
        "created_at": _now(),
    }
    data = get_data()
    data.setdefault("csm_tickets", []).append(ticket)
    save_data()
    return ticket


def vpc_posture() -> Dict[str, Any]:
    """Honest VPC / private-deploy readiness (docs + terraform example)."""
    return {
        "status": "msa_scoped",
        "public_alb_default": True,
        "private_subnet_example": "deploy/aws/vpc-private.example.tf",
        "requirements": [
            "Customer VPC ID + private subnets",
            "NAT for ECR pulls or VPC endpoints",
            "Internal ALB or PrivateLink",
            "SSO OIDC redirect URIs on private hostname",
        ],
        "env_flags": {
            "VPC_DEPLOY": os.environ.get("VPC_DEPLOY", "false"),
            "PRIVATE_ONLY": os.environ.get("PRIVATE_ONLY", "false"),
        },
        "note": "VPC/private deploy is delivered under Enterprise/One-Stop MSA — template ships in-repo",
    }

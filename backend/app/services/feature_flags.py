"""Feature flags for phased rollout (env overrides)."""

from __future__ import annotations

import os


def _flag(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name, str(default)).strip().lower()
    return raw in ("1", "true", "yes", "on")


def research_llm_enabled() -> bool:
    return _flag("RESEARCH_LLM", False)


def consensus_import_enabled() -> bool:
    return _flag("CONSENSUS_IMPORT", True)


def sso_enabled() -> bool:
    return _flag("SSO", False)


def freeze_demo_pad() -> bool:
    """When True, do not pad hand_labeled companies with demo filler."""
    return _flag("FREEZE_DEMO_PAD", True)


def analytics_granger_v1_enabled() -> bool:
    """Tier 3 Granger/LASSO panel — on when PIT warehouse supplies ≥12 points."""
    return _flag("ANALYTICS_GRANGER_V1", True)


def analytics_experimental_ui() -> bool:
    """Proxy corr/impact panel — off by default for external demos."""
    return _flag("ANALYTICS_EXPERIMENTAL_UI", False)


def allow_demo_street() -> bool:
    """When False, Research estimates omit fabricated street consensus."""
    return _flag("ALLOW_DEMO_STREET", False)


def flags_dict() -> dict:
    return {
        "RESEARCH_LLM": research_llm_enabled(),
        "CONSENSUS_IMPORT": consensus_import_enabled(),
        "SSO": sso_enabled(),
        "FREEZE_DEMO_PAD": freeze_demo_pad(),
        "ANALYTICS_GRANGER_V1": analytics_granger_v1_enabled(),
        "ANALYTICS_EXPERIMENTAL_UI": analytics_experimental_ui(),
        "ALLOW_DEMO_STREET": allow_demo_street(),
    }

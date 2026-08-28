"""Legal copy, terms versions, and copyright for CiteAlpha (Ocotillo)."""

from __future__ import annotations

from typing import Any, Dict

LEGAL_ENTITY = "Ocotillo Innovation Private Limited"
PRODUCT_NAME = "CiteAlpha"
COPYRIGHT_YEAR = "2026"
TERMS_VERSION = "2026-08-26"
PRIVACY_VERSION = "2026-08-26"
CONTACT_EMAIL = "sales@citealpha.com"
PUBLIC_DOMAIN = "citealpha.com"

COPYRIGHT_LINE = (
    f"© {COPYRIGHT_YEAR} {LEGAL_ENTITY}. All rights reserved. "
    f"{PRODUCT_NAME} is a product of {LEGAL_ENTITY}."
)


def copyright_meta() -> Dict[str, Any]:
    from app.services import legal_attest

    snap = legal_attest.snapshot()
    retail_mkt = snap["sebi_retail_status"] == "counsel_approved"
    return {
        "legal_entity": LEGAL_ENTITY,
        "product": PRODUCT_NAME,
        "year": COPYRIGHT_YEAR,
        "line": COPYRIGHT_LINE,
        "terms_version": TERMS_VERSION,
        "privacy_version": PRIVACY_VERSION,
        "contact_email": CONTACT_EMAIL,
        "domain": PUBLIC_DOMAIN,
        "counsel_status": snap["counsel_status"],
        "counsel_note": (
            "Terms/Privacy counsel-approved in-product via attestation API, or "
            "INTELLENS_LEGAL_COUNSEL_STATUS=counsel_approved."
            if snap["counsel_status"] == "counsel_approved"
            else (
                "Pending counsel attestation — POST /api/legal/attest with admin key "
                "(kind=terms_privacy)."
            )
        ),
        "retail_marketing_allowed": retail_mkt,
        "sebi_retail_status": snap["sebi_retail_status"],
        "retail_marketing_note": (
            "Retail marketing / paywall enabled after SEBI counsel attestation."
            if retail_mkt
            else "Attest kind=sebi_retail (admin) or set INTELLENS_RETAIL_MARKETING=true."
        ),
        "attestations": snap["attestations"],
    }


def terms_document() -> Dict[str, Any]:
    meta = copyright_meta()
    return {
        "version": TERMS_VERSION,
        "title": f"{PRODUCT_NAME} Terms of Use",
        "legal_entity": LEGAL_ENTITY,
        "effective_date": TERMS_VERSION,
        "counsel_status": meta["counsel_status"],
        "contact_email": CONTACT_EMAIL,
        "sections": [
            {
                "id": "parties",
                "heading": "1. Parties",
                "body": (
                    f"{PRODUCT_NAME} is operated by {LEGAL_ENTITY} (“Ocotillo”, “we”, “us”) "
                    f"at {PUBLIC_DOMAIN}. Contact: {CONTACT_EMAIL}. "
                    "By creating an account, continuing as a guest, or using the service, "
                    "you agree to these Terms."
                ),
            },
            {
                "id": "product",
                "heading": "2. Product nature — not investment advice",
                "body": (
                    f"{PRODUCT_NAME} provides factual research tooling around management "
                    "guidance versus subsequent actuals (Guidance Credibility Index / GCI) "
                    "and related surfaces (Tracker, Desk, Research, Sights, and commercial "
                    "SKU bundles such as Score, Cite, Radar, Ledger, and Data). "
                    "It does not provide Buy, Hold, or Sell recommendations, personalized "
                    "investment advice, or a SEBI-registered Research Analyst opinion unless "
                    "expressly stated in a separate engagement with a registered intermediary."
                ),
            },
            {
                "id": "accounts",
                "heading": "3. Accounts — B2B, guest, and retail (B2C)",
                "body": (
                    "Business (B2B) accounts are multi-tenant organizations with seat and "
                    "plan entitlements. Guest sessions are ephemeral; preferences may be lost "
                    "unless you register. Retail (B2C) accounts, if offered, are individual "
                    "tenants for personal research use and remain gated until SEBI counsel "
                    "attestation enables retail marketing. You are responsible for credentials "
                    "and for activity under your tenant."
                ),
            },
            {
                "id": "multitenant",
                "heading": "4. Multi-tenant isolation",
                "body": (
                    "Customer reviews, labeling queue items, API keys, and org-scoped "
                    "configuration belong to your tenant (org_id). You must not attempt "
                    "to access another tenant’s data. Demo / shared pilot orgs are for "
                    "evaluation only and may be reset."
                ),
            },
            {
                "id": "data",
                "heading": "5. Data quality and evidence",
                "body": (
                    "Scores and narratives must be read with their data_quality badge "
                    "(hand_labeled, demo_structured, market_scaffold). Do not present "
                    "demo or scaffold data as production-labeled coverage. Cite evidence "
                    "rows when publishing scores externally."
                ),
            },
            {
                "id": "license",
                "heading": "6. License and redistribution",
                "body": (
                    "We grant a limited, non-exclusive, non-transferable right to use "
                    f"{PRODUCT_NAME} per your plan. Redistribution of API outputs, "
                    "bulk exports, or embeds outside licensed seats/systems requires "
                    "Enterprise / One-Stop rights as documented in the commercial package."
                ),
            },
            {
                "id": "acceptable",
                "heading": "7. Acceptable use",
                "body": (
                    "No scraping beyond documented APIs, no attempts to bypass auth or "
                    "tenant isolation, no uploading unlawful content, and no use of the "
                    "service to market securities tips as if they were regulatory advice."
                ),
            },
            {
                "id": "ai",
                "heading": "8. Optional AI processing",
                "body": (
                    "Guidance extraction may use a contracted large-language-model processor "
                    "when that capability is enabled for the deployment. Otherwise the "
                    "service falls back to heuristic / TF-IDF methods. We do not train "
                    "public models on customer review comments without written consent. "
                    "Model output is not a substitute for primary filings or labeled evidence."
                ),
            },
            {
                "id": "ip",
                "heading": "9. Intellectual property",
                "body": (
                    f"{PRODUCT_NAME}, related marks, software, and documentation are owned "
                    f"by {LEGAL_ENTITY} or its licensors. These Terms do not transfer "
                    "ownership. Customer content (e.g. review comments) remains yours; "
                    "you grant us a license to host and process it to provide the service."
                ),
            },
            {
                "id": "disclaimer",
                "heading": "10. Disclaimers and liability",
                "body": (
                    "The service is provided “as is”. We do not warrant uninterrupted "
                    "availability or that scores predict future performance. To the "
                    "maximum extent permitted by law, {entity}’s aggregate liability "
                    "arising from the service is limited to fees paid by you for the "
                    "service in the three months preceding the claim (or ₹0 for free "
                    "guest/pilot use)."
                ).format(entity=LEGAL_ENTITY),
            },
            {
                "id": "law",
                "heading": "11. Governing law",
                "body": (
                    "These Terms are governed by the laws of India. Courts in India "
                    "have exclusive jurisdiction, subject to mandatory consumer "
                    "protections that cannot be waived."
                ),
            },
            {
                "id": "contact",
                "heading": "12. Contact",
                "body": (
                    f"Legal and commercial notices: {CONTACT_EMAIL} — {LEGAL_ENTITY}, "
                    f"product {PRODUCT_NAME} ({PUBLIC_DOMAIN}). "
                    "A dedicated legal mailbox and registered office will be published "
                    "when available. CSM contacts appear in your order form when applicable."
                ),
            },
        ],
        "copyright": COPYRIGHT_LINE,
    }


def privacy_document() -> Dict[str, Any]:
    meta = copyright_meta()
    return {
        "version": PRIVACY_VERSION,
        "title": f"{PRODUCT_NAME} Privacy Notice",
        "legal_entity": LEGAL_ENTITY,
        "effective_date": PRIVACY_VERSION,
        "counsel_status": meta["counsel_status"],
        "contact_email": CONTACT_EMAIL,
        "sections": [
            {
                "id": "controller",
                "heading": "1. Controller",
                "body": (
                    f"{LEGAL_ENTITY} controls personal data processed for {PRODUCT_NAME} "
                    f"accounts, guest sessions, and support at {PUBLIC_DOMAIN}. "
                    "We process personal data in India, consistent with the Digital "
                    "Personal Data Protection Act, 2023 (DPDP) as applicable."
                ),
            },
            {
                "id": "collect",
                "heading": "2. What we collect",
                "body": (
                    "Account data (name, email, hashed password), preferences "
                    "(language, market, watchlist), tenant/org membership, API usage "
                    "metadata, and content you submit (reviews, pasted sources). "
                    "Guests may have an ephemeral session id without email."
                ),
            },
            {
                "id": "use",
                "heading": "3. How we use data",
                "body": (
                    "To authenticate you, enforce seats and plans, provide GCI research "
                    "features, improve reliability, meet legal obligations, and "
                    "communicate service notices. We do not sell personal data."
                ),
            },
            {
                "id": "sharing",
                "heading": "4. Sharing and processors",
                "body": (
                    "Processors under contract may include cloud hosting (AWS), "
                    "transactional email when SMTP is configured, an enterprise OIDC "
                    "identity provider when SSO is enabled, and an optional LLM extract "
                    "processor when that feature is keyed. B2B admins in your org may see "
                    "member activity within the tenant. We disclose when required by law."
                ),
            },
            {
                "id": "analytics",
                "heading": "5. Cookies and analytics",
                "body": (
                    "The product may use Plausible, a privacy-friendly analytics service, "
                    "when enabled for a deployment. Plausible is designed not to use "
                    "advertising cookies or cross-site tracking. Session cookies or "
                    "local storage may keep you signed in and remember language, market, "
                    "and tour progress."
                ),
            },
            {
                "id": "ai",
                "heading": "6. Optional AI processing",
                "body": (
                    "If LLM extract is enabled, text you submit for extraction (for example "
                    "pasted transcripts) may be sent to a contracted model provider to "
                    "propose guidance statements. Heuristic fallback is used when the "
                    "model is not configured. We do not train public models on your "
                    "review comments without written consent."
                ),
            },
            {
                "id": "retention",
                "heading": "7. Retention",
                "body": (
                    "Account data for the life of the account plus a reasonable wind-down. "
                    "Guest sessions may be purged periodically. Demo reset may wipe "
                    "shared pilot corpora — not your production tenant."
                ),
            },
            {
                "id": "rights",
                "heading": "8. Your rights",
                "body": (
                    "Subject to Indian law including DPDP as applicable, you may request "
                    "access, correction, or deletion of personal data by contacting "
                    f"{CONTACT_EMAIL}. Some records (billing, security logs) may be "
                    "retained as required."
                ),
            },
            {
                "id": "security",
                "heading": "9. Security",
                "body": (
                    "Passwords are stored hashed (PBKDF2). Use strong passwords and "
                    "protect API keys. Production deployments should enable HTTPS, "
                    "OIDC SSO for B2B, and least-privilege keys. Runtime posture is "
                    "published on the Trust Center."
                ),
            },
            {
                "id": "contact",
                "heading": "10. Contact",
                "body": (
                    f"Privacy inquiries: {CONTACT_EMAIL} — {LEGAL_ENTITY}, "
                    f"product {PRODUCT_NAME}."
                ),
            },
        ],
        "copyright": COPYRIGHT_LINE,
    }

#!/usr/bin/env python3
"""Register a platform admin user via public API (post-deploy bootstrap)."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

PLATFORM_ROLES = ("super", "ops", "compliance", "billing", "support")


def _req(
    api: str,
    method: str,
    path: str,
    body: dict | None = None,
    headers: dict | None = None,
) -> dict:
    h = dict(headers or {})
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(api + path, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def _abuse_answer(prompt: str) -> str:
    m = re.search(r"What is (\d+) \+ (\d+)\?", prompt)
    if not m:
        raise ValueError(f"Unexpected abuse prompt: {prompt}")
    return str(int(m.group(1)) + int(m.group(2)))


def bootstrap_user(
    *,
    api: str,
    email: str,
    password: str,
    name: str,
    platform_role: str,
    admin_key: str,
    org_name: str,
) -> int:
    if platform_role not in PLATFORM_ROLES:
        print(f"invalid platform role: {platform_role}", file=sys.stderr)
        return 1

    admin_hdr = {"X-API-Key": admin_key, "Content-Type": "application/json"}

    ch = _req(api, "GET", "/api/auth/abuse-challenge")
    reg_body = {
        "email": email.strip().lower(),
        "password": password,
        "name": name,
        "accept_terms": True,
        "account_type": "b2b",
        "org_name": org_name,
        "challenge_id": ch["challenge_id"],
        "challenge_answer": _abuse_answer(ch["prompt"]),
    }

    user_id = None
    try:
        reg = _req(api, "POST", "/api/auth/register", reg_body)
        user_id = reg["user"]["id"]
        print(f"registered {email} ({user_id})")
    except urllib.error.HTTPError as exc:
        if exc.code != 409:
            print(exc.read().decode(), file=sys.stderr)
            return 1
        users = _req(api, "GET", "/api/admin/portal/users", headers=admin_hdr)
        match = next(
            (u for u in users.get("users", []) if (u.get("email") or "").lower() == reg_body["email"]),
            None,
        )
        if not match:
            print("email exists but not visible to admin list", file=sys.stderr)
            return 1
        user_id = match["id"]
        print(f"already registered {email} ({user_id})")

    role = _req(
        api,
        "PATCH",
        f"/api/admin/portal/users/{user_id}/platform-role",
        {"platform_admin_role": platform_role},
        headers=admin_hdr,
    )
    print(f"platform_admin_role={role.get('platform_admin_role')}")

    login = _req(api, "POST", "/api/auth/login", {"email": reg_body["email"], "password": password})
    token = login["token"]
    portal = _req(api, "GET", "/api/admin/portal/me", headers={"Authorization": f"Bearer {token}"})
    print(f"login ok — portal role {portal.get('platform_admin_role')}")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Bootstrap CiteAlpha platform admin user")
    p.add_argument("--api", default=os.environ.get("INTELLENS_PUBLIC_URL", "https://citealpha.com"))
    p.add_argument("--email", default=os.environ.get("BOOTSTRAP_SUPER_EMAIL", ""))
    p.add_argument("--password", default=os.environ.get("BOOTSTRAP_SUPER_PASSWORD", ""))
    p.add_argument("--name", default=os.environ.get("BOOTSTRAP_SUPER_NAME", "DK"))
    p.add_argument("--role", default=os.environ.get("BOOTSTRAP_PLATFORM_ROLE", "super"), choices=PLATFORM_ROLES)
    p.add_argument("--admin-key", default=os.environ.get("INTELLENS_API_KEY", "intellens-admin"))
    p.add_argument("--org-name", default=os.environ.get("BOOTSTRAP_SUPER_ORG", "CiteAlpha Ops"))
    p.add_argument(
        "--all-roles",
        action="store_true",
        help="Create test users for every platform role ({role}@citealpha.com)",
    )
    p.add_argument("--domain", default=os.environ.get("BOOTSTRAP_EMAIL_DOMAIN", "citealpha.com"))
    args = p.parse_args()

    api = args.api.rstrip("/")

    if args.all_roles:
        if not args.password:
            print("password required for --all-roles", file=sys.stderr)
            return 1
        rc = 0
        for role in PLATFORM_ROLES:
            email = f"{role}@{args.domain}"
            name = f"Test {role.title()}"
            org = f"CiteAlpha {role.title()} Test"
            print(f"\n== {role} ==")
            if bootstrap_user(
                api=api,
                email=email,
                password=args.password,
                name=name,
                platform_role=role,
                admin_key=args.admin_key,
                org_name=org,
            ):
                rc = 1
        return rc

    if not args.email or not args.password:
        print("email and password required (--email / BOOTSTRAP_SUPER_EMAIL)", file=sys.stderr)
        return 1

    return bootstrap_user(
        api=api,
        email=args.email,
        password=args.password,
        name=args.name,
        platform_role=args.role,
        admin_key=args.admin_key,
        org_name=args.org_name,
    )


if __name__ == "__main__":
    raise SystemExit(main())

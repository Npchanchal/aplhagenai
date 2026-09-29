from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import PlainTextResponse
from starlette.routing import Route
from starlette.testclient import TestClient

from app.services.rate_limit import RateLimitMiddleware, client_ip


def _app(rpm: int = 2) -> Starlette:
    async def ok(_request):
        return PlainTextResponse("ok")

    app = Starlette(routes=[Route("/api/x", ok)])
    app.add_middleware(RateLimitMiddleware, rpm=rpm, auth_rpm=rpm)
    return app


def _request(peer: str, headers: dict[str, str]) -> Request:
    return Request(
        {
            "type": "http",
            "client": (peer, 1234),
            "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
        }
    )


def test_client_ip_uses_real_ip_from_local_proxy():
    assert client_ip(_request("127.0.0.1", {"X-Real-IP": "203.0.113.7"})) == "203.0.113.7"
    assert client_ip(_request("10.0.4.12", {"X-Real-IP": "203.0.113.7"})) == "203.0.113.7"


def test_client_ip_ignores_spoofed_header_from_public_peer():
    assert client_ip(_request("8.8.8.8", {"X-Real-IP": "203.0.113.7"})) == "8.8.8.8"


def test_client_ip_falls_back_to_peer_without_header():
    assert client_ip(_request("127.0.0.1", {})) == "127.0.0.1"


def test_untrusted_peer_shares_one_bucket_and_reports_retry_after():
    client = TestClient(_app(rpm=2))
    a = {"X-Real-IP": "203.0.113.1"}
    b = {"X-Real-IP": "203.0.113.2"}
    # TestClient's peer host ("testclient") is not an internal IP, so X-Real-IP is ignored.
    assert client.get("/api/x", headers=a).status_code == 200
    assert client.get("/api/x", headers=b).status_code == 200
    blocked = client.get("/api/x", headers=a)
    assert blocked.status_code == 429
    body = blocked.json()
    assert body["detail"] == "Rate limit exceeded"
    assert 1 <= body["retry_after_sec"] <= 61
    assert blocked.headers["Retry-After"] == str(body["retry_after_sec"])


def test_public_demo_key_is_bucketed_per_visitor(monkeypatch):
    import app.services.rate_limit as rl

    monkeypatch.setattr(rl, "_is_internal", lambda host: True)
    client = TestClient(_app(rpm=1))
    demo = {"X-API-Key": "intellens-demo"}
    assert client.get("/api/x", headers={**demo, "X-Real-IP": "203.0.113.1"}).status_code == 200
    assert client.get("/api/x", headers={**demo, "X-Real-IP": "203.0.113.2"}).status_code == 200
    assert client.get("/api/x", headers={**demo, "X-Real-IP": "203.0.113.1"}).status_code == 429


def test_private_api_key_shares_one_bucket_across_ips(monkeypatch):
    import app.services.rate_limit as rl

    monkeypatch.setattr(rl, "_is_internal", lambda host: True)
    client = TestClient(_app(rpm=1))
    key = {"X-API-Key": "customer-secret"}
    assert client.get("/api/x", headers={**key, "X-Real-IP": "203.0.113.1"}).status_code == 200
    assert client.get("/api/x", headers={**key, "X-Real-IP": "203.0.113.2"}).status_code == 429


def test_session_reads_use_api_bucket_and_credential_writes_use_auth_bucket():
    mw = RateLimitMiddleware(Starlette(), rpm=300, auth_rpm=20)
    assert mw._limit_for("/api/auth/me", "GET") == (300, "api")
    assert mw._limit_for("/api/auth/preferences", "PUT") == (300, "api")
    assert mw._limit_for("/api/auth/abuse-challenge", "GET") == (300, "api")
    assert mw._limit_for("/api/auth/logout", "POST") == (300, "api")
    assert mw._limit_for("/api/auth/login", "POST") == (20, "auth")
    assert mw._limit_for("/api/auth/register", "POST") == (20, "auth")
    assert mw._limit_for("/api/auth/password-reset/request", "POST") == (20, "auth")
    assert mw._limit_for("/api/pilot-request", "POST") == (20, "auth")


def test_limit_is_per_visitor_when_proxied(monkeypatch):
    import app.services.rate_limit as rl

    monkeypatch.setattr(rl, "_is_internal", lambda host: True)
    client = TestClient(_app(rpm=2))
    a = {"X-Real-IP": "203.0.113.1"}
    b = {"X-Real-IP": "203.0.113.2"}
    assert client.get("/api/x", headers=a).status_code == 200
    assert client.get("/api/x", headers=a).status_code == 200
    assert client.get("/api/x", headers=a).status_code == 429
    assert client.get("/api/x", headers=b).status_code == 200

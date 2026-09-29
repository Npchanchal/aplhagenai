"""W9.6 — Python SDK can read /api/v1 against the in-process app."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request

from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parents[2]
SDK_INIT = ROOT / "sdk" / "python" / "citealpha" / "__init__.py"


def test_sdk_module_exists_and_gci_read():
    assert SDK_INIT.is_file()
    ns: dict = {}
    exec(SDK_INIT.read_text(encoding="utf-8"), ns)
    CiteAlpha = ns["CiteAlpha"]

    client = TestClient(app)

    class _Client(CiteAlpha):
        def _get(self, path: str):
            headers = {"Accept": "application/json"}
            if self.api_key:
                headers["X-API-Key"] = self.api_key
            url = urljoin(self.base_url + "/", path.lstrip("/"))
            req = Request(url, headers=headers)
            assert req
            r = client.get(path)
            assert r.status_code == 200, r.text
            return r.json()

    sdk = _Client(base_url="http://test")
    row = sdk.gci("infy")
    assert row["ticker"]
    assert "gci_score" in row
    assert json.dumps(sdk.changelog())  # serialisable
    assert sdk.files()["count"] >= 1
    assert "body" in sdk.digest()

"""CiteAlpha public API client — /api/v1 reads."""

from __future__ import annotations

from typing import Any, Optional
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import json

__version__ = "0.1.0"


class CiteAlpha:
    def __init__(self, base_url: str = "https://citealpha.com", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def _get(self, path: str) -> Any:
        url = urljoin(self.base_url + "/", path.lstrip("/"))
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        req = Request(url, headers=headers)
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def companies(self) -> Any:
        return self._get("/api/v1/companies")

    def gci(self, company_id: str) -> Any:
        return self._get(f"/api/v1/companies/{company_id}/gci")

    def history(self, company_id: str) -> Any:
        return self._get(f"/api/v1/companies/{company_id}/gci/history")

    def rankings(self) -> Any:
        return self._get("/api/v1/rankings")

    def changelog(self, company_id: Optional[str] = None) -> Any:
        q = f"?company_id={company_id}" if company_id else ""
        return self._get(f"/api/v1/index/changelog{q}")

    def files(self) -> Any:
        return self._get("/api/v1/index/files")

    def digest(self) -> Any:
        return self._get("/api/v1/index/digest")

"""Publish frozen GCI level files from the score ledger (plan W9.2)."""

from __future__ import annotations

import csv
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from app.services import score_ledger
from app.services.parquet_plain import write_gci_levels

INDEX_DIR = Path(__file__).resolve().parents[1] / "data" / "index_files"


def index_dir() -> Path:
    """Local archive. When INTELLENS_DATA_DIR is set (EFS), copy packaged files once."""
    override = os.environ.get("INTELLENS_DATA_DIR", "").strip()
    if not override:
        INDEX_DIR.mkdir(parents=True, exist_ok=True)
        return INDEX_DIR
    dest = Path(override) / "index_files"
    dest.mkdir(parents=True, exist_ok=True)
    if not any(dest.glob("gci_levels_*.csv")) and INDEX_DIR.is_dir():
        for src in INDEX_DIR.glob("gci_levels_*"):
            target = dest / src.name
            if not target.exists():
                target.write_bytes(src.read_bytes())
    return dest


def _latest_per_company(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    latest: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        cid = row.get("company_id")
        if not cid:
            continue
        prev = latest.get(cid)
        if prev is None or str(row.get("as_of") or "") >= str(prev.get("as_of") or ""):
            latest[cid] = row
    return [latest[k] for k in sorted(latest)]


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def upload_to_s3(paths: List[Path]) -> Dict[str, Any]:
    """Upload when INTELLENS_INDEX_S3_BUCKET is set. Local files remain the source."""
    bucket = os.environ.get("INTELLENS_INDEX_S3_BUCKET", "").strip()
    if not bucket:
        return {"status": "local_only"}
    try:
        import boto3
    except ImportError:
        return {"status": "skipped", "reason": "boto3_missing", "bucket": bucket}
    prefix = os.environ.get("INTELLENS_INDEX_S3_PREFIX", "index").strip("/")
    client = boto3.client("s3")
    keys = []
    for path in paths:
        key = f"{prefix}/{path.name}" if prefix else path.name
        client.upload_file(str(path), bucket, key)
        keys.append(key)
    return {"status": "uploaded", "bucket": bucket, "keys": keys}


def publish(as_of: str | None = None) -> Dict[str, Any]:
    folder = index_dir()
    day = (as_of or datetime.now(timezone.utc).strftime("%Y%m%d"))[:8]
    if "-" in day:
        day = day.replace("-", "")[:8]
    rows = _latest_per_company(score_ledger.read_all())
    fields = [
        "company_id",
        "gci",
        "confidence_tier",
        "as_of",
        "algorithm_id",
        "dataset_version",
    ]
    csv_path = folder / f"gci_levels_{day}.csv"
    parquet_path = folder / f"gci_levels_{day}.parquet"
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k) if row.get(k) is not None else "" for k in fields})
    write_gci_levels(str(parquet_path), rows)
    csv_sha = _sha256(csv_path)
    parquet_sha = _sha256(parquet_path)
    sha_path = folder / f"gci_levels_{day}.sha256"
    sha_path.write_text(
        f"{csv_sha}  {csv_path.name}\n{parquet_sha}  {parquet_path.name}\n",
        encoding="utf-8",
    )
    s3 = upload_to_s3([csv_path, parquet_path, sha_path])
    meta = {
        "file": csv_path.name,
        "parquet": parquet_path.name,
        "sha256": csv_sha,
        "parquet_sha256": parquet_sha,
        "rows": len(rows),
        "published_at": datetime.now(timezone.utc).isoformat(),
        "s3": s3,
    }
    (folder / f"gci_levels_{day}.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


def list_files() -> List[Dict[str, Any]]:
    folder = index_dir()
    out = []
    for p in sorted(folder.glob("gci_levels_*.csv")):
        sha = p.with_suffix(".sha256")
        parquet = p.with_suffix(".parquet")
        sha_text = sha.read_text(encoding="utf-8") if sha.exists() else ""
        csv_sha = sha_text.split()[0] if sha_text else None
        parquet_sha = None
        for line in sha_text.splitlines():
            parts = line.split()
            if len(parts) >= 2 and parts[1].endswith(".parquet"):
                parquet_sha = parts[0]
        out.append(
            {
                "name": p.name,
                "parquet": parquet.name if parquet.exists() else None,
                "path": f"/api/v1/index/files/{p.name}",
                "parquet_path": f"/api/v1/index/files/{parquet.name}" if parquet.exists() else None,
                "sha256": csv_sha,
                "parquet_sha256": parquet_sha,
                "bytes": p.stat().st_size,
            }
        )
    return out


def resolve_file(name: str) -> Path:
    folder = index_dir()
    path = (folder / name).resolve()
    if path.parent != folder.resolve() or not path.is_file():
        raise FileNotFoundError(name)
    return path


if __name__ == "__main__":
    print(json.dumps(publish(), indent=2))

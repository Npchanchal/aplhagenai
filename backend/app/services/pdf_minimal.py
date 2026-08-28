"""Minimal PDF writer (no third-party deps) for IC audit dossier export."""

from __future__ import annotations

from typing import List


def _escape(s: str) -> str:
    return (
        (s or "")
        .replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("\r", "")
    )


def text_to_pdf(lines: List[str], *, title: str = "CiteAlpha IC Audit Dossier") -> bytes:
    """Build a simple multi-page PDF from plain text lines (Helvetica 10pt)."""
    page_w, page_h = 612, 792
    margin_l, margin_t = 50, 50
    line_h = 12
    usable = page_h - margin_t - 50
    max_lines = max(1, int(usable // line_h))

    wrapped: List[str] = []
    for raw in lines:
        text = (raw or "").replace("\t", "  ")
        while len(text) > 95:
            wrapped.append(text[:95])
            text = text[95:]
        wrapped.append(text)

    pages: List[List[str]] = []
    for i in range(0, len(wrapped), max_lines):
        pages.append(wrapped[i : i + max_lines])
    if not pages:
        pages = [[""]]

    page_ids = [4 + 2 * i for i in range(len(pages))]
    kids = " ".join(f"{pid} 0 R" for pid in page_ids)

    catalog = b"<< /Type /Catalog /Pages 2 0 R >>"
    pages_obj = f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode()
    font = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

    final_objs: List[bytes] = [catalog, pages_obj, font]
    for i, page_lines in enumerate(pages):
        page_id = page_ids[i]
        content_id = page_id + 1
        content_parts = [
            "BT",
            "/F1 10 Tf",
            f"{margin_l} {page_h - margin_t} Td",
            f"{line_h} TL",
        ]
        for li, line in enumerate(page_lines):
            esc = _escape(line)
            if li == 0:
                content_parts.append(f"({esc}) Tj")
            else:
                content_parts.append(f"T* ({esc}) Tj")
        content_parts.append("ET")
        stream = "\n".join(content_parts).encode("latin-1", errors="replace")
        page_obj = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_w} {page_h}] "
            f"/Contents {content_id} 0 R "
            f"/Resources << /Font << /F1 3 0 R >> >> >>"
        ).encode()
        content_obj = (
            f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream"
        )
        final_objs.append(page_obj)
        final_objs.append(content_obj)

    out = bytearray()
    out.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for i, obj in enumerate(final_objs, start=1):
        offsets.append(len(out))
        out.extend(f"{i} 0 obj\n".encode())
        out.extend(obj)
        out.extend(b"\nendobj\n")
    xref_pos = len(out)
    out.extend(f"xref\n0 {len(final_objs) + 1}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(
        f"trailer\n<< /Size {len(final_objs) + 1} /Root 1 0 R "
        f"/Info << /Title ({_escape(title)}) >> >>\n".encode()
    )
    out.extend(f"startxref\n{xref_pos}\n%%EOF\n".encode())
    return bytes(out)

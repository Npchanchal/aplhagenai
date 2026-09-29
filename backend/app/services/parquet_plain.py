"""Uncompressed Parquet v1 writer for a flat GCI levels table.

Stdlib only. Required columns, PLAIN encoding, converted-type UTF8 strings.
"""

from __future__ import annotations

import struct
from typing import Iterable, List, Sequence, Union

Number = Union[int, float]

_I32 = 5
_I64 = 6
_BINARY = 8
_LIST = 9
_STRUCT = 12


def _zigzag(n: int) -> int:
    return (n << 1) ^ (n >> 63)


class _Compact:
    def __init__(self) -> None:
        self.buf = bytearray()
        self._last: List[int] = [0]

    def _field(self, fid: int, typ: int) -> None:
        delta = fid - self._last[-1]
        if 0 < delta <= 15:
            self.buf.append((delta << 4) | typ)
        else:
            self.buf.append(typ)
            self._varint(_zigzag(fid))
        self._last[-1] = fid

    def _varint(self, n: int) -> None:
        while True:
            byte = n & 0x7F
            n >>= 7
            if n:
                self.buf.append(byte | 0x80)
            else:
                self.buf.append(byte)
                return

    def stop(self) -> None:
        self.buf.append(0)
        self._last.pop()

    def begin(self) -> None:
        self._last.append(0)

    def i32(self, fid: int, n: int) -> None:
        self._field(fid, _I32)
        self._varint(_zigzag(n))

    def i64(self, fid: int, n: int) -> None:
        self._field(fid, _I64)
        self._varint(_zigzag(n))

    def binary(self, fid: int, raw: bytes) -> None:
        self._field(fid, _BINARY)
        self._varint(len(raw))
        self.buf.extend(raw)

    def string(self, fid: int, text: str) -> None:
        self.binary(fid, text.encode("utf-8"))

    def list_header(self, fid: int, elem_type: int, size: int) -> None:
        self._field(fid, _LIST)
        if size == 0:
            self.buf.append(0)
        elif size <= 14:
            self.buf.append((size << 4) | elem_type)
        else:
            self.buf.append(0xF0 | elem_type)
            self._varint(size)


def _plain_bytes(values: Sequence[str]) -> bytes:
    out = bytearray()
    for value in values:
        raw = value.encode("utf-8")
        out += struct.pack("<I", len(raw))
        out += raw
    return bytes(out)


def _plain_doubles(values: Sequence[Number]) -> bytes:
    return b"".join(struct.pack("<d", float(v)) for v in values)


def _schema_element(w: _Compact, *, name: str, type_id: int | None, children: int | None, utf8: bool) -> None:
    w.begin()
    if type_id is not None:
        w.i32(1, type_id)
        w.i32(3, 0)  # REQUIRED
    w.string(4, name)
    if children is not None:
        w.i32(5, children)
    if utf8:
        w.i32(6, 0)  # ConvertedType.UTF8
    w.stop()


def _page(data: bytes, num_values: int) -> bytes:
    w = _Compact()
    w.i32(1, 0)  # DATA_PAGE
    w.i32(2, len(data))
    w.i32(3, len(data))
    w._field(5, _STRUCT)
    w.begin()
    w.i32(1, num_values)
    w.i32(2, 0)  # PLAIN
    w.i32(3, 3)  # RLE definition levels
    w.i32(4, 3)  # RLE repetition levels
    w.stop()
    w.stop()
    return bytes(w.buf) + data


def _column_meta(
    w: _Compact,
    *,
    type_id: int,
    name: str,
    num_values: int,
    page_offset: int,
    page_len: int,
) -> None:
    w.begin()
    w.i32(1, type_id)
    w.list_header(2, _I32, 2)
    w._varint(_zigzag(0))  # PLAIN
    w._varint(_zigzag(3))  # RLE
    w.list_header(3, _BINARY, 1)
    raw = name.encode("utf-8")
    w._varint(len(raw))
    w.buf.extend(raw)
    w.i32(4, 0)  # UNCOMPRESSED
    w.i64(5, num_values)
    w.i64(6, page_len)
    w.i64(7, page_len)
    w.i64(9, page_offset)
    w.stop()


def write_gci_levels(path: str, rows: Iterable[dict]) -> int:
    """Write company, gci, tier, as_of, algorithm_id, dataset_version. Returns row count."""
    materialized = list(rows)
    n = len(materialized)
    strings = {
        "company_id": [str(r.get("company_id") or "") for r in materialized],
        "confidence_tier": [str(r.get("confidence_tier") or "") for r in materialized],
        "as_of": [str(r.get("as_of") or "") for r in materialized],
        "algorithm_id": [str(r.get("algorithm_id") or "") for r in materialized],
        "dataset_version": [str(r.get("dataset_version") or "") for r in materialized],
    }
    doubles = [float(r["gci"]) if r.get("gci") is not None and r.get("gci") != "" else 0.0 for r in materialized]
    columns = [
        ("company_id", 6, True, _plain_bytes(strings["company_id"])),
        ("gci", 5, False, _plain_doubles(doubles)),
        ("confidence_tier", 6, True, _plain_bytes(strings["confidence_tier"])),
        ("as_of", 6, True, _plain_bytes(strings["as_of"])),
        ("algorithm_id", 6, True, _plain_bytes(strings["algorithm_id"])),
        ("dataset_version", 6, True, _plain_bytes(strings["dataset_version"])),
    ]
    pages = [_page(data, n) for _, _, _, data in columns]
    body = bytearray(b"PAR1")
    offsets: List[int] = []
    for page in pages:
        offsets.append(len(body))
        body.extend(page)

    meta = _Compact()
    meta.i32(1, 1)  # version
    meta.list_header(2, _STRUCT, 1 + len(columns))
    _schema_element(meta, name="schema", type_id=None, children=len(columns), utf8=False)
    for name, type_id, utf8, _data in columns:
        _schema_element(meta, name=name, type_id=type_id, children=None, utf8=utf8)
    meta.i64(3, n)
    meta.list_header(4, _STRUCT, 1)
    meta.begin()
    meta.list_header(1, _STRUCT, len(columns))
    for (name, type_id, _utf8, _data), offset, page in zip(columns, offsets, pages):
        meta.begin()
        meta.i64(2, offset)
        meta._field(3, _STRUCT)
        _column_meta(
            meta,
            type_id=type_id,
            name=name,
            num_values=n,
            page_offset=offset,
            page_len=len(page),
        )
        meta.stop()
    meta.i64(2, sum(len(p) for p in pages))
    meta.i64(3, n)
    meta.stop()
    meta.string(6, "citealpha-parquet-plain")
    meta.stop()

    footer = bytes(meta.buf)
    body.extend(footer)
    body.extend(struct.pack("<I", len(footer)))
    body.extend(b"PAR1")
    with open(path, "wb") as fh:
        fh.write(body)
    return n

"""Send the weekly GCI ledger digest. python -m app.jobs.ledger_digest [--force]

Set INTELLENS_LEDGER_DIGEST_TO to a comma-separated licensee list.
SMTP_HOST + SMTP_FROM send mail; otherwise the mailer stubs the message.
The refresh scheduler calls this when INTELLENS_LEDGER_DIGEST=1.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional

from app.services.ledger_digest import send_weekly


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true", help="Send even if this ISO week already went out")
    args = ap.parse_args(argv)
    report = send_weekly(force=args.force)
    json.dump(report, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

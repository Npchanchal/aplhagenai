import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, fetchLegalMeta } from "../lib/api";

type Props = {
  error?: ApiError | null;
  cap?: number;
};

/** Guest 15-dossier cap — register always; retail checkout still counsel-gated. */
export default function GuestPaywallModal({ error, cap = 15 }: Props) {
  const [retailOk, setRetailOk] = useState<boolean | undefined>(error?.retail_marketing_allowed);

  useEffect(() => {
    if (typeof retailOk === "boolean") return;
    let cancelled = false;
    void fetchLegalMeta()
      .then((m) => {
        if (!cancelled) setRetailOk(Boolean(m.retail_marketing_allowed));
      })
      .catch(() => {
        if (!cancelled) setRetailOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retailOk]);

  const allowed = Boolean(retailOk);
  const limit = cap;

  return (
    <div className="source-viewer-overlay" data-testid="guest-paywall" role="dialog" aria-modal="true">
      <div className="source-viewer">
        <h2 style={{ marginTop: 0 }}>Guest preview limit reached</h2>
        <p>
          {error?.message ||
            `This guest session has opened ${limit} dossiers. Register to keep reading evidence trails.`}
        </p>
        <p className="muted" style={{ fontSize: 13 }}>
          CiteAlpha scores management delivery (GCI). Not a Buy/Hold recommendation.
        </p>
        <div className="citation-actions" style={{ marginTop: 16 }}>
          <Link className="btn" to="/register" data-testid="guest-paywall-register">
            Register
          </Link>
          <Link className="btn ghost" to="/login">
            Sign in
          </Link>
          {allowed ? (
            <>
              <Link className="btn ghost" to="/package">
                Package
              </Link>
              <Link className="btn ghost" to="/billing">
                Billing
              </Link>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Retail checkout stays off until SEBI counsel signs off (
              <code>INTELLENS_RETAIL_MARKETING</code>).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

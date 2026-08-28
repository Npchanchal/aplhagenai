import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLegalMeta } from "../lib/api";
import {
  CONTACT_EMAIL,
  LEGAL_ENTITY,
  PRODUCT_NAME,
  counselApproved,
} from "../lib/legal";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
};

/** Required T&C + Privacy acceptance for register / guest. */
export default function TermsAccept({ checked, onChange, id = "accept-terms" }: Props) {
  const [versions, setVersions] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void fetchLegalMeta()
      .then((meta) => {
        if (cancelled) return;
        setVersions(` (Terms v${meta.terms_version} · Privacy v${meta.privacy_version})`);
      })
      .catch(() => {
        /* versions optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <label className="terms-accept" htmlFor={id} data-testid="terms-accept">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid="terms-accept-checkbox"
      />
      <span>
        I agree to the{" "}
        <Link to="/terms" target="_blank" rel="noreferrer">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link to="/privacy" target="_blank" rel="noreferrer">
          Privacy Notice
        </Link>{" "}
        of {LEGAL_ENTITY} ({PRODUCT_NAME})
        {versions}. Contact {CONTACT_EMAIL}.
      </span>
    </label>
  );
}

export function CounselStatusBanner({
  status,
  note,
}: {
  status?: string | null;
  note?: string | null;
}) {
  if (!status) return null;
  const ok = counselApproved(status);
  return (
    <p
      className={`counsel-banner ${ok ? "approved" : "pending"}`}
      data-testid="counsel-banner"
    >
      {ok
        ? "Counsel-attested Terms and Privacy are in effect for this deployment."
        : "Terms and Privacy are a product scaffold pending counsel attestation — not a signed MSA."}
      {note ? ` ${note}` : ""}
    </p>
  );
}

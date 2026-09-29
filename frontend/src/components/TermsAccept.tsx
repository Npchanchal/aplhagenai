import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLegalMeta } from "../lib/api";
import {
  CONTACT_EMAIL,
  LEGAL_ENTITY,
  PRODUCT_NAME,
  counselApproved,
} from "../lib/legal";
import { useI18n } from "../i18n";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
};

/** Required T&C + Privacy acceptance for register / guest. */
export default function TermsAccept({ checked, onChange, id = "accept-terms" }: Props) {
  const { t } = useI18n();
  const [meta, setMeta] = useState<{ terms: string; privacy: string } | null>(null);
  const versions = meta ? t("ui.TermsAccept.versions", meta) : "";

  useEffect(() => {
    let cancelled = false;
    void fetchLegalMeta()
      .then((meta) => {
        if (cancelled) return;
        setMeta({ terms: String(meta.terms_version), privacy: String(meta.privacy_version) });
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
        {t("ui.TermsAccept.agree")}{" "}
        <Link to="/terms" target="_blank" rel="noreferrer">
          {t("footer.terms")}
        </Link>{" "}
        {t("ui.TermsAccept.and")}{" "}
        <Link to="/privacy" target="_blank" rel="noreferrer">
          {t("footer.privacy")}
        </Link>{" "}
        {t("ui.TermsAccept.of", { entity: LEGAL_ENTITY, product: PRODUCT_NAME })}
        {versions}
        {t("ui.TermsAccept.contact", { email: CONTACT_EMAIL })}
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
  const { t } = useI18n();
  if (!status) return null;
  const ok = counselApproved(status);
  return (
    <p
      className={`counsel-banner ${ok ? "approved" : "pending"}`}
      data-testid="counsel-banner"
    >
      {ok
        ? t("ui.TermsAccept.counselApproved")
        : t("ui.TermsAccept.counselPending")}
      {note ? ` ${note}` : ""}
    </p>
  );
}

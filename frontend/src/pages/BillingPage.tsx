import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import { useAuth } from "../lib/auth";
import { LEGAL_ENTITY } from "../lib/legal";
import { trackEvent } from "../lib/analytics";

type InvoiceRow = {
  id?: string;
  amount_inr?: number;
  status?: string;
  plan?: string;
  created_at?: string;
};

type Checkout = {
  id: string;
  amount_inr: number;
  upi_intent?: string;
  status: string;
};

/** Pilot → MSA issued → signed → Desk seats. Retail confirm needs real ref unless BILLING_DEMO. */
export default function BillingPage() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Checkout | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    if (!token) return;
    void fetch("/api/billing/invoices", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((b) => setInvoices((b.invoices || []) as InvoiceRow[]))
      .catch(() => setInvoices([]));
  }, [token, order, msg]);

  async function retailCheckout() {
    if (!token) return;
    setError(null);
    try {
      const r = await fetch("/api/billing/retail/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.detail || "Checkout failed");
      setOrder(body);
      setMsg("UPI intent ready — enter the payment reference after paying (demo refs need BILLING_DEMO=1).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    }
  }

  async function confirmPay() {
    if (!token || !order) return;
    setError(null);
    const r = await fetch("/api/billing/retail/confirm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: order.id,
        payment_ref: paymentRef.trim() || "upi-demo",
      }),
    });
    const body = await r.json();
    if (!r.ok) {
      setError(typeof body.detail === "string" ? body.detail : "Payment confirm failed");
      return;
    }
    setOrder(body);
    setMsg("Retail subscription active.");
  }

  async function issueMsa(e: FormEvent, fromPilot = false) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    const r = await fetch("/api/billing/msa", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        fromPilot
          ? { plan: "desk", seats: 5, from_pilot: true, conversion_path: "pilot_to_desk" }
          : { plan: "desk", seats: 5 },
      ),
    });
    const body = await r.json();
    if (!r.ok) {
      setError(body.detail || "MSA issue failed");
      return;
    }
    setMsg(
      fromPilot
        ? `MSA ${body.id} issued (pilot→Desk). Sign to activate seats.`
        : `MSA ${body.id} issued.`,
    );
    if (body.next_steps) {
      setMsg((m) => `${m || ""}\n${(body.next_steps as string[]).join(" · ")}`);
    }
    const sign = await fetch(`/api/billing/msa/${body.id}/sign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ signer_email: user?.email || "signer@example.com" }),
    });
    const signed = await sign.json();
    if (!sign.ok) {
      setError(signed.detail || "MSA sign failed");
      return;
    }
    setMsg(`MSA ${signed.id} signed — Desk subscription active. Razorpay PSP is ops next (not in-app).`);
  }

  return (
    <section className="auth-page" data-testid="billing-page">
      <p className="page-kicker">{t("billing.kicker")}</p>
      <h1>{t("billing.title")}</h1>
      <p className="muted lede">{t("billing.lede", { entity: LEGAL_ENTITY })}</p>
      {!user || user.kind === "guest" ? (
        <div className="panel" data-testid="billing-guest">
          <h2 style={{ marginTop: 0 }}>{t("billing.guestTitle")}</h2>
          <p className="muted">{t("billing.guestLede")}</p>
          <p style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link to="/login" className="btn primary">
              {t("common.login")}
            </Link>
            <Link to="/package" className="btn">
              {t("billing.viewPlans")}
            </Link>
          </p>
        </div>
      ) : (
        <div className="panel">
          {user.account_type === "retail" && (
            <>
              <h2 style={{ marginTop: 0 }}>Retail (B2C)</h2>
              <button type="button" className="btn primary" onClick={() => void retailCheckout()}>
                Start UPI checkout
              </button>
              {order && (
                <div style={{ marginTop: 12 }}>
                  <p className="muted">
                    Order {order.id} · ₹{order.amount_inr} · {order.status}
                  </p>
                  {order.upi_intent && (
                    <p>
                      <a href={order.upi_intent}>Open UPI intent</a>
                    </p>
                  )}
                  {order.status === "pending_payment" && (
                    <div className="desk-field" style={{ marginTop: 8 }}>
                      <label className="field-label" htmlFor="pay-ref">
                        Payment reference
                      </label>
                      <input
                        id="pay-ref"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="UPI txn id (upi-demo only if BILLING_DEMO=1)"
                      />
                      <button
                        type="button"
                        className="btn"
                        style={{ marginTop: 8 }}
                        onClick={() => void confirmPay()}
                      >
                        Confirm payment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {(user.account_type === "b2b" || user.role === "admin" || user.role === "owner") && (
            <>
              <h2 style={{ marginTop: 0 }}>B2B MSA</h2>
              <p className="muted" style={{ fontSize: 13 }}>
                1) Finish pilot checklist on Desk → CSM · 2) Issue MSA · 3) Sign · 4) Seats active
              </p>
              <form onSubmit={(e) => void issueMsa(e, true)} style={{ marginBottom: 12 }}>
                <button
                  type="submit"
                  className="btn primary"
                  data-testid="billing-pilot-msa"
                  onClick={() => trackEvent("billing_cta", { source: "pilot_msa" })}
                >
                  Issue pilot→Desk MSA (5 seats)
                </button>
              </form>
              <form onSubmit={(e) => void issueMsa(e, false)}>
                <button type="submit" className="btn ghost">
                  Issue Desk MSA only
                </button>
              </form>
            </>
          )}
          {msg && (
            <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
              {msg}
            </p>
          )}
          {error && <p className="error">{error}</p>}
          <h3>Invoices</h3>
          {invoices.length === 0 ? (
            <p className="muted">No invoices yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="table" data-testid="billing-invoices">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={inv.id || i}>
                      <td>{inv.id || "—"}</td>
                      <td>{inv.plan || "—"}</td>
                      <td>{inv.amount_inr != null ? `₹${inv.amount_inr}` : "—"}</td>
                      <td>{inv.status || "—"}</td>
                      <td>{inv.created_at ? String(inv.created_at).slice(0, 10) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <Disclaimer />
    </section>
  );
}

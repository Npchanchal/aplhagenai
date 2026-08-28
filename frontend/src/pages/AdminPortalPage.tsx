import { FormEvent, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Skeleton from "../components/Skeleton";
import {
  fetchAdminPortalAudit,
  fetchAdminPortalBilling,
  fetchAdminPortalFeedback,
  fetchAdminPortalLegal,
  fetchAdminPortalMe,
  fetchAdminPortalOrgs,
  fetchAdminPortalPilotRequests,
  fetchAdminPortalUsers,
  patchAdminPortalFeedback,
  patchAdminPortalPilotRequest,
  patchAdminPortalUserRole,
  postAdminPortalLegalAttest,
  postAdminPortalPilot,
  type AdminPortalMe,
  type AdminPortalUser,
  type FeedbackItem,
  type OrgPayload,
  type PilotRequestItem,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { LEGAL_ENTITY } from "../lib/legal";

const PLATFORM_ROLES = ["super", "ops", "compliance", "billing", "support"] as const;

function AdminGate({
  title,
  children,
  testId,
}: {
  title: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="admin-portal-page admin-portal-gate" data-testid={testId}>
      <p className="page-kicker">Operations</p>
      <h1>{title}</h1>
      <div className="panel desk-panel admin-portal-gate-panel">{children}</div>
    </section>
  );
}

export default function AdminPortalPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [portal, setPortal] = useState<AdminPortalMe | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrgPayload[]>([]);
  const [users, setUsers] = useState<AdminPortalUser[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [legal, setLegal] = useState<Record<string, unknown> | null>(null);
  const [billing, setBilling] = useState<Record<string, unknown>[]>([]);
  const [audit, setAudit] = useState<Record<string, number> | null>(null);
  const [pilotRequests, setPilotRequests] = useState<PilotRequestItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pilotName, setPilotName] = useState("New Pilot Desk");
  const [attestBy, setAttestBy] = useState("counsel@firm.com");
  const [attestKind, setAttestKind] = useState("terms_privacy");

  const section = searchParams.get("section") || "overview";
  const can = useCallback(
    (perm: string) => (portal?.permissions || []).includes(perm),
    [portal?.permissions],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      setPortal(null);
      setAccessError(null);
      return;
    }
    setLoading(true);
    void fetchAdminPortalMe(token)
      .then((row) => {
        setPortal(row);
        setAccessError(null);
      })
      .catch((e) => {
        setPortal(null);
        setAccessError((e as Error).message || "Platform admin access required");
      })
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  const loadSection = useCallback(async () => {
    if (!token || !portal) return;
    setErr(null);
    try {
      if (section === "orgs" && can("orgs.read")) {
        const res = await fetchAdminPortalOrgs(token);
        setOrgs(res.orgs || []);
      }
      if (section === "users" && can("users.read")) {
        const res = await fetchAdminPortalUsers(token);
        setUsers(res.users || []);
      }
      if (section === "feedback" && can("feedback.read")) {
        const res = await fetchAdminPortalFeedback(token);
        setFeedback(res.items || []);
      }
      if (section === "legal" && can("legal.read")) {
        setLegal(await fetchAdminPortalLegal(token));
      }
      if (section === "billing" && can("billing.read")) {
        const res = await fetchAdminPortalBilling(token);
        setBilling(res.invoices || []);
      }
      if (section === "audit" && can("audit.read")) {
        setAudit(await fetchAdminPortalAudit(token));
      }
      if (section === "pilot-requests" && can("pilot.manage")) {
        const res = await fetchAdminPortalPilotRequests(undefined, token);
        setPilotRequests(res.items || []);
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [token, portal, section, can]);

  useEffect(() => {
    void loadSection();
  }, [loadSection]);

  const sections = useMemo(() => portal?.sections || [], [portal?.sections]);

  if (authLoading || (token && loading)) {
    return (
      <section className="admin-portal-page" data-testid="admin-portal-loading">
        <p className="page-kicker">Operations</p>
        <h1>Platform admin portal</h1>
        <div className="panel desk-panel">
          <Skeleton rows={4} />
        </div>
      </section>
    );
  }

  if (!token) {
    return (
      <AdminGate title="Platform admin portal" testId="admin-portal-signin">
        <p className="muted lede">
          Cross-tenant operations for {LEGAL_ENTITY}: orgs, users, legal attestations, billing,
          and partner feedback. Org seat admin stays on Desk — this console is for platform
          operators only.
        </p>
        <div className="admin-portal-cta row gap">
          <Link to="/login" state={{ from: "/admin" }} className="btn-primary">
            Sign in
          </Link>
          <Link to="/register" className="btn">
            Register
          </Link>
          <Link to="/desk" className="btn-ghost">
            Back to Desk
          </Link>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: "1rem" }}>
          Need access? Ask a <code>super</code> admin to assign a platform role after you
          register.
        </p>
      </AdminGate>
    );
  }

  if (accessError || !portal) {
    return (
      <AdminGate title="Access denied" testId="admin-access-denied">
        <p className="error">{accessError || "Platform admin access required"}</p>
        <p className="muted">
          Signed in as <strong>{user?.email || user?.name}</strong> (org role{" "}
          <code>{user?.role || "—"}</code>). Org admin on Desk does not unlock this portal.
        </p>
        <ul className="admin-steps muted">
          <li>
            Request a platform role: <code>super</code>, <code>ops</code>,{" "}
            <code>compliance</code>, <code>billing</code>, or <code>support</code>.
          </li>
          <li>
            A <code>super</code> admin assigns it via Users → Platform admin, or{" "}
            <code>PATCH /api/admin/portal/users/&#123;id&#125;/platform-role</code>.
          </li>
          <li>Demo bootstrap: <code>X-API-Key: intellens-admin</code> (local only).</li>
        </ul>
        <div className="admin-portal-cta row gap">
          <Link to="/desk" className="btn-primary">
            Open Desk
          </Link>
          <Link to="/help" className="btn-ghost">
            Help
          </Link>
        </div>
      </AdminGate>
    );
  }

  return (
    <section className="admin-portal-page" data-testid="admin-portal">
      <header className="admin-portal-head">
        <div>
          <p className="page-kicker">Operations</p>
          <h1>Platform admin portal</h1>
          <p className="muted lede">
            Role <strong>{portal.platform_admin_role}</strong>
            {portal.email ? ` · ${portal.email}` : ""}
            {" · "}
            {LEGAL_ENTITY}
          </p>
        </div>
        <Link to="/desk" className="btn-ghost">
          Desk
        </Link>
      </header>

      <div className="admin-portal-layout">
        <nav className="admin-portal-nav panel" aria-label="Admin sections">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={section === s.id ? "active" : ""}
              data-testid={`admin-nav-${s.id}`}
              onClick={() => setSearchParams({ section: s.id })}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="admin-portal-main panel desk-panel">
          {msg && <p className="muted admin-flash">{msg}</p>}
          {err && <p className="error">{err}</p>}

          {section === "overview" && (
            <div data-testid="admin-section-overview">
              <h2 style={{ marginTop: 0 }}>Overview</h2>
              <p className="muted">
                Role-based platform administration. Permissions are enforced server-side — only
                sections you can access appear in the sidebar.
              </p>
              <ul className="admin-perm-list">
                {(portal.permissions || []).map((p) => (
                  <li key={p}>
                    <code>{p}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section === "orgs" && can("orgs.read") && (
            <div data-testid="admin-section-orgs">
              <h2 style={{ marginTop: 0 }}>Organizations</h2>
              {can("pilot.manage") && (
                <form
                  className="admin-inline-form"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    if (!token) return;
                    void postAdminPortalPilot(pilotName, token)
                      .then((r) => {
                        setMsg(`Pilot provisioned: ${String(r.org_id || r.id || "ok")}`);
                        return fetchAdminPortalOrgs(token);
                      })
                      .then((res) => setOrgs(res.orgs || []))
                      .catch((ex) => setErr((ex as Error).message));
                  }}
                >
                  <input
                    value={pilotName}
                    onChange={(e) => setPilotName(e.target.value)}
                    placeholder="Pilot org name"
                    aria-label="Pilot org name"
                  />
                  <button type="submit" className="btn-primary">
                    Provision pilot
                  </button>
                </form>
              )}
              {orgs.length === 0 ? (
                <p className="muted">No organizations found.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Plan</th>
                      <th>Seats</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((o) => (
                      <tr key={String(o.id)}>
                        <td>
                          <code>{String(o.id)}</code>
                        </td>
                        <td>{o.name}</td>
                        <td>{o.plan}</td>
                        <td>
                          {o.seats_used ?? 0}/{o.seats ?? "—"}
                        </td>
                        <td>{String(o.account_type || "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {section === "users" && can("users.read") && (
            <div data-testid="admin-section-users">
              <h2 style={{ marginTop: 0 }}>Users</h2>
              {users.length === 0 ? (
                <p className="muted">No registered users yet.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Org</th>
                      <th>Org role</th>
                      <th>Platform admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.email || u.name || u.id}</td>
                        <td>
                          <code>{u.org_id || "—"}</code>
                        </td>
                        <td>{u.role || "—"}</td>
                        <td>
                          {can("users.write") ? (
                            <select
                              value={u.platform_admin_role || ""}
                              aria-label={`Platform role for ${u.email || u.id}`}
                              onChange={(e) => {
                                if (!token) return;
                                const val = e.target.value || null;
                                void patchAdminPortalUserRole(u.id, val, token)
                                  .then(() => loadSection())
                                  .catch((ex) => setErr((ex as Error).message));
                              }}
                            >
                              <option value="">—</option>
                              {PLATFORM_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          ) : (
                            u.platform_admin_role || "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {section === "feedback" && can("feedback.read") && (
            <div data-testid="admin-section-feedback">
              <h2 style={{ marginTop: 0 }}>Partner feedback</h2>
              {feedback.length === 0 ? (
                <p className="muted">No feedback items.</p>
              ) : (
                <ul className="org-member-list">
                  {feedback.map((it) => (
                    <li key={it.id}>
                      <span>
                        {it.kind} · org {it.org_id || "—"} · {it.company_id || "—"} · {it.status}
                        {it.comment ? ` — ${it.comment.slice(0, 100)}` : ""}
                      </span>
                      {can("feedback.write") && it.status === "open" && token && (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            void patchAdminPortalFeedback(it.id, "ack", token)
                              .then(() => loadSection())
                              .catch((ex) => setErr((ex as Error).message));
                          }}
                        >
                          Ack
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {section === "pilot-requests" && can("pilot.manage") && (
            <div data-testid="admin-section-pilot-requests">
              <h2 style={{ marginTop: 0 }}>Pilot requests</h2>
              <p className="muted">
                Inbound evaluation requests from the public form. Approve to provision a pilot org;
                reject to close without creating a tenant.
              </p>
              {pilotRequests.length === 0 ? (
                <p className="muted">No pilot requests yet.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Submitted</th>
                      <th>Contact</th>
                      <th>Firm</th>
                      <th>Details</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pilotRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.created_at ? req.created_at.slice(0, 10) : "—"}</td>
                        <td>
                          <div>{req.name}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {req.email}
                          </div>
                        </td>
                        <td>{req.firm}</td>
                        <td>
                          {[req.role, req.team_size].filter(Boolean).join(" · ") || "—"}
                          {req.message ? (
                            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                              {req.message.slice(0, 120)}
                              {req.message.length > 120 ? "…" : ""}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <code>{req.status}</code>
                          {req.org_id ? (
                            <div className="muted" style={{ fontSize: 12 }}>
                              org {req.org_id}
                            </div>
                          ) : null}
                          {req.reviewed_by ? (
                            <div className="muted" style={{ fontSize: 12 }}>
                              by {req.reviewed_by}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          {req.status === "pending" && token ? (
                            <div className="row gap">
                              <button
                                type="button"
                                className="btn-primary"
                                data-testid={`pilot-approve-${req.id}`}
                                onClick={() => {
                                  void patchAdminPortalPilotRequest(req.id, { action: "approve" }, token)
                                    .then((r) => {
                                      setMsg(
                                        r.request.org_id
                                          ? `Approved — pilot org ${r.request.org_id} provisioned`
                                          : "Pilot request approved",
                                      );
                                      return loadSection();
                                    })
                                    .catch((ex) => setErr((ex as Error).message));
                                }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-ghost"
                                data-testid={`pilot-reject-${req.id}`}
                                onClick={() => {
                                  void patchAdminPortalPilotRequest(req.id, { action: "reject" }, token)
                                    .then(() => {
                                      setMsg("Pilot request rejected");
                                      return loadSection();
                                    })
                                    .catch((ex) => setErr((ex as Error).message));
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {section === "legal" && can("legal.read") && legal && (
            <div data-testid="admin-section-legal">
              <h2 style={{ marginTop: 0 }}>Legal attestations</h2>
              <p className="muted">
                Counsel: <code>{String(legal.counsel_status)}</code> · SEBI retail:{" "}
                <code>{String(legal.sebi_retail_status)}</code>
              </p>
              {can("legal.write") && token && (
                <form
                  className="admin-inline-form"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void postAdminPortalLegalAttest(
                      { kind: attestKind, attested_by: attestBy },
                      token,
                    )
                      .then(() => fetchAdminPortalLegal(token))
                      .then(setLegal)
                      .then(() => setMsg("Attestation recorded"))
                      .catch((ex) => setErr((ex as Error).message));
                  }}
                >
                  <select
                    value={attestKind}
                    onChange={(e) => setAttestKind(e.target.value)}
                    aria-label="Attestation kind"
                  >
                    <option value="terms_privacy">terms_privacy</option>
                    <option value="sebi_retail">sebi_retail</option>
                  </select>
                  <input
                    value={attestBy}
                    onChange={(e) => setAttestBy(e.target.value)}
                    placeholder="Attested by"
                    aria-label="Attested by"
                  />
                  <button type="submit" className="btn-primary">
                    Record attestation
                  </button>
                </form>
              )}
            </div>
          )}

          {section === "billing" && can("billing.read") && (
            <div data-testid="admin-section-billing">
              <h2 style={{ marginTop: 0 }}>Billing</h2>
              {billing.length === 0 ? (
                <p className="muted">No invoices yet.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Org</th>
                      <th>Kind</th>
                      <th>Status</th>
                      <th>INR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.map((inv) => (
                      <tr key={String(inv.id)}>
                        <td>
                          <code>{String(inv.id)}</code>
                        </td>
                        <td>{String(inv.org_id || "—")}</td>
                        <td>{String(inv.kind || "—")}</td>
                        <td>{String(inv.status || "—")}</td>
                        <td>{String(inv.amount_inr ?? "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {section === "audit" && can("audit.read") && audit && (
            <div data-testid="admin-section-audit">
              <h2 style={{ marginTop: 0 }}>Audit summary</h2>
              <dl className="admin-dl">
                {Object.entries(audit).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k.replace(/_/g, " ")}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {section === "system" && can("system.ops") && (
            <div data-testid="admin-section-system">
              <h2 style={{ marginTop: 0 }}>System</h2>
              <p className="muted">
                Destructive ops stay API-key gated. Use{" "}
                <code>POST /api/admin/reset-demo</code> with admin key only in non-production
                environments.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

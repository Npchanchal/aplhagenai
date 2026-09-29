import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchPilotChecklist,
  patchPilotChecklist,
  postProvisionPilot,
} from "../lib/api";

type Checklist = Awaited<ReturnType<typeof fetchPilotChecklist>>;

export default function PilotChecklistPanel({ orgId }: { orgId: string }) {
  const [data, setData] = useState<Checklist | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pilotName, setPilotName] = useState("New Pilot Desk");

  const load = async (oid = orgId) => {
    try {
      setErr(null);
      const row = await fetchPilotChecklist(oid);
      setData(row as Checklist);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  useEffect(() => {
    void load();
  }, [orgId]);

  if (err) {
    return (
      <div className="panel" data-testid="pilot-checklist">
        <p className="error">{err}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="panel" data-testid="pilot-checklist">
        <p className="muted">Loading pilot checklist…</p>
      </div>
    );
  }

  return (
    <div className="panel" data-testid="pilot-checklist">
      <div className="panel-head">
        <h2 style={{ marginTop: 0 }}>Pilot conversion checklist</h2>
        <span className="muted" style={{ fontSize: 13 }}>
          {data.progress.done}/{data.progress.total} · {data.progress.pct}%
        </span>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        Trojan-horse path: habit → IC citation → Desk / API convert. Next:{" "}
        <strong>{data.next_step}</strong>
      </p>
      {data.activity ? (
        <p className="muted" style={{ fontSize: 13 }} data-testid="pilot-activity">
          Dossier opens: {data.activity.dossier_opens ?? 0} · citations copied:{" "}
          {data.activity.citations_copied ?? 0} · quality flags:{" "}
          {data.activity.quality_feedback ?? 0}
        </p>
      ) : null}
      <ul className="package-steps" style={{ listStyle: "none", paddingLeft: 0 }}>
        {data.items.map((item) => (
          <li key={item.id} style={{ marginBottom: 8 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input
                type="checkbox"
                checked={item.done}
                disabled={busy}
                data-testid={`pilot-item-${item.id}`}
                onChange={async (e) => {
                  setBusy(true);
                  try {
                    const next = await patchPilotChecklist(orgId, {
                      item_id: item.id,
                      done: e.target.checked,
                    });
                    setData(next as Checklist);
                  } catch (ex) {
                    setErr((ex as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <span>
                <span className="muted" style={{ fontSize: 11 }}>
                  {item.phase}
                </span>
                <br />
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="queue-ingest-row" style={{ marginTop: 12 }}>
        <select
          aria-label="Convert intent"
          value={data.convert_intent || ""}
          onChange={async (e) => {
            const next = await patchPilotChecklist(orgId, {
              convert_intent: e.target.value || undefined,
            });
            setData(next as Checklist);
          }}
        >
          <option value="">Convert intent…</option>
          <option value="yes">Yes — convert</option>
          <option value="maybe">Maybe</option>
          <option value="no">No</option>
        </select>
        <select
          aria-label="Target SKU"
          value={data.target_sku || ""}
          onChange={async (e) => {
            const next = await patchPilotChecklist(orgId, {
              target_sku: e.target.value || undefined,
            });
            setData(next as Checklist);
          }}
        >
          <option value="">Target SKU…</option>
          <option value="desk">Desk</option>
          <option value="enterprise">Enterprise API</option>
          <option value="onestop">Enterprise bundle</option>
        </select>
        {data.conversion_ready && (
          <Link className="btn" to="/billing">
            Open billing / MSA
          </Link>
        )}
      </div>
      <div className="queue-ingest-row" style={{ marginTop: 16 }}>
        <input
          value={pilotName}
          onChange={(e) => setPilotName(e.target.value)}
          aria-label="New pilot org name"
          placeholder="New pilot org name"
        />
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          data-testid="provision-pilot"
          onClick={async () => {
            setBusy(true);
            try {
              const created = await postProvisionPilot({ name: pilotName });
              setErr(null);
              await load(created.org.id);
            } catch (ex) {
              setErr((ex as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Provision pilot org template
        </button>
      </div>
    </div>
  );
}

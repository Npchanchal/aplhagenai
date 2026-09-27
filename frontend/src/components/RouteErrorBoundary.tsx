import { Component, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n";

const RELOAD_KEY = "citealpha.chunkReloadAt";
const RELOAD_WINDOW_MS = 30_000;

export function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk .* failed|error loading dynamically imported module/i.test(
    msg,
  );
}

/** Reload at most once per window so a genuinely missing chunk can't loop. */
export function reloadOnceForStaleChunk(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

type Labels = { title: string; body: string; reload: string };
type Props = { children: ReactNode; labels: Labels };
type State = { error: unknown; reloading: boolean };

class Boundary extends Component<Props, State> {
  state: State = { error: null, reloading: false };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error };
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
      this.setState({ reloading: true });
    }
  }

  render() {
    const { error, reloading } = this.state;
    if (!error) return this.props.children;
    if (reloading) {
      return (
        <div className="route-loading" role="status" aria-live="polite">
          Loading…
        </div>
      );
    }
    const { labels } = this.props;
    return (
      <div className="card route-error" role="alert" data-testid="route-error">
        <h1>{labels.title}</h1>
        <p className="muted">{labels.body}</p>
        <button type="button" className="btn primary" onClick={() => window.location.reload()}>
          {labels.reload}
        </button>
      </div>
    );
  }
}

/** Keeps a failed route from blanking the whole app; resets on navigation. */
export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  return (
    <Boundary
      key={pathname}
      labels={{
        title: t("app.routeError.title"),
        body: t("app.routeError.body"),
        reload: t("app.routeError.reload"),
      }}
    >
      {children}
    </Boundary>
  );
}

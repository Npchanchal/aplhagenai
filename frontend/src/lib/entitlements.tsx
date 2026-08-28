import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchEntitlementsMe, type Entitlements } from "./api";
import { useAuth } from "./auth";

const GUEST: Entitlements = {
  plan: "guest",
  role: "guest",
  kind: "guest",
  features: ["tracker"],
  limits: { companies_viewed: 15, chat: 0 },
  source: "guest",
};

type Ctx = {
  entitlements: Entitlements;
  has: (feature: string) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

const EntitlementsContext = createContext<Ctx | null>(null);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements>(GUEST);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const row = await fetchEntitlementsMe();
      setEntitlements(row);
    } catch {
      setEntitlements(GUEST);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.id, user?.role, token]);

  const has = useCallback(
    (feature: string) => (entitlements.features || []).includes(feature),
    [entitlements.features],
  );

  const value = useMemo(
    () => ({ entitlements, has, loading, refresh }),
    [entitlements, has, loading, refresh],
  );

  return (
    <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>
  );
}

export function useEntitlements(): Ctx {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) {
    return {
      entitlements: GUEST,
      has: (f) => GUEST.features.includes(f),
      loading: false,
      refresh: async () => {},
    };
  }
  return ctx;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAuthMe,
  postGuest,
  postLogin,
  postLogout,
  postRegister,
  putPreferences,
  type AuthUser,
  type UserPreferences,
} from "../lib/api";
import { useI18n } from "../i18n";
import type { LangCode } from "../i18n/languages";

const TOKEN_KEY = "intellens.auth.token";
const LOCAL_PREFS_KEY = "intellens.prefs";

type AuthCtx = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  adoptToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  preferences: UserPreferences | null;
};

const Ctx = createContext<AuthCtx | null>(null);

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function readLocalPrefs(): Partial<UserPreferences> {
  try {
    const raw = localStorage.getItem(LOCAL_PREFS_KEY);
    return raw ? (JSON.parse(raw) as Partial<UserPreferences>) : {};
  } catch {
    return {};
  }
}

function writeLocalPrefs(prefs: UserPreferences) {
  try {
    localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { lang, setLang } = useI18n();
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(
    (nextToken: string, nextUser: AuthUser) => {
      writeToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
      setPreferences(nextUser.preferences);
      writeLocalPrefs(nextUser.preferences);
      if (nextUser.preferences.language && nextUser.preferences.language !== lang) {
        setLang(nextUser.preferences.language as LangCode);
      }
    },
    [lang, setLang],
  );

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const tkn = readToken();
      if (!tkn) {
        const local = readLocalPrefs();
        if (local.language) setLang(local.language as LangCode);
        setLoading(false);
        return;
      }
      try {
        const me = await fetchAuthMe(tkn);
        if (cancelled) return;
        applySession(tkn, me.user);
      } catch {
        writeToken(null);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await postLogin(email, password);
      applySession(res.token, res.user);
    },
    [applySession],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await postRegister({
        email,
        password,
        name,
        guest_token: user?.kind === "guest" ? token ?? undefined : undefined,
        preferences: {
          language: lang,
          ...readLocalPrefs(),
        },
      });
      applySession(res.token, res.user);
    },
    [applySession, lang, token, user],
  );

  const continueAsGuest = useCallback(async () => {
    const res = await postGuest();
    const merged = {
      ...res.user.preferences,
      ...readLocalPrefs(),
      language: lang,
    } as UserPreferences;
    applySession(res.token, { ...res.user, preferences: merged });
    const prefs = await putPreferences(res.token, merged);
    setPreferences(prefs.preferences);
    writeLocalPrefs(prefs.preferences);
  }, [applySession, lang]);

  const adoptToken = useCallback(
    async (nextToken: string) => {
      const me = await fetchAuthMe(nextToken);
      applySession(nextToken, me.user);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await postLogout(token);
      } catch {
        /* ignore */
      }
    }
    writeToken(null);
    setToken(null);
    setUser(null);
    setPreferences(null);
  }, [token]);

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      if (patch.language) setLang(patch.language as LangCode);
      if (token) {
        const res = await putPreferences(token, patch);
        setPreferences(res.preferences);
        writeLocalPrefs(res.preferences);
        if (user) setUser({ ...user, preferences: res.preferences });
      } else {
        const next = { ...(preferences ?? readLocalPrefs()), ...patch } as UserPreferences;
        setPreferences(next);
        writeLocalPrefs(next);
      }
    },
    [preferences, setLang, token, user],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      continueAsGuest,
      adoptToken,
      logout,
      updatePreferences,
      preferences,
    }),
    [
      user,
      token,
      loading,
      login,
      register,
      continueAsGuest,
      adoptToken,
      logout,
      updatePreferences,
      preferences,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}

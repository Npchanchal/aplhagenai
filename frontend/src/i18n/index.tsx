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
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  LANGUAGES,
  type LangCode,
} from "./languages";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import kn from "./locales/kn.json";
import ml from "./locales/ml.json";
import mr from "./locales/mr.json";
import gu from "./locales/gu.json";
import bn from "./locales/bn.json";
import pa from "./locales/pa.json";
import ja from "./locales/ja.json";
import zh from "./locales/zh.json";
import ar from "./locales/ar.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import pt from "./locales/pt.json";

type Dict = Record<string, string>;

const LOCALES: Record<LangCode, Dict> = {
  en: en as Dict,
  hi: hi as Dict,
  ta: ta as Dict,
  te: te as Dict,
  kn: kn as Dict,
  ml: ml as Dict,
  mr: mr as Dict,
  gu: gu as Dict,
  bn: bn as Dict,
  pa: pa as Dict,
  ja: ja as Dict,
  zh: zh as Dict,
  ar: ar as Dict,
  es: es as Dict,
  fr: fr as Dict,
  de: de as Dict,
  pt: pt as Dict,
};

type I18nCtx = {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
};

const Ctx = createContext<I18nCtx | null>(null);

function resolveInitial(): LangCode {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

function applyDocumentLang(code: LangCode) {
  const meta = LANGUAGES.find((l) => l.code === code);
  document.documentElement.lang = code;
  document.documentElement.dir = meta?.dir === "rtl" ? "rtl" : "ltr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(resolveInitial);

  useEffect(() => {
    applyDocumentLang(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = LOCALES[lang] ?? LOCALES.en;
      let text = dict[key] ?? LOCALES.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.split(`{${k}}`).join(String(v));
        }
      }
      return text;
    },
    [lang],
  );

  const dir: "ltr" | "rtl" =
    LANGUAGES.find((l) => l.code === lang)?.dir === "rtl" ? "rtl" : "ltr";

  const value = useMemo(() => ({ lang, setLang, t, dir }), [lang, setLang, t, dir]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n requires I18nProvider");
  return ctx;
}

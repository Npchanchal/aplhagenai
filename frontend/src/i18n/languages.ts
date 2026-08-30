export type LangCode =
  | "en"
  | "hi"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "mr"
  | "gu"
  | "bn"
  | "pa"
  | "ja"
  | "zh"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "pt";

export type LangMeta = {
  code: LangCode;
  label: string;
  native: string;
  group: "indian" | "global";
  dir?: "ltr" | "rtl";
};

export const LANGUAGES: LangMeta[] = [
  { code: "en", label: "English", native: "English", group: "indian" },
  { code: "hi", label: "Hindi", native: "हिन्दी", group: "indian" },
  { code: "ta", label: "Tamil", native: "தமிழ்", group: "indian" },
  { code: "te", label: "Telugu", native: "తెలుగు", group: "indian" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", group: "indian" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", group: "indian" },
  { code: "mr", label: "Marathi", native: "मराठी", group: "indian" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", group: "indian" },
  { code: "bn", label: "Bengali", native: "বাংলা", group: "indian" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", group: "indian" },
  { code: "ja", label: "Japanese", native: "日本語", group: "global" },
  { code: "zh", label: "Chinese", native: "中文", group: "global" },
  { code: "ar", label: "Arabic", native: "العربية", group: "global", dir: "rtl" },
  { code: "es", label: "Spanish", native: "Español", group: "global" },
  { code: "fr", label: "French", native: "Français", group: "global" },
  { code: "de", label: "German", native: "Deutsch", group: "global" },
  { code: "pt", label: "Portuguese", native: "Português", group: "global" },
];

export const DEFAULT_LANG: LangCode = "en";
export const LANG_STORAGE_KEY = "intellens.lang";

/** Open Graph locale tags (primary market: India). */
export function ogLocaleFor(code: LangCode): string {
  const map: Partial<Record<LangCode, string>> = {
    en: "en_IN",
    hi: "hi_IN",
    ta: "ta_IN",
    te: "te_IN",
    kn: "kn_IN",
    ml: "ml_IN",
    mr: "mr_IN",
    gu: "gu_IN",
    bn: "bn_IN",
    pa: "pa_IN",
    ja: "ja_JP",
    zh: "zh_CN",
    ar: "ar_SA",
    es: "es_ES",
    fr: "fr_FR",
    de: "de_DE",
    pt: "pt_BR",
  };
  return map[code] ?? "en_IN";
}

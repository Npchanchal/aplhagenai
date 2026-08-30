import { useI18n } from "../i18n";
import { LANGUAGES, type LangCode } from "../i18n/languages";

type Props = {
  onChange?: (code: LangCode) => void;
};

export default function LanguageSelect({ onChange }: Props) {
  const { lang, setLang, t } = useI18n();
  const indian = LANGUAGES.filter((l) => l.group === "indian");
  const global = LANGUAGES.filter((l) => l.group === "global");

  return (
    <label className="lang-select" title={t("common.language")}>
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={lang}
        data-testid="language-select"
        onChange={(e) => {
          const code = e.target.value as LangCode;
          setLang(code);
          onChange?.(code);
        }}
        aria-label={t("common.language")}
      >
        <optgroup label={t("lang.group.india")}>
          {indian.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
            </option>
          ))}
        </optgroup>
        <optgroup label={t("lang.group.global")}>
          {global.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

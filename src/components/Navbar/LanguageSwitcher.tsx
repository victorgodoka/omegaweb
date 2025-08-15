import React from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en-US", label: "EN" },
  { code: "pt-BR", label: "PT" },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language.startsWith("pt") ? "pt-BR" : "en-US";

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex gap-2 items-center ml-4">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={`px-2 py-1 rounded text-xs font-bold border transition-colors duration-150
            ${currentLang === lang.code ? "bg-orange-500 text-white border-orange-500" : "bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700"}
          `}
          aria-label={t("language_switch", { language: lang.label })}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;

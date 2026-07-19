import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const LANGUAGE_STORAGE_KEY = "corion-language";

export type Language = "de" | "en" | "ro" | "es" | "tr" | "el";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import de from "./translations/de.json";
import en from "./translations/en.json";
import ro from "./translations/ro.json";
import es from "./translations/es.json";
import tr from "./translations/tr.json";
import el from "./translations/el.json";

const translations: Record<Language, Record<string, string>> = {
  de,
  en,
  ro,
  es,
  tr,
  el,
};

const validLanguages: Language[] = ["de", "en", "ro", "es", "tr", "el"];

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && validLanguages.includes(saved as Language)) {
        return saved as Language;
      }
    }
    return "de";
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translation = translations[language][key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key} in language: ${language}`);
      return translations["de"][key] || key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function applyLanguagePreference(lang?: string | null) {
  if (typeof window === "undefined") return;
  if (!lang) return;
  if (!validLanguages.includes(lang as Language)) return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import en from "./en.json";
import fr from "./fr.json";
import ar from "./ar.json";

type Locale = "ar" | "fr" | "en";
type Messages = typeof en;

const messages: Record<Locale, Messages> = { en, fr, ar } as Record<Locale, Messages>;

type I18nContextType = {
  locale: Locale;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<I18nContextType>({
  locale: "ar",
  t: (k) => k,
  dir: "rtl",
  setLocale: () => {},
});

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const p of parts) {
    if (current && typeof current === "object" && p in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && ["ar", "fr", "en"].includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const t = useCallback((key: string) => getNestedValue(messages[locale] as Record<string, unknown>, key), [locale]);
  const dir: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return (
    <I18nContext.Provider value={{ locale, t, dir, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export type { Locale };
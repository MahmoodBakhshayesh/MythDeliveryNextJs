"use client";

import { NextIntlClientProvider } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import enMessages from "../../messages/en.json";
import faMessages from "../../messages/fa.json";

export type UiLocale = "en" | "fa";

const STORAGE_KEY = "myth-delivery-ui-locale";

const messagesByLocale = {
  en: enMessages,
  fa: faMessages,
} as const;

type LocaleContextValue = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useUiLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useUiLocale must be used within LocaleUiProvider");
  }
  return ctx;
}

export function LocaleUiProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "fa" || stored === "en") setLocaleState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    if (locale === "fa") {
      document.body.style.fontFamily =
        "var(--font-vazirmatn), var(--font-roboto), ui-sans-serif, system-ui, sans-serif";
    } else {
      document.body.style.fontFamily =
        "var(--font-roboto), ui-sans-serif, system-ui, sans-serif";
    }
  }, [locale]);

  const messages = useMemo(() => messagesByLocale[locale], [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

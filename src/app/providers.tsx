"use client";
import { type ReactNode, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { I18nProvider, useI18n } from "@/i18n";

function DirSync() {
  const { dir, locale } = useI18n();
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <DirSync />
        {children}
      </AuthProvider>
    </I18nProvider>
  );
}
"use client";
import { type ReactNode, useEffect, useState } from "react";
import { useI18n } from "@/i18n";

type IdentitySettings = {
  system_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { locale, setLocale, dir } = useI18n();
  const [identity, setIdentity] = useState<IdentitySettings>({});

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d.settings) setIdentity(d.settings);
    }).catch(() => {});
  }, []);

  const primary = identity.primary_color || "#2563eb";
  const secondary = identity.secondary_color || "#7c3aed";
  const systemName = identity.system_name || "CODFlow";

  return (
    <div className="min-h-screen flex" dir={dir}>
      {/* Desktop visual section */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-10"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -start-24 w-96 h-96 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute top-1/3 -end-20 w-80 h-80 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute -bottom-16 start-1/3 w-64 h-64 rounded-full opacity-10" style={{ background: "white" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">{systemName}</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-white text-3xl font-bold leading-tight mb-4">
            {dir === "rtl"
              ? "أدِر عمليات التجارة الإلكترونية من مكان واحد"
              : "Manage your COD e-commerce operations from one place"}
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            {dir === "rtl"
              ? "منصة متكاملة لإدارة الطلبات والتوصيل والفواتير والموظفين"
              : "Complete platform for orders, delivery, invoicing, and team management"}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {(dir === "rtl"
              ? ["إدارة الطلبات", "التتبع المباشر", "الفواتير", "التقارير"]
              : ["Order Management", "Live Tracking", "Invoicing", "Reports"]
            ).map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} {systemName}
        </div>
      </div>

      {/* Right / Form section */}
      <div className="flex-1 flex flex-col bg-white min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            </div>
            <span className="font-bold text-slate-900">{systemName}</span>
          </div>
          <div className="hidden lg:block" />

          {/* Language switcher */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {(["ar", "fr", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLocale(l)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition ${locale === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {l === "ar" ? "ع" : l === "fr" ? "FR" : "EN"}
              </button>
            ))}
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-6 lg:py-10">
          <div className="w-full" style={{ maxWidth: 440 }}>
            {children}
          </div>
        </div>

        {/* Mobile bottom */}
        <div className="lg:hidden text-center px-6 py-4 text-slate-400 text-xs border-t border-slate-100">
          © {new Date().getFullYear()} {systemName}
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

function ModuleIcon({ name }: { name: string }) {
  const p = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor" as const, strokeWidth: "1.8" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactNode> = {
    orders: <svg {...p}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    employees: <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    clients: <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    stores: <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    delivery: <svg {...p}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    distribution: <svg {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
    invoices: <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    finance: <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    reports: <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    notifications: <svg {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    activity: <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>,
    settings: <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  };
  return <>{icons[name] || null}</>;
}

const modules = [
  { href: "/orders", icon: "orders", labelKey: "nav.orders", roles: ["admin", "employee", "client"], tone: "blue" },
  { href: "/stores", icon: "stores", labelKey: "nav.stores", roles: ["admin", "employee", "client"], tone: "violet" },
  { href: "/invoices", icon: "invoices", labelKey: "nav.invoices", roles: ["admin", "employee", "client"], tone: "amber" },
  { href: "/reports", icon: "reports", labelKey: "nav.reports", roles: ["admin", "employee", "client"], tone: "cyan" },
  { href: "/employees", icon: "employees", labelKey: "nav.employees", roles: ["admin"], tone: "indigo" },
  { href: "/clients", icon: "clients", labelKey: "nav.clients", roles: ["admin"], tone: "emerald" },
  { href: "/delivery", icon: "delivery", labelKey: "nav.delivery", roles: ["admin"], tone: "orange" },
  { href: "/distribution", icon: "distribution", labelKey: "nav.distribution", roles: ["admin"], tone: "rose" },
  { href: "/finance", icon: "finance", labelKey: "nav.finance", roles: ["admin"], tone: "green" },
  { href: "/notifications", icon: "notifications", labelKey: "nav.notifications", roles: ["admin", "employee", "client"], tone: "fuchsia" },
  { href: "/activity", icon: "activity", labelKey: "nav.activityLog", roles: ["admin"], tone: "slate" },
  { href: "/settings", icon: "settings", labelKey: "nav.settings", roles: ["admin"], tone: "gray" },
];

export default function DashboardModules({ role }: { role: string }) {
  const { t, dir } = useI18n();
  const visible = modules.filter((item) => item.roles.includes(role));
  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div>
          <h2>{dir === "rtl" ? "مساحات العمل" : "Workspace"}</h2>
          <p>{dir === "rtl" ? "الوصول السريع إلى أقسام النظام" : "Quick access to your main modules"}</p>
        </div>
      </div>
      <div className="module-grid">
        {visible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-label={`${t(item.labelKey)} — ${dir === "rtl" ? "فتح القسم" : "Open section"}`}
            title={dir === "rtl" ? `فتح ${t(item.labelKey)}` : `Open ${t(item.labelKey)}`}
            className={`module-tile module-tone-${item.tone}`}
          >
            <span className="module-icon"><ModuleIcon name={item.icon} /></span>
            <span className="module-label">{t(item.labelKey)}</span>
            <span className="module-open-hint">{dir === "rtl" ? "فتح" : "Open"}</span>
            <span className="module-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

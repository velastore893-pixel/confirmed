"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

const modules = [
  { href: "/orders", icon: "🛒", labelKey: "nav.orders", roles: ["admin", "employee", "client"], tone: "indigo" },
  { href: "/stores", icon: "🏪", labelKey: "nav.stores", roles: ["admin", "employee", "client"], tone: "violet" },
  { href: "/invoices", icon: "🧾", labelKey: "nav.invoices", roles: ["admin", "employee", "client"], tone: "amber" },
  { href: "/reports", icon: "📊", labelKey: "nav.reports", roles: ["admin", "employee", "client"], tone: "cyan" },
  { href: "/notifications", icon: "🔔", labelKey: "nav.notifications", roles: ["admin", "employee", "client"], tone: "rose" },
];

export default function DashboardModules({ role }: { role: string }) {
  const { t, dir } = useI18n();
  const visible = modules.filter((item) => item.roles.includes(role));

  return (
    <section className="codflow-panel">
      <div className="codflow-panel-heading">
        <div>
          <span className="codflow-eyebrow">{dir === "rtl" ? "المساحات" : "Workspace"}</span>
          <h2>{dir === "rtl" ? "الوصول السريع" : "Quick access"}</h2>
          <p>{dir === "rtl" ? "الوصول إلى أهم أقسام حسابك." : "Open the main areas of your account."}</p>
        </div>
      </div>

      <div className="codflow-quick-grid">
        {visible.map((item) => (
          <Link key={item.href} href={item.href} className={`codflow-quick-card tone-${item.tone}`}>
            <span className="codflow-quick-icon">{item.icon}</span>
            <b>{t(item.labelKey)}</b>
            <small>{dir === "rtl" ? "فتح القسم" : "Open"}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}


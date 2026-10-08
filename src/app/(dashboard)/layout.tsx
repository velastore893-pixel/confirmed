"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/i18n";
import Link from "next/link";

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: "1.9" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<string, React.ReactNode> = {
    dashboard: <svg {...p}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/></svg>,
    orders: <svg {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    employees: <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    clients: <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    stores: <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
    delivery: <svg {...p}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    distribution: <svg {...p}><path d="M17 3h4v4"/><path d="M3 17v4h4"/><path d="M21 7l-6.4 6.4a2 2 0 0 1-2.8 0L10.6 12a2 2 0 0 0-2.8 0L3 16.8"/></svg>,
    invoices: <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></svg>,
    finance: <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.8-.7-1.8-1-3-1-1.7 0-3 1-3 2.4 0 3.6 6 1.7 6 5.1 0 1.4-1.3 2.5-3.2 2.5-1.3 0-2.4-.4-3.3-1.2"/><path d="M12.5 5.5v13"/></svg>,
    reports: <svg {...p}><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>,
    notifications: <svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>,
    activity: <svg {...p}><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>,
    settings: <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.4 1z"/></svg>,
    logout: <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>,
    menu: <svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
    close: <svg {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
    chevron: <svg {...p}><path d="m9 18 6-6-6-6"/></svg>,
  };

  return <>{icons[name] || null}</>;
}

const navItems = [
  { href: "/", icon: "dashboard", labelKey: "nav.dashboard", roles: ["admin", "employee", "client"] },
  { href: "/orders", icon: "orders", labelKey: "nav.orders", roles: ["admin", "employee", "client"] },
  { href: "/stores", icon: "stores", labelKey: "nav.stores", roles: ["admin", "employee", "client"] },
  { href: "/invoices", icon: "invoices", labelKey: "nav.invoices", roles: ["admin", "employee", "client"] },
  { href: "/reports", icon: "reports", labelKey: "nav.reports", roles: ["admin", "employee", "client"] },
  { href: "/employees", icon: "employees", labelKey: "nav.employees", roles: ["admin"] },
  { href: "/clients", icon: "clients", labelKey: "nav.clients", roles: ["admin"] },
  { href: "/delivery", icon: "delivery", labelKey: "nav.delivery", roles: ["admin"] },
  { href: "/distribution", icon: "distribution", labelKey: "nav.distribution", roles: ["admin"] },
  { href: "/finance", icon: "finance", labelKey: "nav.finance", roles: ["admin"] },
  { href: "/notifications", icon: "notifications", labelKey: "nav.notifications", roles: ["admin", "employee", "client"] },
  { href: "/activity", icon: "activity", labelKey: "nav.activityLog", roles: ["admin"] },
  { href: "/settings", icon: "settings", labelKey: "nav.settings", roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t, locale, setLocale, dir } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications?unread=true")
      .then((r) => r.json())
      .then((d) => setNotifCount(d.unread || 0))
      .catch(() => {});
  }, [user, pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f5f7fb]">
        <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));
  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="codflow-app-shell" dir={dir}>
      {mobileMenuOpen && (
        <button
          aria-label="Close menu"
          className="codflow-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`codflow-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
        <div className="codflow-sidebar-brand">
          <Link href="/" className="codflow-brand-link">
            <span className="codflow-brand-mark">CF</span>
            <span className="codflow-brand-copy">
              <b>CODFlow</b>
              <small>{dir === "rtl" ? "إدارة عمليات COD" : locale === "fr" ? "Opérations COD" : "COD operations"}</small>
            </span>
          </Link>
          <button
            type="button"
            className="codflow-sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="codflow-sidebar-label">
          {dir === "rtl" ? "مساحة العمل" : locale === "fr" ? "Espace de travail" : "Workspace"}
        </div>

        <nav className="codflow-sidebar-nav">
          {filteredNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`codflow-nav-link ${active ? "is-active" : ""}`}
              >
                <span className="codflow-nav-icon">
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="codflow-nav-text">{t(item.labelKey)}</span>
                {item.href === "/notifications" && notifCount > 0 && (
                  <span className="codflow-nav-badge">{notifCount > 99 ? "99+" : notifCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="codflow-sidebar-bottom">
          <div className="codflow-sidebar-profile">
            <span className="codflow-avatar">{initials}</span>
            <span className="min-w-0">
              <b className="block truncate">{user.firstName} {user.lastName}</b>
              <small className="block truncate">{user.email}</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="codflow-main-shell">
        <header className="codflow-topbar">
          <div className="codflow-topbar-inner">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="codflow-mobile-menu-button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation"
              >
                <Icon name="menu" size={21} />
              </button>

              <div className="codflow-page-crumb">
                <span>{dir === "rtl" ? "CODFlow" : "CODFlow"}</span>
                <Icon name="chevron" size={14} />
                <b>{t(filteredNav.find((item) =>
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                )?.labelKey || "nav.dashboard")}</b>
              </div>
            </div>

            <div className="codflow-topbar-actions">
              <div className="codflow-lang-switch">
                {(["ar", "fr", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={locale === l ? "is-active" : ""}
                  >
                    {l === "ar" ? "ع" : l.toUpperCase()}
                  </button>
                ))}
              </div>

              <Link href="/notifications" className="codflow-topbar-icon" aria-label="Notifications">
                <Icon name="notifications" size={19} />
                {notifCount > 0 && <span>{notifCount > 9 ? "9+" : notifCount}</span>}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  className="codflow-user-button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <span className="codflow-avatar">{initials}</span>
                  <span className="codflow-user-copy">
                    <b>{user.firstName}</b>
                    <small>{user.role}</small>
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="codflow-user-menu">
                    <div className="codflow-user-menu-head">
                      <b>{user.firstName} {user.lastName}</b>
                      <span>{user.email}</span>
                    </div>

                    {user.role === "admin" && (
                      <Link href="/settings">
                        <Icon name="settings" size={16} />
                        {t("nav.settings")}
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                    >
                      <Icon name="logout" size={16} />
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="codflow-main-content">{children}</main>
      </div>

      <nav className="codflow-mobile-bottom-nav">
        {filteredNav
          .filter((item) => ["/", "/orders", "/stores", "/notifications"].includes(item.href))
          .map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} className={active ? "is-active" : ""}>
                <Icon name={item.icon} size={19} />
                <span>{t(item.labelKey)}</span>
                {item.href === "/notifications" && notifCount > 0 && <b>{notifCount > 9 ? "9+" : notifCount}</b>}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}

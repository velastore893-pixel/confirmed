"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/i18n";
import Link from "next/link";

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor" as const, strokeWidth: "1.8" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactNode> = {
    dashboard: <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
    orders: <svg {...p}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    employees: <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    clients: <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    stores: <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    delivery: <svg {...p}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    distribution: <svg {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
    invoices: <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    finance: <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    reports: <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    notifications: <svg {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    activity: <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    settings: <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    logout: <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    onboarding: <svg {...p}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    apps: <svg {...p}><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="15" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/></svg>,
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
  const [appsOpen, setAppsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications?unread=true").then(r => r.json()).then(d => setNotifCount(d.unread || 0)).catch(() => {});
    }
  }, [user, pathname]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" style={{ borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16">
        <div className="max-w-[1280px] mx-auto h-full flex items-center gap-3 px-4 lg:px-6">
          {/* Mobile menu button */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? "close" : "menu"} size={22} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            </div>
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-extrabold text-slate-950 text-[15px] tracking-tight">COD<span className="text-indigo-600">Flow</span></span>
              <span className="text-[9px] text-slate-400 mt-1 font-medium">{dir === "rtl" ? "إدارة عمليات COD" : "COD operations"}</span>
            </span>
          </Link>

          <div className="flex-1" />

          {/* App launcher - replaces the crowded desktop nav */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setAppsOpen(!appsOpen)}
              className="header-icon-button"
              aria-label={dir === "rtl" ? "أقسام النظام" : "App launcher"}
            >
              <Icon name="apps" size={19} />
            </button>
            {appsOpen && (
              <div className="absolute top-full end-0 mt-2 w-[360px] bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50" onClick={() => setAppsOpen(false)}>
                <div className="px-2 pb-2 text-xs font-semibold text-slate-400">{dir === "rtl" ? "أقسام النظام" : "Workspace"}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {filteredNav.map(item => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link key={item.href} href={item.href}
                        className={`flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-[11px] font-semibold transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                        <span className={isActive ? "text-indigo-600" : "text-slate-400"}><Icon name={item.icon} size={20} /></span>
                        <span className="leading-tight">{t(item.labelKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Language */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {(["ar", "fr", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLocale(l)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${locale === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {l === "ar" ? "ع" : l === "fr" ? "FR" : "EN"}
              </button>
            ))}
          </div>

          {/* Notifications */}
          <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <Icon name="notifications" size={20} />
            {notifCount > 0 && (
              <span className="absolute top-0.5 end-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>

          {/* User menu */}
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden md:block">{user.firstName}</span>
            </button>
            {userMenuOpen && (
              <div className="absolute top-full end-0 mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50" onClick={() => setUserMenuOpen(false)}>
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                {user.role === "admin" && (
                  <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    <Icon name="settings" size={16} /> {t("nav.settings")}
                  </Link>
                )}
                <button onClick={() => { logout(); router.push("/login"); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <Icon name="logout" size={16} /> {t("nav.logout")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full inset-x-0 bg-white border-b border-slate-200 shadow-lg max-h-[70vh] overflow-y-auto z-50">
            <nav className="p-3 grid grid-cols-2 gap-1">
              {filteredNav.map(item => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
                    <span className={isActive ? "text-blue-600" : "text-slate-400"}><Icon name={item.icon} size={16} /></span>
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main content - centered */}
      <main className="max-w-[1360px] mx-auto px-4 lg:px-7 py-5 lg:py-8 pb-24 lg:pb-8">
        {children}
      </main>

      {/* Mobile bottom navigation: every item is a real route */}
      <nav className="mobile-bottom-nav lg:hidden" aria-label={dir === "rtl" ? "التنقل الرئيسي" : "Primary navigation"}>
        {filteredNav.filter(item => ["/", "/orders", "/stores", "/notifications"].includes(item.href)).map(item => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`mobile-bottom-link ${isActive ? "active" : ""}`}>
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
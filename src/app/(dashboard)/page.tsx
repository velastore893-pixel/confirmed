"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import dynamic from "next/dynamic";
import AgentCard from "@/components/AgentCard";
import DashboardModules from "@/components/DashboardModules";

const OrdersChart = dynamic(() => import("@/components/charts/OrdersChart"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-slate-50 rounded-2xl animate-pulse" />,
});

const StatusPieChart = dynamic(() => import("@/components/charts/StatusPieChart"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-slate-50 rounded-2xl animate-pulse" />,
});

type Agent = {
  name: string;
  email?: string;
  orders: number;
  confirmed: number;
  delivered: number;
  returned: number;
  noAnswer: number;
  cancelled: number;
  pending: number;
};

type DashboardData = {
  ordersToday: number;
  confirmedToday: number;
  deliveredToday: number;
  returnedToday: number;
  revenue: string;
  outstanding: string;
  unreadNotifications: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    userName: string;
  }>;
  topEmployees: Agent[];
  statusBreakdown: Record<string, number>;
  totalOrders: number;
  confirmationRate: string;
  deliveryRate: string;
  returnRate: string;
  ordersByDate: Array<{
    date: string;
    total: number;
    confirmed: number;
    delivered: number;
    returned: number;
  }>;
  scheduledCallbacks: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    customerName: string | null;
    customerPhone: string | null;
    scheduledDate: string;
    notes: string | null;
    employeeName: string | null;
  }>;
};

type AdminModule = {
  href: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  tone: string;
};

const adminModules: AdminModule[] = [
  { href: "/orders", labelAr: "الطلبات", labelFr: "Commandes", labelEn: "Orders", icon: "🛒", tone: "indigo" },
  { href: "/clients", labelAr: "العملاء", labelFr: "Clients", labelEn: "Clients", icon: "👤", tone: "emerald" },
  { href: "/employees", labelAr: "الموظفون", labelFr: "Employés", labelEn: "Employees", icon: "👥", tone: "violet" },
  { href: "/stores", labelAr: "المتاجر", labelFr: "Boutiques", labelEn: "Stores", icon: "🏪", tone: "amber" },
  { href: "/delivery", labelAr: "التوصيل", labelFr: "Livraison", labelEn: "Delivery", icon: "🚚", tone: "cyan" },
  { href: "/invoices", labelAr: "الفواتير", labelFr: "Factures", labelEn: "Invoices", icon: "🧾", tone: "rose" },
  { href: "/reports", labelAr: "التقارير", labelFr: "Rapports", labelEn: "Reports", icon: "📊", tone: "blue" },
  { href: "/settings", labelAr: "الإعدادات", labelFr: "Paramètres", labelEn: "Settings", icon: "⚙️", tone: "slate" },
];

export default function DashboardPage() {
  const { t, locale, dir } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (user?.role === "client") {
      fetch("/api/onboarding/profile")
        .then((r) => r.json())
        .then((d) => {
          if (d.client && !d.client.onboardingComplete) router.replace("/onboarding");
        })
        .catch(() => {});
    }
  }, [user, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom" && customFrom && customTo) {
        params.set("dateFrom", customFrom);
        params.set("dateTo", customTo);
      }
      const res = await fetch(`/api/dashboard?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periods = [
    { key: "today", label: dir === "rtl" ? "اليوم" : locale === "fr" ? "Aujourd'hui" : "Today" },
    { key: "yesterday", label: dir === "rtl" ? "أمس" : locale === "fr" ? "Hier" : "Yesterday" },
    { key: "week", label: dir === "rtl" ? "الأسبوع" : locale === "fr" ? "Semaine" : "Week" },
    { key: "month", label: dir === "rtl" ? "الشهر" : locale === "fr" ? "Mois" : "Month" },
    { key: "year", label: dir === "rtl" ? "السنة" : locale === "fr" ? "Année" : "Year" },
    { key: "custom", label: dir === "rtl" ? "مخصص" : locale === "fr" ? "Personnalisé" : "Custom" },
  ];

  const moduleLabel = (module: AdminModule) =>
    dir === "rtl" ? module.labelAr : locale === "fr" ? module.labelFr : module.labelEn;

  const agentLabels = {
    active: dir === "rtl" ? "نشط" : "Active",
    assigned: dir === "rtl" ? "الطلبات" : "Assigned",
    confirmed: dir === "rtl" ? "مؤكدة" : "Confirmed",
    delivered: dir === "rtl" ? "مسلمة" : "Delivered",
    noAnswer: dir === "rtl" ? "لا رد" : "No Answer",
    pending: dir === "rtl" ? "قيد الانتظار" : "Pending",
    returns: dir === "rtl" ? "مرتجعة" : "Returns",
    confirmRate: dir === "rtl" ? "نسبة التأكيد" : "Confirmation",
    deliveryRate: dir === "rtl" ? "نسبة التوصيل" : "Delivery",
  };

  if (loading) return <DashboardLoading />;
  if (!data) return null;

  const kpis = [
    {
      icon: "🛒",
      label: dir === "rtl" ? "إجمالي الطلبات" : locale === "fr" ? "Total commandes" : "Total orders",
      value: data.ordersToday,
      meta: dir === "rtl" ? "خلال الفترة المحددة" : locale === "fr" ? "Période sélectionnée" : "Selected period",
      tone: "indigo",
    },
    {
      icon: "✓",
      label: dir === "rtl" ? "الطلبات المؤكدة" : locale === "fr" ? "Commandes confirmées" : "Confirmed orders",
      value: data.confirmedToday,
      meta: `${data.confirmationRate}%`,
      tone: "emerald",
    },
    {
      icon: "🚚",
      label: dir === "rtl" ? "تم التوصيل" : locale === "fr" ? "Livrées" : "Delivered",
      value: data.deliveredToday,
      meta: `${data.deliveryRate}%`,
      tone: "violet",
    },
    {
      icon: "↩",
      label: dir === "rtl" ? "المرتجعات" : locale === "fr" ? "Retours" : "Returns",
      value: data.returnedToday,
      meta: `${data.returnRate}%`,
      tone: "rose",
    },
    {
      icon: "MAD",
      label: dir === "rtl" ? "الإيرادات" : locale === "fr" ? "Revenus" : "Revenue",
      value: formatCurrency(data.revenue, locale),
      meta: dir === "rtl" ? "فواتير العملاء" : locale === "fr" ? "Factures clients" : "Client invoices",
      tone: "amber",
    },
    {
      icon: "…",
      label: dir === "rtl" ? "المستحقات" : locale === "fr" ? "Impayés" : "Outstanding",
      value: formatCurrency(data.outstanding, locale),
      meta: data.unreadNotifications > 0
        ? `${data.unreadNotifications} ${dir === "rtl" ? "تنبيهات" : locale === "fr" ? "alertes" : "alerts"}`
        : dir === "rtl" ? "لا تنبيهات" : locale === "fr" ? "Aucune alerte" : "No alerts",
      tone: "cyan",
    },
  ];

  return (
    <div className="codflow-dashboard">
      <section className="codflow-dashboard-hero">
        <div>
          <span className="codflow-eyebrow">
            {dir === "rtl" ? "نظرة عامة" : locale === "fr" ? "Vue d'ensemble" : "Overview"}
          </span>
          <h1>
            {dir === "rtl"
              ? `مرحباً، ${user?.firstName || ""}`
              : locale === "fr"
              ? `Bonjour, ${user?.firstName || ""}`
              : `Welcome, ${user?.firstName || ""}`}
          </h1>
          <p>
            {dir === "rtl"
              ? "تابع الطلبات، أداء الفريق، التوصيل والمالية من لوحة واحدة."
              : locale === "fr"
              ? "Suivez les commandes, l'équipe, la livraison et les finances depuis un seul tableau."
              : "Track orders, team performance, delivery and finance from one dashboard."}
          </p>
        </div>

        <div className="codflow-live-chip">
          <span />
          {dir === "rtl" ? "بيانات مباشرة" : locale === "fr" ? "Données en direct" : "Live data"}
        </div>
      </section>

      <section className="codflow-filter-bar">
        <div className="codflow-periods">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              className={period === p.key ? "is-active" : ""}
              onClick={() => {
                setPeriod(p.key);
                setShowCustom(p.key === "custom");
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {showCustom && (
          <div className="codflow-custom-dates">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span>→</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            <button type="button" onClick={fetchData}>
              {dir === "rtl" ? "تطبيق" : locale === "fr" ? "Appliquer" : "Apply"}
            </button>
          </div>
        )}
      </section>

      <section className="codflow-kpi-grid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`codflow-kpi codflow-kpi-${kpi.tone}`}>
            <div className="codflow-kpi-top">
              <span className="codflow-kpi-icon">{kpi.icon}</span>
              <span className="codflow-kpi-label">{kpi.label}</span>
            </div>
            <div className="codflow-kpi-value">{kpi.value}</div>
            <div className="codflow-kpi-meta">{kpi.meta}</div>
          </article>
        ))}
      </section>

      {user?.role === "admin" ? (
        <section className="codflow-panel">
          <div className="codflow-panel-heading">
            <div>
              <span className="codflow-eyebrow">
                {dir === "rtl" ? "اختصارات" : locale === "fr" ? "Raccourcis" : "Shortcuts"}
              </span>
              <h2>{dir === "rtl" ? "الوصول السريع" : locale === "fr" ? "Accès rapide" : "Quick access"}</h2>
              <p>
                {dir === "rtl"
                  ? "أهم الأقسام التي تستعملها في العمل اليومي."
                  : locale === "fr"
                  ? "Les sections principales pour vos opérations quotidiennes."
                  : "The core areas you use in daily operations."}
              </p>
            </div>
            <Link href="/settings" className="codflow-text-link">
              {dir === "rtl" ? "إدارة النظام" : locale === "fr" ? "Gérer le système" : "Manage system"} ↗
            </Link>
          </div>

          <div className="codflow-quick-grid">
            {adminModules.map((module) => (
              <Link key={module.href} href={module.href} className={`codflow-quick-card tone-${module.tone}`}>
                <span className="codflow-quick-icon">{module.icon}</span>
                <b>{moduleLabel(module)}</b>
                <small>{dir === "rtl" ? "فتح القسم" : locale === "fr" ? "Ouvrir" : "Open"}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <DashboardModules role={user?.role || "client"} />
      )}

      <section className="codflow-analytics-grid">
        <article className="codflow-panel codflow-chart-panel">
          <div className="codflow-panel-heading compact">
            <div>
              <span className="codflow-eyebrow">{dir === "rtl" ? "التحليل الزمني" : locale === "fr" ? "Tendance" : "Trend"}</span>
              <h2>{dir === "rtl" ? "اتجاه الطلبات" : locale === "fr" ? "Évolution des commandes" : "Orders trend"}</h2>
            </div>
          </div>
          <OrdersChart data={data.ordersByDate || []} locale={locale} dir={dir} />
        </article>

        <article className="codflow-panel codflow-chart-panel">
          <div className="codflow-panel-heading compact">
            <div>
              <span className="codflow-eyebrow">{dir === "rtl" ? "الحالات" : locale === "fr" ? "Statuts" : "Statuses"}</span>
              <h2>{dir === "rtl" ? "توزيع الحالات" : locale === "fr" ? "Répartition des statuts" : "Status distribution"}</h2>
            </div>
          </div>
          <StatusPieChart data={data.statusBreakdown || {}} t={t} />
        </article>
      </section>

      {user?.role === "admin" && data.topEmployees?.length > 0 && (
        <section className="codflow-panel">
          <div className="codflow-panel-heading">
            <div>
              <span className="codflow-eyebrow">{dir === "rtl" ? "الفريق" : locale === "fr" ? "Équipe" : "Team"}</span>
              <h2>{dir === "rtl" ? "أداء الموظفين" : locale === "fr" ? "Performance des employés" : "Employee performance"}</h2>
              <p>
                {dir === "rtl"
                  ? "مقارنة مباشرة لنسب التأكيد والتوصيل."
                  : locale === "fr"
                  ? "Comparaison directe des taux de confirmation et de livraison."
                  : "A direct comparison of confirmation and delivery rates."}
              </p>
            </div>
          </div>
          <div className="codflow-agent-grid">
            {data.topEmployees.map((agent, i) => (
              <AgentCard key={`${agent.email || agent.name}-${i}`} agent={agent} index={i} labels={agentLabels} />
            ))}
          </div>
        </section>
      )}

      <section className="codflow-bottom-grid">
        <article className="codflow-panel">
          <div className="codflow-panel-heading compact">
            <div>
              <span className="codflow-eyebrow">{dir === "rtl" ? "النشاط" : locale === "fr" ? "Activité" : "Activity"}</span>
              <h2>{dir === "rtl" ? "آخر النشاطات" : locale === "fr" ? "Activité récente" : "Recent activity"}</h2>
            </div>
            <Link href="/activity" className="codflow-text-link">
              {dir === "rtl" ? "عرض الكل" : locale === "fr" ? "Voir tout" : "View all"}
            </Link>
          </div>

          <div className="codflow-activity-list">
            {data.recentActivity?.length ? (
              data.recentActivity.slice(0, 6).map((act) => (
                <div key={act.id} className="codflow-activity-row">
                  <span className="codflow-activity-dot" />
                  <div className="min-w-0">
                    <b>{act.userName || "System"}</b>
                    <span>{translateAction(act.action, dir, locale)}</span>
                  </div>
                  <time>
                    {act.createdAt
                      ? new Date(act.createdAt).toLocaleTimeString(
                          locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA",
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : ""}
                  </time>
                </div>
              ))
            ) : (
              <div className="codflow-empty-state">
                {dir === "rtl" ? "لا توجد نشاطات حديثة" : locale === "fr" ? "Aucune activité récente" : "No recent activity"}
              </div>
            )}
          </div>
        </article>

        <article className="codflow-panel">
          <div className="codflow-panel-heading compact">
            <div>
              <span className="codflow-eyebrow">{dir === "rtl" ? "المتابعة" : locale === "fr" ? "Suivi" : "Follow-up"}</span>
              <h2>{dir === "rtl" ? "المكالمات المجدولة" : locale === "fr" ? "Rappels planifiés" : "Scheduled calls"}</h2>
            </div>
            <Link href="/orders?status=callback" className="codflow-text-link">
              {dir === "rtl" ? "فتح الطلبات" : locale === "fr" ? "Ouvrir" : "Open"}
            </Link>
          </div>

          <div className="codflow-callback-list">
            {data.scheduledCallbacks?.length ? (
              data.scheduledCallbacks.slice(0, 5).map((cb) => {
                const when = new Date(cb.scheduledDate);
                const isOverdue = when.getTime() < Date.now();
                return (
                  <Link key={cb.id} href={`/orders?open=${cb.orderId}`} className="codflow-callback-row">
                    <span className={`codflow-phone-chip ${isOverdue ? "is-overdue" : ""}`}>☎</span>
                    <div className="min-w-0">
                      <b>#{cb.orderNumber} · {cb.customerName || (dir === "rtl" ? "زبون" : "Customer")}</b>
                      <small>{cb.customerPhone || cb.employeeName || ""}</small>
                    </div>
                    <div className="codflow-callback-time">
                      <b>{when.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA", { day: "2-digit", month: "short" })}</b>
                      <small>{when.toLocaleTimeString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA", { hour: "2-digit", minute: "2-digit" })}</small>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="codflow-empty-state">
                {dir === "rtl" ? "لا توجد مكالمات مجدولة حالياً" : locale === "fr" ? "Aucun rappel planifié" : "No scheduled calls"}
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="codflow-dashboard">
      <div className="h-24 rounded-3xl bg-white border border-slate-200 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 rounded-3xl bg-white border border-slate-200 animate-pulse" />)}
      </div>
      <div className="grid lg:grid-cols-[1.5fr_.8fr] gap-4">
        <div className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse" />
        <div className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

function translateAction(action: string, dir: string, locale: string): string {
  const isAr = dir === "rtl";
  const isFr = locale === "fr";
  const map: Record<string, { ar: string; fr: string; en: string }> = {
    "system.seeded": { ar: "تم إعداد النظام", fr: "Système initialisé", en: "System initialized" },
    "store.activated": { ar: "تم تفعيل المتجر", fr: "Boutique activée", en: "Store activated" },
    "store.updated": { ar: "تم تحديث المتجر", fr: "Boutique mise à jour", en: "Store updated" },
    "store.created": { ar: "تم إنشاء متجر جديد", fr: "Nouvelle boutique créée", en: "New store created" },
    "store.submitted": { ar: "تم تقديم المتجر للمراجعة", fr: "Boutique soumise pour révision", en: "Store submitted for review" },
    "order.created": { ar: "تم إنشاء طلب جديد", fr: "Nouvelle commande créée", en: "New order created" },
    "order.updated": { ar: "تم تحديث الطلب", fr: "Commande mise à jour", en: "Order updated" },
    "order.transferred": { ar: "تم نقل الطلب", fr: "Commande transférée", en: "Order transferred" },
    "invoice.created": { ar: "تم إنشاء فاتورة", fr: "Facture créée", en: "Invoice created" },
    "invoice.approved": { ar: "تمت الموافقة على الفاتورة", fr: "Facture approuvée", en: "Invoice approved" },
    "invoice.paid": { ar: "تم دفع الفاتورة", fr: "Facture payée", en: "Invoice paid" },
    "payment.created": { ar: "تم تسجيل دفعة", fr: "Paiement enregistré", en: "Payment recorded" },
    "payment.verified": { ar: "تم التحقق من الدفعة", fr: "Paiement vérifié", en: "Payment verified" },
    "store.activate": { ar: "تم تفعيل المتجر", fr: "Boutique activée", en: "Store activated" },
    "store.reject": { ar: "تم رفض المتجر", fr: "Boutique rejetée", en: "Store rejected" },
  };
  const entry = map[action];
  return entry ? (isAr ? entry.ar : isFr ? entry.fr : entry.en) : action.replace(/[._]/g, " ");
}


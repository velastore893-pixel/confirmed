"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import dynamic from "next/dynamic";
import AgentCard from "@/components/AgentCard";
import DashboardModules from "@/components/DashboardModules";

const OrdersChart = dynamic(() => import("@/components/charts/OrdersChart"), { ssr: false, loading: () => <div className="h-[280px] bg-slate-50 rounded-xl animate-pulse" /> });
const StatusPieChart = dynamic(() => import("@/components/charts/StatusPieChart"), { ssr: false, loading: () => <div className="h-[280px] bg-slate-50 rounded-xl animate-pulse" /> });

type Agent = {
  name: string; email?: string; orders: number; confirmed: number;
  delivered: number; returned: number; noAnswer: number; cancelled: number; pending: number;
};
type DashboardData = {
  ordersToday: number; confirmedToday: number; deliveredToday: number; returnedToday: number;
  revenue: string; outstanding: string; unreadNotifications: number;
  recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: string; userName: string }>;
  topEmployees: Agent[];
  statusBreakdown: Record<string, number>;
  totalOrders: number; confirmationRate: string; deliveryRate: string; returnRate: string;
  ordersByDate: Array<{ date: string; total: number; confirmed: number; delivered: number; returned: number }>;
  scheduledCallbacks: Array<{
    id: string; orderId: string; orderNumber: string; customerName: string | null; customerPhone: string | null;
    scheduledDate: string; notes: string | null; employeeName: string | null;
  }>;
};


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
      fetch("/api/onboarding/profile").then(r => r.json()).then(d => {
        if (d.client && !d.client.onboardingComplete) router.replace("/onboarding");
      }).catch(() => {});
    }
  }, [user, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom" && customFrom && customTo) { params.set("dateFrom", customFrom); params.set("dateTo", customTo); }
      const res = await fetch(`/api/dashboard?${params}`);
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  }, [period, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const periods = [
    { key: "today", label: dir === "rtl" ? "اليوم" : locale === "fr" ? "Aujourd'hui" : "Today" },
    { key: "yesterday", label: dir === "rtl" ? "أمس" : locale === "fr" ? "Hier" : "Yesterday" },
    { key: "week", label: dir === "rtl" ? "الأسبوع" : locale === "fr" ? "Semaine" : "This Week" },
    { key: "month", label: dir === "rtl" ? "الشهر" : locale === "fr" ? "Mois" : "This Month" },
    { key: "year", label: dir === "rtl" ? "السنة" : locale === "fr" ? "Année" : "This Year" },
    { key: "custom", label: dir === "rtl" ? "مخصص" : locale === "fr" ? "Personnalisé" : "Custom" },
  ];

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

  return (
    <div className="dashboard-shell">
      <div className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">{dir === "rtl" ? "لوحة العمليات" : locale === "fr" ? "Centre des opérations" : "Operations center"}</p>
          <h1>{dir === "rtl" ? `مرحبا، ${user?.firstName || ""}` : locale === "fr" ? `Bonjour, ${user?.firstName || ""}` : `Welcome, ${user?.firstName || ""}`}</h1>
          <p>{dir === "rtl" ? "راقب الطلبات، أداء الفريق، التوصيل والمالية من مكان واحد." : locale === "fr" ? "Suivez les commandes, l’équipe, la livraison et les finances depuis un seul endroit." : "Track orders, team performance, delivery and finance from one place."}</p>
        </div>
        <div className="hero-chip">
          <span className="hero-chip-dot" />
          {dir === "rtl" ? "البيانات مباشرة" : locale === "fr" ? "Données en direct" : "Live data"}
        </div>
      </div>

      {/* ─── Row 1: Date Selector ──────────────────────── */}
      <div className="date-filter-wrap">
        <div className="date-filter-scroll">
        <div className="date-filter">
          {periods.map(p => (
            <button key={p.key} onClick={() => { setPeriod(p.key); setShowCustom(p.key === "custom"); }}
              className={`date-filter-button ${period === p.key ? "active" : ""}`}>
              {p.label}
            </button>
          ))}
        </div>
        </div>
        {showCustom && (
          <div className="custom-date-row">
            <input type="date" className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs" value={customFrom} onChange={e => setCustomFrom(e.target.value)} dir="ltr" />
            <span className="text-xs text-slate-400">→</span>
            <input type="date" className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs" value={customTo} onChange={e => setCustomTo(e.target.value)} dir="ltr" />
            <button className="btn btn-primary btn-sm" onClick={fetchData}>{dir === "rtl" ? "تطبيق" : "Apply"}</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
          </div>
          <div className="grid lg:grid-cols-2 gap-4"><div className="h-80 bg-white rounded-xl border animate-pulse" /><div className="h-80 bg-white rounded-xl border animate-pulse" /></div>
        </div>
      ) : data ? (
        <>
          {/* ─── Row 2: KPI Summary ────────────────────── */}
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <h2>{dir === "rtl" ? "ملخص الأداء" : locale === "fr" ? "Résumé des performances" : "Performance overview"}</h2>
                <p>{dir === "rtl" ? "أهم الأرقام للفترة المحددة" : locale === "fr" ? "Les indicateurs clés de la période sélectionnée" : "Key metrics for the selected period"}</p>
              </div>
              <div className="rate-pills">
                <span><b>{data.confirmationRate}%</b> {dir === "rtl" ? "تأكيد" : "Confirmation"}</span>
                <span><b>{data.deliveryRate}%</b> {dir === "rtl" ? "توصيل" : "Delivery"}</span>
                <span className="danger"><b>{data.returnRate}%</b> {dir === "rtl" ? "إرجاع" : "Returns"}</span>
              </div>
            </div>
            <div className="kpi-grid">
              {[
                { tone: "indigo", label: dir === "rtl" ? "الطلبات" : "Orders", value: data.ordersToday, helper: dir === "rtl" ? "إجمالي الطلبات" : "Total orders" },
                { tone: "emerald", label: dir === "rtl" ? "مؤكدة" : "Confirmed", value: data.confirmedToday, helper: `${data.confirmationRate}%` },
                { tone: "violet", label: dir === "rtl" ? "مسلمة" : "Delivered", value: data.deliveredToday, helper: `${data.deliveryRate}%` },
                { tone: "rose", label: dir === "rtl" ? "مرتجعة" : "Returned", value: data.returnedToday, helper: `${data.returnRate}%` },
                { tone: "amber", label: dir === "rtl" ? "الإيرادات" : "Revenue", value: formatCurrency(data.revenue, locale), helper: dir === "rtl" ? "فواتير العملاء" : "Client invoices" },
                { tone: "cyan", label: dir === "rtl" ? "المستحقات" : "Outstanding", value: formatCurrency(data.outstanding, locale), helper: data.unreadNotifications > 0 ? `${data.unreadNotifications} ${dir === "rtl" ? "تنبيهات" : "alerts"}` : (dir === "rtl" ? "لا تنبيهات" : "No alerts") },
              ].map((kpi, i) => (
                <div key={i} className={`kpi-card kpi-tone-${kpi.tone}`}>
                  <div className="kpi-topline"><span className="kpi-dot"/><span className="kpi-label">{kpi.label}</span></div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="kpi-helper">{kpi.helper}</div>
                </div>
              ))}
            </div>
          </section>

          <DashboardModules role={user?.role || "client"} />

          {/* Scheduled callbacks are operational data and are visible to the merchant/client too. */}
          {(user?.role === "client" || user?.role === "employee") && (
            <section className="dashboard-section">
              <div className="analytics-card">
                <div className="card-header flex items-center justify-between gap-3">
                  <div>
                    <span>{dir === "rtl" ? "المكالمات المجدولة" : locale === "fr" ? "Rappels planifiés" : "Scheduled Calls"}</span>
                    <p className="text-xs text-slate-400 mt-1">
                      {dir === "rtl" ? "مواعيد إعادة الاتصال المرتبطة بطلباتك" : locale === "fr" ? "Rappels clients liés à vos commandes" : "Customer callbacks linked to your orders"}
                    </p>
                  </div>
                  <a href="/orders?status=callback" className="btn btn-secondary btn-sm">
                    {dir === "rtl" ? "عرض الكل" : locale === "fr" ? "Voir tout" : "View all"}
                  </a>
                </div>
                {data.scheduledCallbacks?.length ? (
                  <div className="divide-y divide-slate-100">
                    {data.scheduledCallbacks.slice(0, 8).map(cb => {
                      const when = new Date(cb.scheduledDate);
                      const isOverdue = when.getTime() < Date.now();
                      const dateLocale = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA";
                      return (
                        <a key={cb.id} href={`/orders?open=${cb.orderId}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdue ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>☎</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800">#{cb.orderNumber}</span>
                              <span className="text-sm text-slate-600">{cb.customerName || (dir === "rtl" ? "زبون" : "Customer")}</span>
                              {isOverdue && <span className="badge badge-danger">{dir === "rtl" ? "متأخرة" : locale === "fr" ? "En retard" : "Overdue"}</span>}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                              {cb.customerPhone && <span>{cb.customerPhone}</span>}
                              {cb.employeeName && <span>{dir === "rtl" ? "الموظف:" : locale === "fr" ? "Agent :" : "Employee:"} {cb.employeeName}</span>}
                              {cb.notes && <span className="truncate max-w-[380px]">{cb.notes}</span>}
                            </div>
                          </div>
                          <div className="text-end whitespace-nowrap">
                            <div className="text-sm font-semibold text-slate-700">{when.toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}</div>
                            <div className={`text-xs mt-1 ${isOverdue ? "text-rose-500" : "text-slate-400"}`}>{when.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}</div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-slate-400">
                    {dir === "rtl" ? "لا توجد مكالمات مجدولة حالياً" : locale === "fr" ? "Aucun rappel planifié pour le moment" : "No scheduled calls right now"}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─── Row 3: Charts ─────────────────────────── */}
          <section className="dashboard-section"><div className="analytics-grid">
            <div className="analytics-card analytics-card-wide">
              <div className="card-header">
                <span>{dir === "rtl" ? "اتجاه الطلبات" : "Orders Trend"}</span>
              </div>
              <div className="card-body">
                <OrdersChart data={data.ordersByDate || []} locale={locale} dir={dir} />
              </div>
            </div>
            <div className="analytics-card">
              <div className="card-header">
                <span>{dir === "rtl" ? "توزيع الحالات" : "Status Distribution"}</span>
              </div>
              <div className="card-body">
                <StatusPieChart data={data.statusBreakdown || {}} t={t} />
              </div>
            </div>
          </div></section>

          {/* ─── Row 4: Employee Performance Cards ─────── */}
          {user?.role === "admin" && data.topEmployees && data.topEmployees.length > 0 && (
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <h2 className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                {dir === "rtl" ? "أداء الموظفين" : "Employee Performance"}</h2>
                  <p>{dir === "rtl" ? "مقارنة سريعة لأداء فريق التأكيد" : "A quick comparison of your confirmation team"}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.topEmployees.map((agent, i) => (
                  <AgentCard key={i} agent={agent} index={i} labels={agentLabels} />
                ))}
              </div>
            </section>
          )}

          {/* ─── Row 5: Recent Activity ────────────────── */}
          {user?.role === "admin" && data.recentActivity && data.recentActivity.length > 0 && (
            <section className="dashboard-section"><div className="analytics-card">
              <div className="card-header">
                <span>{dir === "rtl" ? "آخر النشاطات" : "Recent Activity"}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {data.recentActivity.slice(0, 8).map(act => (
                  <div key={act.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[13px] text-slate-700">{act.userName || "System"}</span>
                      <span className="text-slate-400 text-[13px]"> — {translateAction(act.action, dir, locale)}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {act.createdAt ? new Date(act.createdAt).toLocaleTimeString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div></section>
          )}

          {/* Employee/Client quick access */}
          {user?.role !== "admin" && (
            <div className="card p-6 text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">↗</div>
              <h3 className="font-semibold text-slate-700 mb-2">{dir === "rtl" ? "نظرة عامة على أدائك" : "Your Performance Overview"}</h3>
              <a href="/orders" className="btn btn-primary btn-sm mt-2">{dir === "rtl" ? "عرض الطلبات" : "View Orders"}</a>
            </div>
          )}
        </>
      ) : null}
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
  if (entry) return isAr ? entry.ar : isFr ? entry.fr : entry.en;
  return action.replace(/[._]/g, " ");
}
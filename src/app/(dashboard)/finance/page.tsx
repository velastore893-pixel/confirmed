"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";

type FinanceData = {
  revenue: number; commissions: number; expenses: number; netAmount: number;
  outstanding: number; paidInvoices: number; unpaidInvoices: number; outstandingCount: number;
};

export default function FinancePage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<FinanceData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch(`/api/finance?period=${period}`); if (res.ok) setData(await res.json()); } catch {} finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (user?.role !== "admin") return <div className="empty-state"><div className="empty-state-icon">🔒</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t("finance.title")}</h1>
        <div className="flex gap-2">
          {["today", "yesterday", "week", "month", "year"].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? "btn-primary" : "btn-secondary"}`} onClick={() => setPeriod(p)}>{t(`finance.${p === "week" ? "last7Days" : p === "year" ? "customRange" : p}`)}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      : data && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi-card">
              <div className="kpi-icon bg-green-50 text-green-600">💰</div>
              <div className="kpi-value">{formatCurrency(data.revenue, locale)}</div>
              <div className="kpi-label">{t("finance.revenue")}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon bg-orange-50 text-orange-600">📋</div>
              <div className="kpi-value">{formatCurrency(data.commissions, locale)}</div>
              <div className="kpi-label">{t("finance.commissions")}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon bg-violet-50 text-violet-600">📈</div>
              <div className="kpi-value">{formatCurrency(data.netAmount, locale)}</div>
              <div className="kpi-label">{t("finance.netAmount")}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon bg-red-50 text-red-600">⏳</div>
              <div className="kpi-value">{formatCurrency(data.outstanding, locale)}</div>
              <div className="kpi-label">{t("finance.outstandingBalance")}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="card"><div className="card-body text-center">
              <div className="text-3xl font-bold text-green-600">{data.paidInvoices}</div>
              <div className="text-sm text-slate-500 mt-1">{t("finance.paidInvoices")}</div>
            </div></div>
            <div className="card"><div className="card-body text-center">
              <div className="text-3xl font-bold text-red-600">{data.unpaidInvoices}</div>
              <div className="text-sm text-slate-500 mt-1">{t("finance.unpaidInvoices")}</div>
            </div></div>
            <div className="card"><div className="card-body text-center">
              <div className="text-3xl font-bold text-amber-600">{data.outstandingCount}</div>
              <div className="text-sm text-slate-500 mt-1">{t("finance.outstandingBalance")}</div>
            </div></div>
          </div>

          {/* Simple breakdown */}
          <div className="card">
            <div className="card-header">{t("finance.title")} — {t("common.description")}</div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">+ {t("finance.revenue")}</span>
                  <span className="font-bold text-green-800 font-mono">{formatCurrency(data.revenue, locale)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium text-orange-800">- {t("finance.commissions")}</span>
                  <span className="font-bold text-orange-800 font-mono">{formatCurrency(data.commissions, locale)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border-2 border-violet-200">
                  <span className="font-bold text-violet-800">= {t("finance.netAmount")}</span>
                  <span className="font-bold text-xl text-violet-800 font-mono">{formatCurrency(data.netAmount, locale)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
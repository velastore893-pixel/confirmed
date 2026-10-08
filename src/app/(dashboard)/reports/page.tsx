"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";

type ReportData = {
  totalOrders: number; newOrders: number; confirmed: number; cancelled: number;
  noAnswer: number; delivered: number; returned: number;
  confirmationRate: string; deliveryRate: string; returnRate: string;
  statusBreakdown: Record<string, number>;
  employeePerformance: Array<{ name: string; orders: number; confirmed: number; delivered: number; returned: number }>;
};

export default function ReportsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch(`/api/reports?period=${period}`); if (res.ok) setData(await res.json()); } catch {} finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
        <div className="flex gap-2">
          {["today", "yesterday", "week", "month"].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? "btn-primary" : "btn-secondary"}`} onClick={() => setPeriod(p)}>
              {t(`finance.${p === "week" ? "last7Days" : p}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      : data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: t("reports.totalOrders"), value: data.totalOrders, color: "bg-blue-50 text-blue-600", icon: "📦" },
              { label: t("reports.newOrders"), value: data.newOrders, color: "bg-indigo-50 text-indigo-600", icon: "🆕" },
              { label: t("reports.confirmed"), value: data.confirmed, color: "bg-green-50 text-green-600", icon: "✅" },
              { label: t("reports.cancelled"), value: data.cancelled, color: "bg-red-50 text-red-600", icon: "❌" },
              { label: t("reports.noAnswer"), value: data.noAnswer, color: "bg-gray-50 text-gray-600", icon: "📵" },
              { label: t("reports.delivered"), value: data.delivered, color: "bg-emerald-50 text-emerald-600", icon: "🚚" },
            ].map((kpi, i) => (
              <div key={i} className="kpi-card">
                <div className={`kpi-icon ${kpi.color}`}>{kpi.icon}</div>
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-label">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Rates */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card"><div className="card-body text-center">
              <div className="text-4xl font-bold text-green-600">{data.confirmationRate}%</div>
              <div className="text-sm text-slate-500 mt-2">{t("reports.confirmationRate")}</div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3"><div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${data.confirmationRate}%` }} /></div>
            </div></div>
            <div className="card"><div className="card-body text-center">
              <div className="text-4xl font-bold text-blue-600">{data.deliveryRate}%</div>
              <div className="text-sm text-slate-500 mt-2">{t("reports.deliveryRate")}</div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${data.deliveryRate}%` }} /></div>
            </div></div>
            <div className="card"><div className="card-body text-center">
              <div className="text-4xl font-bold text-red-600">{data.returnRate}%</div>
              <div className="text-sm text-slate-500 mt-2">{t("reports.returnRate")}</div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3"><div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${data.returnRate}%` }} /></div>
            </div></div>
          </div>

          {/* Status Breakdown */}
          <div className="card">
            <div className="card-header">{t("orders.title")} — {t("orders.status")}</div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.entries(data.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <span className={`badge badge-${status}`}>{t(`statuses.${status}`)}</span>
                    <span className="font-bold font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Performance */}
          {user?.role === "admin" && data.employeePerformance && data.employeePerformance.length > 0 && (
            <div className="card">
              <div className="card-header">{t("reports.employeePerformance")}</div>
              <div className="table-container">
                <table>
                  <thead><tr><th>{t("employees.name")}</th><th>{t("orders.allOrders")}</th><th>{t("reports.confirmed")}</th><th>{t("reports.delivered")}</th><th>{t("reports.returnRate")}</th><th>{t("reports.confirmationRate")}</th></tr></thead>
                  <tbody>
                    {data.employeePerformance.map((emp, i) => (
                      <tr key={i}>
                        <td className="font-medium">{emp.name}</td>
                        <td className="font-mono">{emp.orders}</td>
                        <td className="font-mono">{emp.confirmed}</td>
                        <td className="font-mono">{emp.delivered}</td>
                        <td>{emp.orders > 0 ? (emp.returned / emp.orders * 100).toFixed(1) : 0}%</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${emp.orders > 0 ? (emp.confirmed / emp.orders * 100) : 0}%` }} /></div>
                            <span className="text-sm">{emp.orders > 0 ? (emp.confirmed / emp.orders * 100).toFixed(0) : 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
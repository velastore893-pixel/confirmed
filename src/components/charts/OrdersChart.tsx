"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type DataPoint = { date: string; total: number; confirmed: number; delivered: number; returned: number };

export default function OrdersChart({ data, locale, dir }: { data: DataPoint[]; locale: string; dir: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
        {dir === "rtl" ? "لا توجد بيانات" : "No data available"}
      </div>
    );
  }

  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA", { month: "short", day: "numeric" }); } catch { return d; }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip labelFormatter={(label) => fmt(String(label))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={2} name={dir === "rtl" ? "الكل" : "Total"} />
        <Area type="monotone" dataKey="confirmed" stroke="#059669" fill="#059669" fillOpacity={0.1} strokeWidth={2} name={dir === "rtl" ? "مؤكدة" : "Confirmed"} />
        <Area type="monotone" dataKey="delivered" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.1} strokeWidth={2} name={dir === "rtl" ? "مسلمة" : "Delivered"} />
        <Area type="monotone" dataKey="returned" stroke="#dc2626" fill="#dc2626" fillOpacity={0.05} strokeWidth={1.5} name={dir === "rtl" ? "مرتجعة" : "Returned"} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
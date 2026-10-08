"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DataPoint = {
  date: string;
  total: number;
  confirmed: number;
  delivered: number;
  returned: number;
};

export default function OrdersChart({
  data,
  locale,
  dir,
}: {
  data: DataPoint[];
  locale: string;
  dir: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[310px] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 grid place-items-center text-xl">📈</div>
        <div className="text-sm font-semibold">
          {dir === "rtl"
            ? "لا توجد بيانات خلال هذه الفترة"
            : locale === "fr"
            ? "Aucune donnée pour cette période"
            : "No data available for this period"}
        </div>
      </div>
    );
  }

  const fmt = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(
        locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA",
        { month: "short", day: "numeric" }
      );
    } catch {
      return d;
    }
  };

  const labels = {
    total: dir === "rtl" ? "الكل" : locale === "fr" ? "Total" : "Total",
    confirmed: dir === "rtl" ? "مؤكدة" : locale === "fr" ? "Confirmées" : "Confirmed",
    delivered: dir === "rtl" ? "مسلمة" : locale === "fr" ? "Livrées" : "Delivered",
    returned: dir === "rtl" ? "مرتجعة" : locale === "fr" ? "Retournées" : "Returned",
  };

  return (
    <div className="w-full h-[330px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 14, left: -12, bottom: 4 }}>
          <defs>
            <linearGradient id="ordersTotalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.20} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="ordersConfirmedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.16} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="ordersDeliveredFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.16} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="ordersReturnedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.10} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="4 4" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmt}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
          />
          <Tooltip
            labelFormatter={(label) => fmt(String(label))}
            cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e6eaf2",
              boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
              background: "rgba(255,255,255,0.98)",
              padding: "10px 12px",
            }}
            labelStyle={{ color: "#475569", fontSize: 11, fontWeight: 800, marginBottom: 6 }}
            itemStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 2, paddingBottom: 2 }}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 10, color: "#64748b", paddingTop: 12 }}
          />

          <Area type="monotone" dataKey="total" name={labels.total} stroke="#6366f1" fill="url(#ordersTotalFill)" strokeWidth={2.4} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
          <Area type="monotone" dataKey="confirmed" name={labels.confirmed} stroke="#10b981" fill="url(#ordersConfirmedFill)" strokeWidth={2.1} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
          <Area type="monotone" dataKey="delivered" name={labels.delivered} stroke="#8b5cf6" fill="url(#ordersDeliveredFill)" strokeWidth={2.1} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
          <Area type="monotone" dataKey="returned" name={labels.returned} stroke="#f43f5e" fill="url(#ordersReturnedFill)" strokeWidth={1.8} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


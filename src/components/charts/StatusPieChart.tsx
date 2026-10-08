"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS: Record<string, string> = {
  new: "#3b82f6",
  assigned: "#6366f1",
  calling: "#eab308",
  confirmed: "#22c55e",
  sent_to_delivery: "#06b6d4",
  in_transit: "#8b5cf6",
  out_for_delivery: "#f97316",
  delivered: "#10b981",
  returned: "#ef4444",
  no_answer: "#64748b",
  callback: "#f59e0b",
  cancelled: "#dc2626",
  delayed: "#fb923c",
};

export default function StatusPieChart({
  data,
  t,
}: {
  data: Record<string, number>;
  t: (key: string) => string;
}) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: t(`statuses.${key}`),
      value,
      key,
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-[330px] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 grid place-items-center text-xl">◔</div>
        <div className="text-sm font-semibold">No data</div>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const topItems = [...chartData].sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div className="w-full h-[330px] grid grid-rows-[1fr_auto]">
      <div className="relative min-h-0">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-center mt-[-6px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total</div>
            <div className="text-[28px] font-black text-slate-900 leading-tight">{total}</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={104}
              paddingAngle={3}
              cornerRadius={8}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={3}
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const numeric = Number(value);
                const percent = total > 0 ? ((numeric / total) * 100).toFixed(1) : "0.0";
                return [`${numeric} (${percent}%)`, item?.payload?.name || ""];
              }}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid #e6eaf2",
                boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
                background: "rgba(255,255,255,0.98)",
                padding: "10px 12px",
              }}
              itemStyle={{ fontSize: 11, fontWeight: 700 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="codflow-status-legend">
        {topItems.map((item) => (
          <div key={item.key}>
            <span style={{ background: COLORS[item.key] || "#94a3b8" }} />
            <b>{item.name}</b>
            <small>{item.value}</small>
          </div>
        ))}
      </div>
    </div>
  );
}


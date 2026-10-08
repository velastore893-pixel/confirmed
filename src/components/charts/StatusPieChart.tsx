"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
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
      <div className="h-[320px] flex flex-col items-center justify-center gap-2 text-slate-400">
        <div className="text-2xl">🍩</div>
        <div className="text-sm font-medium">No data</div>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-[320px] relative">
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-center mt-[-18px]">
          <div className="text-[11px] font-semibold text-slate-400">Total</div>
          <div className="text-2xl font-extrabold text-slate-900 leading-tight">
            {total}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="46%"
            innerRadius={64}
            outerRadius={98}
            paddingAngle={3}
            cornerRadius={6}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.key}
                fill={COLORS[entry.key] || "#94a3b8"}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value, _name, item) => {
              const numeric = Number(value);
              const percent = total > 0 ? ((numeric / total) * 100).toFixed(1) : "0.0";
              const label = item?.payload?.name || "";
              return [`${numeric} (${percent}%)`, label];
            }}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid #e7ebf2",
              boxShadow: "0 14px 34px rgba(15,23,42,0.10)",
              background: "rgba(255,255,255,0.98)",
              padding: "10px 12px",
            }}
            itemStyle={{
              fontSize: 11,
              fontWeight: 600,
              paddingTop: 2,
              paddingBottom: 2,
            }}
          />

          <Legend
            iconType="circle"
            iconSize={8}
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              fontSize: 11,
              color: "#64748b",
              paddingTop: 6,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

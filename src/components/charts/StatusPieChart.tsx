"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  new: "#3b82f6", assigned: "#6366f1", calling: "#eab308", confirmed: "#22c55e",
  sent_to_delivery: "#06b6d4", in_transit: "#8b5cf6", out_for_delivery: "#f97316",
  delivered: "#10b981", returned: "#ef4444", no_answer: "#64748b", callback: "#f59e0b",
  cancelled: "#dc2626", delayed: "#fb923c",
};

export default function StatusPieChart({ data, t }: { data: Record<string, number>; t: (key: string) => string }) {
  const chartData = Object.entries(data)
    .filter(([_, v]) => v > 0)
    .map(([key, value]) => ({
      name: t(`statuses.${key}`),
      value,
      key,
    }));

  if (chartData.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">No data</div>;
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
          label={({ name, value }) => `${name} ${((value / total) * 100).toFixed(0)}%`}
          labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key] || "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} (${((Number(value) / total) * 100).toFixed(1)}%)`, ""]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
"use client";

type AgentData = {
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

const AVATAR_COLORS = [
  "linear-gradient(135deg, #4f46e5, #7c3aed)",
  "linear-gradient(135deg, #0891b2, #059669)",
  "linear-gradient(135deg, #d97706, #dc2626)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #059669, #2563eb)",
  "linear-gradient(135deg, #ea580c, #d97706)",
];

export default function AgentCard({
  agent,
  index,
  labels,
}: {
  agent: AgentData;
  index: number;
  labels: Record<string, string>;
}) {
  const initials = agent.name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];

  const confRate =
    agent.orders > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((agent.confirmed + agent.delivered) / agent.orders) * 100,
          ),
        )
      : 0;

  const delRate =
    agent.orders > 0
      ? Math.min(100, Math.max(0, (agent.delivered / agent.orders) * 100))
      : 0;

  const displayConfRate = Math.round(confRate);
  const displayDelRate = Math.round(delRate);

  return (
    <article className="agent-card group">
      <div className="agent-header">
        <div
          className="agent-avatar shadow-sm"
          style={{ background: bg }}
          aria-hidden="true"
        >
          {initials || "A"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[13px] text-slate-900 truncate">
            {agent.name}
          </div>

          {agent.email && (
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {agent.email}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]" />
          <span className="text-[10px] text-emerald-700 font-bold">
            {labels.active || "Active"}
          </span>
        </div>
      </div>

      <div className="agent-stats">
        <div className="stat-box">
          <div className="stat-value text-blue-600">{agent.orders}</div>
          <div className="stat-label">{labels.assigned || "Assigned"}</div>
        </div>

        <div className="stat-box">
          <div className="stat-value text-emerald-600">{agent.confirmed}</div>
          <div className="stat-label">{labels.confirmed || "Confirmed"}</div>
        </div>

        <div className="stat-box">
          <div className="stat-value text-violet-600">{agent.delivered}</div>
          <div className="stat-label">{labels.delivered || "Delivered"}</div>
        </div>

        <div className="stat-box">
          <div className="stat-value text-slate-600">{agent.noAnswer}</div>
          <div className="stat-label">{labels.noAnswer || "No Answer"}</div>
        </div>

        <div className="stat-box">
          <div className="stat-value text-amber-600">{agent.pending}</div>
          <div className="stat-label">{labels.pending || "Pending"}</div>
        </div>

        <div className="stat-box">
          <div className="stat-value text-rose-500">{agent.returned}</div>
          <div className="stat-label">{labels.returns || "Returns"}</div>
        </div>
      </div>

      <div className="px-4 py-3.5 bg-slate-50/60 border-t border-slate-100 space-y-3">
        <div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-[10px] font-semibold text-slate-500">
              {labels.confirmRate || "Confirmation"}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600">
              {displayConfRate}%
            </span>
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${displayConfRate}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-[10px] font-semibold text-slate-500">
              {labels.deliveryRate || "Delivery"}
            </span>
            <span className="text-[10px] font-extrabold text-blue-600">
              {displayDelRate}%
            </span>
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${displayDelRate}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

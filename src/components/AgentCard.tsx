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

  const confRate = agent.orders > 0
    ? Math.min(100, Math.max(0, ((agent.confirmed + agent.delivered) / agent.orders) * 100))
    : 0;

  const delRate = agent.orders > 0
    ? Math.min(100, Math.max(0, (agent.delivered / agent.orders) * 100))
    : 0;

  const displayConfRate = Math.round(confRate);
  const displayDelRate = Math.round(delRate);

  return (
    <article className="codflow-agent-card">
      <div className="codflow-agent-head">
        <div
          className="codflow-agent-avatar"
          style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
        >
          {initials || "A"}
        </div>

        <div className="min-w-0 flex-1">
          <b className="block truncate">{agent.name}</b>
          {agent.email && <small className="block truncate">{agent.email}</small>}
        </div>

        <span className="codflow-active-pill">
          <i />
          {labels.active || "Active"}
        </span>
      </div>

      <div className="codflow-agent-stats">
        <div><b>{agent.orders}</b><span>{labels.assigned || "Assigned"}</span></div>
        <div><b>{agent.confirmed}</b><span>{labels.confirmed || "Confirmed"}</span></div>
        <div><b>{agent.delivered}</b><span>{labels.delivered || "Delivered"}</span></div>
        <div><b>{agent.noAnswer}</b><span>{labels.noAnswer || "No Answer"}</span></div>
        <div><b>{agent.pending}</b><span>{labels.pending || "Pending"}</span></div>
        <div><b>{agent.returned}</b><span>{labels.returns || "Returns"}</span></div>
      </div>

      <div className="codflow-agent-rates">
        <Rate label={labels.confirmRate || "Confirmation"} value={displayConfRate} tone="emerald" />
        <Rate label={labels.deliveryRate || "Delivery"} value={displayDelRate} tone="indigo" />
      </div>
    </article>
  );
}

function Rate({ label, value, tone }: { label: string; value: number; tone: "emerald" | "indigo" }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <b>{value}%</b>
      </div>
      <div className="codflow-rate-track">
        <div className={`codflow-rate-fill ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}


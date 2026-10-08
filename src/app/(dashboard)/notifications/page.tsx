"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/utils";

type Notification = {
  id: string; type: string; title: string; body: string; isRead: boolean;
  relatedType: string; relatedId: string; createdAt: string;
};

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter === "unread") params.set("unread", "true");
      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) { const d = await res.json(); setNotifications(d.items); setUnread(d.unread); }
    } catch {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRead: true }) });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      order_new: "📦", order_assigned: "👤", order_confirmed: "✅", order_delivered: "🚚", order_returned: "↩️",
      store_pending: "🏪", store_activated: "✅", store_suspended: "❌",
      invoice_created: "🧾", invoice_approved: "✅", invoice_sent: "📤", invoice_paid: "💰", invoice_overdue: "⏰",
      payment_received: "💵", payment_verified: "✅",
      callback_scheduled: "📞", callback_due: "⏰",
      integration_error: "⚠️", system_alert: "🔔",
    };
    return icons[type] || "🔔";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t("notifications.title")} {unread > 0 && <span className="text-sm font-normal text-red-500">({unread} unread)</span>}</h1>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter("all")}>{t("common.all")}</button>
          <button className={`btn btn-sm ${filter === "unread" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter("unread")}>{t("notifications.markRead")} ({unread})</button>
          {unread > 0 && <button className="btn btn-sm btn-secondary" onClick={markAllRead}>{t("notifications.markAllRead")}</button>}
        </div>
      </div>

      <div className="card">
        {loading ? <div className="text-center py-8"><div className="spinner mx-auto" /></div>
        : notifications.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔔</div><div className="empty-state-text">{t("notifications.noNotifications")}</div></div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                onClick={() => { if (!n.isRead) markRead(n.id); }}>
                <span className="text-2xl flex-shrink-0 mt-0.5">{getIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${!n.isRead ? "text-slate-900" : "text-slate-600"}`}>{n.title}</span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                  {n.body && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  <span className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt, locale)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
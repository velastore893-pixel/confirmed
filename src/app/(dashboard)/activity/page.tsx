"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/utils";

type ActivityLog = {
  id: string; userId: string; action: string; entityType: string; entityId: string;
  previousValue: unknown; newValue: unknown; metadata: unknown;
  ipAddress: string; createdAt: string; userName: string; userLastName: string; userRole: string;
};

export default function ActivityPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/activity?${params}`);
      if (res.ok) { const d = await res.json(); setLogs(d.items); setTotal(d.total); }
    } catch {} finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  if (user?.role !== "admin") return <div className="empty-state"><div className="empty-state-icon">🔒</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("activity.title")}</h1>
        <span className="text-sm text-slate-500">{total} {t("common.entries")}</span>
      </div>

      <div className="card"><div className="card-body">
        <input className="input" style={{ maxWidth: 300 }} placeholder={t("common.search")} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div></div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("activity.who")}</th><th>{t("activity.what")}</th><th>{t("activity.entity")}</th><th>{t("activity.when")}</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
              : logs.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-slate-400">{t("activity.noLogs")}</td></tr>
              : logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{(log.userName || "S")[0]}</div>
                      <div><div className="font-medium text-sm">{log.userName || "System"} {log.userLastName || ""}</div>{log.userRole && <div className="text-xs text-slate-400">{log.userRole}</div>}</div>
                    </div>
                  </td>
                  <td><span className="font-mono text-sm">{log.action}</span></td>
                  <td><span className="text-sm">{log.entityType} {log.entityId ? `#${log.entityId.substring(0, 8)}` : ""}</span></td>
                  <td className="text-sm text-slate-500">{formatDateTime(log.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / 50) > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-center">
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
              <span className="px-3 text-sm">{page} / {Math.ceil(total / 50)}</span>
              <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";

type Rule = { id: string; employeeId: string; storeId: string; city: string; region: string; percentage: number; priority: number; isActive: boolean; employeeFirstName: string; employeeLastName: string; storeName: string; };
type Employee = { id: string; firstName: string; lastName: string; employeeId: string; };
type Store = { id: string; name: string; };

export default function DistributionPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeId: "", storeId: "", city: "", region: "", percentage: "50", priority: "1", isActive: true });
  const [toast, setToast] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [rRes, eRes, sRes] = await Promise.all([
        fetch("/api/distribution"), fetch("/api/users?role=employee"), fetch("/api/stores"),
      ]);
      if (rRes.ok) { const d = await rRes.json(); setRules(d.items); }
      if (eRes.ok) { const d = await eRes.json(); setEmployees(d.items); }
      if (sRes.ok) { const d = await sRes.json(); setStores(d.items); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    const url = editId ? `/api/distribution/${editId}` : "/api/distribution";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); fetchData(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000); }
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/distribution/${id}`, { method: "DELETE" });
    fetchData(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000);
  };

  if (user?.role !== "admin") return <div className="empty-state"><div className="empty-state-icon">🔒</div></div>;

  return (
    <div className="space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("distribution.title")}</h1>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ employeeId: "", storeId: "", city: "", region: "", percentage: "50", priority: "1", isActive: true }); setShowModal(true); }}>+ {t("distribution.addRule")}</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("distribution.employee")}</th><th>{t("distribution.store")}</th><th>{t("distribution.city")}</th><th>{t("distribution.region")}</th><th>{t("distribution.percentage")}</th><th>{t("distribution.priority")}</th><th>{t("distribution.active")}</th><th>{t("distribution.actions")}</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
              : rules.map(r => (
                <tr key={r.id}>
                  <td className="font-medium">{r.employeeFirstName} {r.employeeLastName}</td>
                  <td>{r.storeName || "—"}</td>
                  <td>{r.city || "—"}</td>
                  <td>{r.region || "—"}</td>
                  <td><span className="font-mono font-bold text-blue-600">{r.percentage}%</span></td>
                  <td>{r.priority}</td>
                  <td><span className={`badge badge-${r.isActive ? "active" : "suspended"}`}>{r.isActive ? "✓" : "✕"}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-sm btn-secondary" onClick={() => { setEditId(r.id); setForm({ employeeId: r.employeeId, storeId: r.storeId || "", city: r.city || "", region: r.region || "", percentage: String(r.percentage), priority: String(r.priority), isActive: r.isActive }); setShowModal(true); }}>{t("common.edit")}</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteRule(r.id)}>{t("common.delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">{editId ? t("distribution.editRule") : t("distribution.addRule")}<button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group"><label className="form-label">{t("distribution.employee")} *</label>
                  <select className="input" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                    <option value="">{t("common.select")}</option>
                    {employees.map(e => <option key={e.employeeId || e.id} value={e.employeeId || e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">{t("distribution.store")}</label>
                  <select className="input" value={form.storeId} onChange={e => setForm(f => ({ ...f, storeId: e.target.value }))}>
                    <option value="">{t("common.all")}</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">{t("distribution.city")}</label><input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Marrakech" /></div>
                <div className="form-group"><label className="form-label">{t("distribution.region")}</label><input className="input" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="Marrakech-Safi" /></div>
                <div className="form-group"><label className="form-label">{t("distribution.percentage")}</label><input className="input" type="number" min="1" max="100" value={form.percentage} onChange={e => setForm(f => ({ ...f, percentage: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("distribution.priority")}</label><input className="input" type="number" min="1" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={handleSave}>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
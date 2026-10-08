"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

type Client = {
  id: string; email: string; firstName: string; lastName: string; phone: string;
  isActive: boolean; clientId: string; companyName: string; city: string; createdAt: string;
};

export default function ClientsPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", phone: "", companyName: "", city: "", region: "", defaultPricePerOrder: "10.00", address: "" });
  const [toast, setToast] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/users?role=client");
      if (res.ok) { const d = await res.json(); setClients(d.items); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openCreate = () => { setEditId(null); setForm({ email: "", password: "", firstName: "", lastName: "", phone: "", companyName: "", city: "", region: "", defaultPricePerOrder: "10.00", address: "" }); setShowModal(true); };
  const openEdit = (c: Client) => {
    setEditId(c.id);
    setForm({ email: c.email, password: "", firstName: c.firstName, lastName: c.lastName, phone: c.phone || "", companyName: c.companyName || "", city: "", region: "", defaultPricePerOrder: "10.00", address: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editId ? `/api/users/${editId}` : "/api/users";
    const method = editId ? "PATCH" : "POST";
    const body: Record<string, unknown> = { ...form, role: "client" };
    if (editId && !body.password) delete body.password;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setShowModal(false); fetchClients(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000); }
  };

  const toggleStatus = async (c: Client) => {
    await fetch(`/api/users/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    fetchClients(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000);
  };

  if (user?.role !== "admin") return <div className="empty-state"><div className="empty-state-icon">🔒</div></div>;

  return (
    <div className="space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("clients.title")}</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ {t("clients.addClient")}</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("clients.name")}</th><th>{t("clients.company")}</th><th>{t("clients.email")}</th><th>{t("clients.phone")}</th><th>{t("clients.status")}</th><th>{t("common.date")}</th><th>{t("clients.actions")}</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
              : clients.map(c => (
                <tr key={c.id}>
                  <td className="font-medium">{c.firstName} {c.lastName}</td>
                  <td>{c.companyName || "—"}</td>
                  <td className="text-sm text-slate-500">{c.email}</td>
                  <td>{c.phone || "—"}</td>
                  <td><span className={`badge badge-${c.isActive ? "active" : "suspended"}`}>{t(`statuses.${c.isActive ? "active" : "suspended"}`)}</span></td>
                  <td className="text-sm text-slate-500">{formatDate(c.createdAt, locale)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>{t("common.edit")}</button>
                      <button className={`btn btn-sm ${c.isActive ? "btn-danger" : "btn-success"}`} onClick={() => toggleStatus(c)}>{c.isActive ? t("clients.suspend") : t("clients.reactivate")}</button>
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
            <div className="modal-header">{editId ? t("clients.editClient") : t("clients.addClient")}<button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group"><label className="form-label">{t("clients.name")}</label><input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("clients.name")}</label><input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("clients.email")}</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("auth.password")}</label><input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("clients.company")}</label><input className="input" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("clients.phone")}</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("clients.city")}</label><input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("settings.defaultPrice")}</label><input className="input" type="number" step="0.5" value={form.defaultPricePerOrder} onChange={e => setForm(f => ({ ...f, defaultPricePerOrder: e.target.value }))} /></div>
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
"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

type Store = {
  id: string; name: string; status: string; url: string; clientId: string; assignedEmployeeId: string;
  platformId: string; deliveryCompanyId: string; pricePerOrder: string; clientCompanyName: string;
  platformName: string; deliveryName: string; createdAt: string;
};
type Platform = { id: string; name: string; slug: string; icon: string; };
type Delivery = { id: string; name: string; slug: string; };
type Employee = { id: string; firstName: string; lastName: string; employeeId: string; };

export default function StoresPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", platformId: "", deliveryCompanyId: "", url: "", assignedEmployeeId: "", pricePerOrder: "10.00", commissionPerOrder: "3.00" });
  const [toast, setToast] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [sRes, pRes, dRes] = await Promise.all([
        fetch("/api/stores"), fetch("/api/platforms"), fetch("/api/delivery"),
      ]);
      if (sRes.ok) { const d = await sRes.json(); setStores(d.items); }
      if (pRes.ok) { const d = await pRes.json(); setPlatforms(d.items); }
      if (dRes.ok) { const d = await dRes.json(); setDeliveries(d.items); }
      if (user?.role === "admin") {
        const eRes = await fetch("/api/users?role=employee");
        if (eRes.ok) { const d = await eRes.json(); setEmployees(d.items); }
      }
    } catch {} finally { setLoading(false); }
  }, [user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditId(null); setForm({ name: "", platformId: "", deliveryCompanyId: "", url: "", assignedEmployeeId: "", pricePerOrder: "10.00", commissionPerOrder: "3.00" }); setShowModal(true); };
  const openEdit = (s: Store) => {
    setEditId(s.id);
    setForm({ name: s.name, platformId: s.platformId || "", deliveryCompanyId: s.deliveryCompanyId || "", url: s.url || "", assignedEmployeeId: s.assignedEmployeeId || "", pricePerOrder: s.pricePerOrder || "10.00", commissionPerOrder: "3.00" });
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editId ? `/api/stores/${editId}` : "/api/stores";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); fetchData(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000); }
  };

  const activateStore = async (id: string) => {
    await fetch(`/api/stores/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) });
    fetchData(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000);
  };

  const approveStore = async (id: string, action: "activate" | "reject" | "request_correction", notes?: string) => {
    await fetch(`/api/stores/${id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes }),
    });
    fetchData(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("stores.title")}</h1>
        {(user?.role === "client" || user?.role === "admin") && (
          <button className="btn btn-primary" onClick={openCreate}>+ {t("stores.addStore")}</button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("stores.storeName")}</th><th>{t("stores.client")}</th><th>{t("stores.platform")}</th><th>{t("stores.deliveryCompany")}</th><th>{t("stores.status")}</th><th>{t("common.date")}</th><th>{t("stores.actions")}</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
              : stores.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-slate-400">{t("common.noData")}</td></tr>
              : stores.map(s => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.clientCompanyName || "—"}</td>
                  <td>{s.platformName || "—"}</td>
                  <td>{s.deliveryName || "—"}</td>
                  <td><span className={`badge badge-${s.status}`}>{t(`statuses.${s.status}`)}</span></td>
                  <td className="text-sm text-slate-500">{formatDate(s.createdAt, locale)}</td>
                  <td>
                    <div className="flex gap-1">
                      {user?.role === "admin" && s.status === "pending" && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => approveStore(s.id, "activate")}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            {t("stores.activate")}
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>{t("common.edit")}</button>
                        </>
                      )}
                      {user?.role === "admin" && s.status !== "pending" && (
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>{t("common.edit")}</button>
                      )}
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
            <div className="modal-header">{editId ? t("stores.editStore") : t("stores.addStore")}<button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group"><label className="form-label">{t("stores.storeName")}</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("stores.url")}</label><input className="input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("stores.selectPlatform")}</label>
                  <select className="input" value={form.platformId} onChange={e => setForm(f => ({ ...f, platformId: e.target.value }))}>
                    <option value="">{t("common.select")}</option>
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">{t("stores.selectDelivery")}</label>
                  <select className="input" value={form.deliveryCompanyId} onChange={e => setForm(f => ({ ...f, deliveryCompanyId: e.target.value }))}>
                    <option value="">{t("common.select")}</option>
                    {deliveries.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                {user?.role === "admin" && (
                  <>
                    <div className="form-group"><label className="form-label">{t("stores.assignedEmployee")}</label>
                      <select className="input" value={form.assignedEmployeeId} onChange={e => setForm(f => ({ ...f, assignedEmployeeId: e.target.value }))}>
                        <option value="">{t("common.select")}</option>
                        {employees.map(e => <option key={e.employeeId || e.id} value={e.employeeId || e.id}>{e.firstName} {e.lastName}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">{t("stores.pricePerOrder")}</label><input className="input" type="number" step="0.5" value={form.pricePerOrder} onChange={e => setForm(f => ({ ...f, pricePerOrder: e.target.value }))} /></div>
                  </>
                )}
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
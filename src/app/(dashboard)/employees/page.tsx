"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

type Employee = {
  id: string; email: string; firstName: string; lastName: string; phone: string;
  isActive: boolean; employeeId: string; commissionPerOrder: string; maxDailyOrders: number;
  lastLoginAt: string; createdAt: string;
};

export default function EmployeesPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", phone: "", commissionPerOrder: "3.00", maxDailyOrders: "" });
  const [toast, setToast] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/users?role=employee");
      if (res.ok) { const d = await res.json(); setEmployees(d.items); setTotal(d.total); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const openCreate = () => { setEditId(null); setForm({ email: "", password: "", firstName: "", lastName: "", phone: "", commissionPerOrder: "3.00", maxDailyOrders: "" }); setShowModal(true); };
  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    setForm({ email: emp.email, password: "", firstName: emp.firstName, lastName: emp.lastName, phone: emp.phone || "", commissionPerOrder: emp.commissionPerOrder || "3.00", maxDailyOrders: String(emp.maxDailyOrders || "") });
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editId ? `/api/users/${editId}` : "/api/users";
    const method = editId ? "PATCH" : "POST";
    const body: Record<string, unknown> = { ...form, role: "employee" };
    if (editId && !body.password) delete body.password;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setShowModal(false); fetchEmployees(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000); }
  };

  const toggleStatus = async (emp: Employee) => {
    await fetch(`/api/users/${emp.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !emp.isActive }) });
    fetchEmployees(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000);
  };

  if (user?.role !== "admin") return <div className="empty-state"><div className="empty-state-icon">🔒</div><div className="empty-state-text">Access denied</div></div>;

  return (
    <div className="space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("employees.title")}</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ {t("employees.addEmployee")}</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("employees.name")}</th><th>{t("employees.email")}</th><th>{t("employees.phone")}</th><th>{t("employees.commissionPerOrder")}</th><th>{t("employees.status")}</th><th>{t("common.date")}</th><th>{t("employees.actions")}</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
              : employees.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-slate-400">{t("common.noData")}</td></tr>
              : employees.map(emp => (
                <tr key={emp.id}>
                  <td className="font-medium">{emp.firstName} {emp.lastName}</td>
                  <td className="text-sm text-slate-500">{emp.email}</td>
                  <td>{emp.phone || "—"}</td>
                  <td className="font-mono">{emp.commissionPerOrder} DH</td>
                  <td><span className={`badge badge-${emp.isActive ? "active" : "suspended"}`}>{t(`statuses.${emp.isActive ? "active" : "suspended"}`)}</span></td>
                  <td className="text-sm text-slate-500">{formatDate(emp.createdAt, locale)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(emp)}>{t("common.edit")}</button>
                      <button className={`btn btn-sm ${emp.isActive ? "btn-danger" : "btn-success"}`} onClick={() => toggleStatus(emp)}>
                        {emp.isActive ? t("employees.suspend") : t("employees.reactivate")}
                      </button>
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
            <div className="modal-header">{editId ? t("employees.editEmployee") : t("employees.addEmployee")}<button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group"><label className="form-label">{t("employees.name")} *</label><input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("employees.name")} *</label><input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("employees.email")} *</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("auth.password")} {editId ? "" : "*"}</label><input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("employees.phone")}</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("employees.commissionPerOrder")}</label><input className="input" type="number" step="0.5" value={form.commissionPerOrder} onChange={e => setForm(f => ({ ...f, commissionPerOrder: e.target.value }))} /></div>
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
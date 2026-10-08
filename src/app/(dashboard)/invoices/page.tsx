"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

type Invoice = {
  id: string; invoiceNumber: string; type: string; clientId: string; employeeId: string;
  periodStart: string; periodEnd: string; orderCount: number; pricePerOrder: string;
  total: string; commissionTotal: string; status: string; createdAt: string;
  clientCompanyName: string; employeeFirstName: string; employeeLastName: string;
};
type Client = { id: string; companyName: string; firstName: string; lastName: string; clientId: string; };

const INV_STATUSES = ["draft", "created", "pending_review", "approved", "sent_to_client", "paid", "overdue", "cancelled"];

export default function InvoicesPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ clientId: "", startDate: "", endDate: "" });
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState("");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/invoices?${params}`);
      if (res.ok) { const d = await res.json(); setInvoices(d.items); setTotal(d.total); }
    } catch {} finally { setLoading(false); }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "employee") {
      fetch("/api/users?role=client").then(r => r.json()).then(d => setClients(d.items)).catch(() => {});
    }
  }, [user?.role]);

  const fetchDetail = async (id: string) => {
    setSelectedInvoice(id);
    const res = await fetch(`/api/invoices/${id}`);
    if (res.ok) setInvoiceDetail(await res.json());
  };

  const handleCreate = async () => {
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createForm) });
    if (res.ok) { setShowCreateModal(false); fetchInvoices(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000); }
    else { const err = await res.json(); setToast(err.error || t("common.error")); setTimeout(() => setToast(""), 3000); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchInvoices(); if (selectedInvoice === id) fetchDetail(id);
    setToast(t("common.success")); setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="space-y-6">
      {toast && <div className={`toast ${toast === t("common.success") ? "toast-success" : "toast-error"}`}>{toast}</div>}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t("invoices.title")}</h1>
        {(user?.role === "admin" || user?.role === "employee") && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ {t("invoices.createInvoice")}</button>
        )}
      </div>

      {/* Filters */}
      <div className="card"><div className="card-body">
        <div className="flex flex-wrap gap-3">
          <select className="input" style={{ maxWidth: 200 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">{t("common.all")}</option>
            <option value="client">{t("invoices.clientInvoice")}</option>
            <option value="commission">{t("invoices.commissionInvoice")}</option>
          </select>
          <select className="input" style={{ maxWidth: 200 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">{t("common.all")}</option>
            {INV_STATUSES.map(s => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </select>
        </div>
      </div></div>

      <div className="flex gap-6">
        <div className={`card flex-1 ${selectedInvoice ? "hidden lg:block lg:max-w-[55%]" : ""}`}>
          <div className="table-container">
            <table>
              <thead><tr><th>{t("invoices.invoiceNumber")}</th><th>{t("invoices.type")}</th><th>{t("invoices.client")}</th><th>{t("invoices.period")}</th><th>{t("invoices.orderCount")}</th><th>{t("invoices.total")}</th><th>{t("invoices.status")}</th><th>{t("invoices.actions")}</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
                : invoices.length === 0 ? <tr><td colSpan={8} className="text-center py-8 text-slate-400">{t("invoices.noInvoices")}</td></tr>
                : invoices.map(inv => (
                  <tr key={inv.id} className="cursor-pointer" onClick={() => fetchDetail(inv.id)} style={selectedInvoice === inv.id ? { background: "#eff6ff" } : {}}>
                    <td className="font-mono font-medium text-sm">{inv.invoiceNumber}</td>
                    <td><span className={`badge ${inv.type === "client" ? "badge-blue" : "badge-purple"}`}>{inv.type === "client" ? t("invoices.clientInvoice") : t("invoices.commissionInvoice")}</span></td>
                    <td>{inv.clientCompanyName || "—"}</td>
                    <td className="text-sm">{formatDate(inv.periodStart, locale)} → {formatDate(inv.periodEnd, locale)}</td>
                    <td className="font-mono">{inv.orderCount}</td>
                    <td className="font-mono font-bold">{formatCurrency(inv.total, locale)}</td>
                    <td><span className={`badge badge-${inv.status}`}>{t(`statuses.${inv.status}`)}</span></td>
                    <td>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        {user?.role === "admin" && inv.status === "created" && <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(inv.id, "approved")}>{t("invoices.approve")}</button>}
                        {user?.role === "admin" && inv.status === "approved" && <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(inv.id, "sent_to_client")}>{t("invoices.sendToClient")}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedInvoice && invoiceDetail && (
          <div className="card w-full lg:w-[45%]">
            <div className="card-header"><span>{t("invoices.invoiceNumber")}</span><button className="btn btn-sm btn-secondary" onClick={() => { setSelectedInvoice(null); setInvoiceDetail(null); }}>✕</button></div>
            <div className="card-body space-y-4">
              {(() => {
                const inv = invoiceDetail.invoice as Invoice;
                const invOrders = invoiceDetail.invoiceOrders as Array<Record<string, unknown>>;
                const pays = invoiceDetail.payments as Array<Record<string, unknown>>;
                const client = invoiceDetail.client as Record<string, unknown> | null;
                return (
                  <>
                    <div className="flex items-center justify-between"><span className="font-mono font-bold text-lg">{inv.invoiceNumber}</span><span className={`badge badge-${inv.status}`}>{t(`statuses.${inv.status}`)}</span></div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">{t("invoices.type")}</span><div>{inv.type}</div></div>
                      <div><span className="text-slate-500">{t("invoices.client")}</span><div>{client ? String(client.companyName || `${client.firstName} ${client.lastName}`) : "—"}</div></div>
                      <div><span className="text-slate-500">{t("invoices.period")}</span><div>{formatDate(inv.periodStart, locale)} → {formatDate(inv.periodEnd, locale)}</div></div>
                      <div><span className="text-slate-500">{t("invoices.orderCount")}</span><div className="font-bold">{inv.orderCount}</div></div>
                      <div><span className="text-slate-500">{t("invoices.total")}</span><div className="font-bold text-lg">{formatCurrency(inv.total, locale)}</div></div>
                      {inv.commissionTotal && <div><span className="text-slate-500">{t("finance.commissions")}</span><div className="font-bold">{formatCurrency(inv.commissionTotal, locale)}</div></div>}
                    </div>

                    {/* Linked orders */}
                    {invOrders && invOrders.length > 0 && (
                      <div><h3 className="font-semibold text-sm mb-2">{t("orders.title")} ({invOrders.length})</h3>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {invOrders.map((o: Record<string, unknown>, i: number) => (
                            <div key={i} className="flex justify-between text-sm bg-slate-50 rounded px-3 py-1.5">
                              <span className="font-mono">{String(o.orderNumber)}</span>
                              <span className="font-mono">{formatCurrency(String(o.amount), locale)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin actions */}
                    {user?.role === "admin" && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        {inv.status === "created" && <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(selectedInvoice, "approved")}>{t("invoices.approve")}</button>}
                        {inv.status === "approved" && <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(selectedInvoice, "sent_to_client")}>{t("invoices.sendToClient")}</button>}
                        {["sent_to_client", "pending_review", "approved"].includes(inv.status) && <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(selectedInvoice, "paid")}>{t("invoices.markPaid")}</button>}
                      </div>
                    )}

                    {/* Client payment upload */}
                    {user?.role === "client" && inv.status === "sent_to_client" && (
                      <div className="pt-2 border-t border-slate-100">
                        <h3 className="font-semibold text-sm mb-2">{t("invoices.uploadReceipt")}</h3>
                        <input type="file" className="input" accept="image/*,.pdf" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId: selectedInvoice, amount: inv.total, receiptPath: file.name }) });
                            setToast(t("common.success")); setTimeout(() => setToast(""), 3000);
                          }
                        }} />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">{t("invoices.createInvoice")}<button className="btn btn-icon btn-secondary" onClick={() => setShowCreateModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">{t("invoices.client")} *</label>
                  <select className="input" value={createForm.clientId} onChange={e => setCreateForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">{t("common.select")}</option>
                    {clients.map(c => <option key={c.clientId || c.id} value={c.clientId || c.id}>{c.companyName || `${c.firstName} ${c.lastName}`}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">{t("invoices.startDate")} *</label><input className="input" type="date" value={createForm.startDate} onChange={e => setCreateForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">{t("invoices.endDate")} *</label><input className="input" type="date" value={createForm.endDate} onChange={e => setCreateForm(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={handleCreate}>{t("common.create")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

type Order = {
  id: string; orderNumber: string; status: string; amount: string; customerName: string;
  customerPhone: string; customerCity: string; storeName: string; clientCompanyName: string;
  employeeFirstName: string; employeeLastName: string; deliveryCompanyName: string;
  trackingNumber: string; createdAt: string; priceAtOrder: string; isBilled: boolean;
};

const STATUSES = ["new", "assigned", "calling", "confirmed", "sent_to_delivery", "in_transit", "out_for_delivery", "delivered", "returned", "no_answer", "callback", "cancelled", "delayed"];

export default function OrdersPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<Record<string, unknown> | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callResult, setCallResult] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [savingAction, setSavingAction] = useState(false);
  const [toast, setToast] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) { const d = await res.json(); setOrders(d.items); setTotal(d.total); }
    } catch {} finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const fetchDetail = async (id: string) => {
    setSelectedOrder(id);
    const res = await fetch(`/api/orders/${id}`);
    if (res.ok) setOrderDetail(await res.json());
  };

  const handleCall = async () => {
    if (!selectedOrder || !callResult) return;
    if (callResult === "callback" && !callbackDate) {
      setToast(t("orders.callbackDateRequired"));
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setSavingAction(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callResult,
          notes: callNotes,
          callbackDate: callResult === "callback" ? callbackDate : undefined,
          callbackNotes: callResult === "callback" ? callNotes : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save call result");

      setShowCallModal(false);
      setCallResult("");
      setCallNotes("");
      setCallbackDate("");
      setToast(t("orders.callResultSaved"));
      setTimeout(() => setToast(""), 3000);
      await fetchOrders();
      await fetchDetail(selectedOrder);
    } catch {
      setToast(t("common.error"));
      setTimeout(() => setToast(""), 3000);
    } finally {
      setSavingAction(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setToast(t("common.success")); setTimeout(() => setToast(""), 3000);
    fetchOrders();
    if (selectedOrder === orderId) fetchDetail(orderId);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t("orders.title")}</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-3">
            <input className="input" style={{ maxWidth: 280 }} placeholder={t("orders.searchPlaceholder")}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <select className="input" style={{ maxWidth: 200 }} value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">{t("common.all")}</option>
              {STATUSES.map(s => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
            </select>
            <span className="text-sm text-slate-500 self-center">{t("common.showing")} {orders.length} {t("common.of")} {total}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Orders Table */}
        <div className={`card flex-1 ${selectedOrder ? "hidden lg:block lg:max-w-[60%]" : ""}`}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t("orders.orderNumber")}</th>
                  <th>{t("orders.customer")}</th>
                  <th>{t("orders.city")}</th>
                  <th>{t("orders.amount")}</th>
                  <th>{t("orders.status")}</th>
                  {user?.role === "admin" && <th>{t("orders.assignedTo")}</th>}
                  <th>{t("orders.createdAt")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">{t("orders.noOrders")}</td></tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="cursor-pointer" onClick={() => fetchDetail(order.id)}
                    style={selectedOrder === order.id ? { background: "#eff6ff" } : {}}>
                    <td className="font-mono font-medium text-sm">{order.orderNumber}</td>
                    <td>{order.customerName}</td>
                    <td>{order.customerCity}</td>
                    <td className="font-mono">{formatCurrency(order.amount, locale)}</td>
                    <td><span className={`badge badge-${order.status}`}>{t(`statuses.${order.status}`)}</span></td>
                    {user?.role === "admin" && <td>{order.employeeFirstName ? `${order.employeeFirstName} ${order.employeeLastName}` : "—"}</td>}
                    <td className="text-sm text-slate-500">{formatDate(order.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-center">
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + Math.max(1, page - 2);
                  if (p > totalPages) return null;
                  return <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
                })}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            </div>
          )}
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && orderDetail && (
          <div className="card w-full lg:w-[40%] lg:max-w-[40%]">
            <div className="card-header">
              <span>{t("orders.details")}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedOrder(null); setOrderDetail(null); }}>✕</button>
            </div>
            <div className="card-body space-y-4">
              {(() => {
                const o = orderDetail.order as Record<string, unknown>;
                const items = orderDetail.items as Array<Record<string, unknown>>;
                const history = orderDetail.history as Array<Record<string, unknown>>;
                const calls = orderDetail.calls as Array<Record<string, unknown>>;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-lg">{String(o.orderNumber)}</span>
                      <span className={`badge badge-${String(o.status)}`}>{t(`statuses.${String(o.status)}`)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">{t("orders.customer")}</span><div className="font-medium">{String(o.customerName)}</div></div>
                      <div><span className="text-slate-500">{t("orders.phone")}</span><div className="font-medium">
                        <a href={`tel:${String(o.customerPhone)}`} className="text-blue-600 hover:underline">{String(o.customerPhone)}</a>
                      </div></div>
                      <div><span className="text-slate-500">{t("orders.city")}</span><div className="font-medium">{String(o.customerCity)}</div></div>
                      <div><span className="text-slate-500">{t("orders.amount")}</span><div className="font-bold">{formatCurrency(String(o.amount), locale)}</div></div>
                      {Boolean(o.trackingNumber) && <div><span className="text-slate-500">{t("orders.trackingNumber")}</span><div className="font-mono">{String(o.trackingNumber)}</div></div>}
                    </div>

                    {/* Items */}
                    {items && items.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">{t("orders.items")}</h3>
                        <div className="space-y-1">
                          {items.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className="flex justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                              <span>{String(item.productName)} × {String(item.quantity)}</span>
                              <span className="font-mono">{formatCurrency(String(item.totalPrice), locale)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Call outcome / status actions */}
                    {(user?.role === "employee" || user?.role === "admin") && !["delivered", "returned", "cancelled"].includes(String(o.status)) && (
                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-semibold text-sm">{t("orders.callOutcome")}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{t("orders.callOutcomeHelp")}</p>
                          </div>
                          <a href={`tel:${String(o.customerPhone)}`} className="btn btn-primary btn-sm">☎ {t("orders.callCustomer")}</a>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button className="order-outcome-btn order-outcome-confirmed" onClick={() => { setCallResult("confirmed"); setShowCallModal(true); }}>
                            <span className="order-outcome-icon">✓</span>
                            <span>{t("orders.confirmedOrder")}</span>
                          </button>
                          <button className="order-outcome-btn order-outcome-noanswer" onClick={() => { setCallResult("no_answer"); setShowCallModal(true); }}>
                            <span className="order-outcome-icon">☎</span>
                            <span>{t("orders.noAnswer")}</span>
                          </button>
                          <button className="order-outcome-btn order-outcome-callback" onClick={() => { setCallResult("callback"); setShowCallModal(true); }}>
                            <span className="order-outcome-icon">↻</span>
                            <span>{t("orders.scheduleCallback")}</span>
                          </button>
                          <button className="order-outcome-btn order-outcome-cancelled" onClick={() => { setCallResult("cancelled"); setShowCallModal(true); }}>
                            <span className="order-outcome-icon">×</span>
                            <span>{t("orders.cancel")}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {user?.role === "admin" && String(o.status) === "sent_to_delivery" && (
                      <div className="flex flex-wrap gap-2">
                        <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(selectedOrder, "delivered")}>✓ {t("statuses.delivered")}</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(selectedOrder, "returned")}>↩ {t("statuses.returned")}</button>
                      </div>
                    )}

                    {/* Timeline */}
                    {history && history.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3">{t("orders.timeline")}</h3>
                        <div className="space-y-0">
                          {history.map((h: Record<string, unknown>, i: number) => (
                            <div key={i} className="flex gap-3 relative">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                                {i < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-200" />}
                              </div>
                              <div className="pb-4">
                                <div className="text-sm font-medium">{t(`statuses.${String(h.newStatus)}`)}</div>
                                <div className="text-xs text-slate-400">
                                  {(h.changedByName ? `${String(h.changedByName)} ${String(h.changedByLastName || "")}` : "System") as string} — {h.createdAt ? new Date(String(h.createdAt)).toLocaleString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA") : ""}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Calls */}
                    {calls && calls.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">{t("orders.recordCall")}</h3>
                        {calls.map((c: Record<string, unknown>, i: number) => (
                          <div key={i} className="text-sm bg-slate-50 rounded-lg p-2 mb-1">
                            <span className={`badge badge-${String(c.callResult) === "confirmed" ? "confirmed" : "no_answer"} text-xs`}>{String(c.callResult)}</span>
                            {Boolean(c.notes) && <span className="text-slate-500 ms-2">{String(c.notes)}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Call Result Modal */}
      {showCallModal && (
        <div className="modal-overlay" onClick={() => setShowCallModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {t("orders.callOutcome")}
              <button className="btn btn-icon btn-secondary" onClick={() => setShowCallModal(false)}>✕</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="form-label">{t("orders.status")}</label>
                <select className="input" value={callResult} onChange={(e) => setCallResult(e.target.value)}>
                  <option value="">{t("common.select")}</option>
                  <option value="confirmed">{t("statuses.confirmed")}</option>
                  <option value="no_answer">{t("statuses.no_answer")}</option>
                  <option value="cancelled">{t("statuses.cancelled")}</option>
                  <option value="callback">{t("statuses.callback")}</option>
                </select>
              </div>
              {callResult === "callback" && (
                <div className="form-group">
                  <label className="form-label">{t("orders.callbackDate")}</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={callbackDate}
                    onChange={(e) => setCallbackDate(e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">{t("orders.notes")}</label>
                <textarea className="input" value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={3} placeholder={t("orders.notesPlaceholder")} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCallModal(false); setCallbackDate(""); }}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={handleCall} disabled={!callResult || savingAction || (callResult === "callback" && !callbackDate)}>
                {savingAction ? t("common.loading") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
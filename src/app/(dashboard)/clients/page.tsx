"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

type ApprovalStatus = "pending" | "approved" | "rejected";

type Client = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  clientId: string;
  companyName: string;
  city: string;
  createdAt: string;
};

export default function ClientsPage() {
  const { t, locale, dir } = useI18n();
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    city: "",
    region: "",
    defaultPricePerOrder: "10.00",
    address: "",
  });

  const [toast, setToast] = useState("");
  const [toastError, setToastError] = useState(false);

  const showToast = (message: string, error = false) => {
    setToast(message);
    setToastError(error);

    setTimeout(() => {
      setToast("");
      setToastError(false);
    }, 3000);
  };

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/users?role=client", {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();

        setClients(
          Array.isArray(data.items)
            ? data.items.map((item: Client) => ({
                ...item,
                approvalStatus:
                  item.approvalStatus || "approved",
              }))
            : []
        );
      } else {
        showToast(
          dir === "rtl"
            ? "تعذر تحميل العملاء"
            : "Failed to load clients",
          true
        );
      }
    } catch {
      showToast(
        dir === "rtl"
          ? "حدث خطأ أثناء تحميل العملاء"
          : "Failed to load clients",
        true
      );
    } finally {
      setLoading(false);
    }
  }, [dir]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const pendingClients = clients.filter(
    (client) => client.approvalStatus === "pending"
  );

  const managedClients = clients.filter(
    (client) => client.approvalStatus !== "pending"
  );

  const openCreate = () => {
    setEditId(null);

    setForm({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      companyName: "",
      city: "",
      region: "",
      defaultPricePerOrder: "10.00",
      address: "",
    });

    setShowModal(true);
  };

  const openEdit = (client: Client) => {
    setEditId(client.id);

    setForm({
      email: client.email,
      password: "",
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone || "",
      companyName: client.companyName || "",
      city: client.city || "",
      region: "",
      defaultPricePerOrder: "10.00",
      address: "",
    });

    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editId
        ? `/api/users/${editId}`
        : "/api/users";

      const method = editId ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        ...form,
        role: "client",
      };

      if (editId && !body.password) {
        delete body.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        showToast(
          dir === "rtl"
            ? "تعذر حفظ العميل"
            : "Failed to save client",
          true
        );
        return;
      }

      setShowModal(false);
      await fetchClients();

      showToast(
        dir === "rtl"
          ? "تم حفظ التغييرات بنجاح"
          : "Changes saved successfully"
      );
    } catch {
      showToast(
        dir === "rtl"
          ? "حدث خطأ أثناء الحفظ"
          : "An error occurred",
        true
      );
    }
  };

  const approveClient = async (client: Client) => {
    try {
      setActionLoading(client.id);

      const res = await fetch(`/api/users/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approvalStatus: "approved",
          isActive: true,
        }),
      });

      if (!res.ok) {
        showToast(
          dir === "rtl"
            ? "تعذر قبول طلب العميل"
            : "Failed to approve client",
          true
        );
        return;
      }

      await fetchClients();

      showToast(
        dir === "rtl"
          ? `تم قبول حساب ${client.firstName} ${client.lastName}`
          : `Client ${client.firstName} ${client.lastName} approved`
      );
    } catch {
      showToast(
        dir === "rtl"
          ? "حدث خطأ أثناء قبول الطلب"
          : "Approval failed",
        true
      );
    } finally {
      setActionLoading(null);
    }
  };

  const rejectClient = async (client: Client) => {
    const confirmed = window.confirm(
      dir === "rtl"
        ? `هل أنت متأكد من رفض طلب ${client.firstName} ${client.lastName}؟`
        : `Reject the registration request from ${client.firstName} ${client.lastName}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(client.id);

      const res = await fetch(`/api/users/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approvalStatus: "rejected",
          isActive: false,
        }),
      });

      if (!res.ok) {
        showToast(
          dir === "rtl"
            ? "تعذر رفض الطلب"
            : "Failed to reject request",
          true
        );
        return;
      }

      await fetchClients();

      showToast(
        dir === "rtl"
          ? "تم رفض طلب التسجيل"
          : "Registration request rejected"
      );
    } catch {
      showToast(
        dir === "rtl"
          ? "حدث خطأ أثناء رفض الطلب"
          : "Rejection failed",
        true
      );
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (client: Client) => {
    try {
      setActionLoading(client.id);

      const res = await fetch(`/api/users/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !client.isActive,
        }),
      });

      if (!res.ok) {
        showToast(
          dir === "rtl"
            ? "تعذر تغيير حالة الحساب"
            : "Failed to update account status",
          true
        );
        return;
      }

      await fetchClients();

      showToast(
        dir === "rtl"
          ? "تم تحديث حالة الحساب"
          : "Account status updated"
      );
    } catch {
      showToast(
        dir === "rtl"
          ? "حدث خطأ"
          : "An error occurred",
        true
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`toast ${
            toastError ? "toast-error" : "toast-success"
          }`}
        >
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t("clients.title")}
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            {dir === "rtl"
              ? "إدارة العملاء وطلبات التسجيل الجديدة"
              : "Manage clients and registration requests"}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openCreate}
        >
          + {t("clients.addClient")}
        </button>
      </div>

      {/* Pending requests */}
      <div className="card">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              {dir === "rtl"
                ? "طلبات التسجيل المعلقة"
                : "Pending registration requests"}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {dir === "rtl"
                ? "العملاء الذين ينتظرون موافقتك قبل تفعيل حساباتهم"
                : "Clients waiting for your approval"}
            </p>
          </div>

          <span className="inline-flex min-w-8 h-8 px-2 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
            {pendingClients.length}
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>
                  {dir === "rtl"
                    ? "العميل"
                    : "Client"}
                </th>

                <th>{t("clients.company")}</th>
                <th>{t("clients.email")}</th>
                <th>{t("clients.phone")}</th>

                <th>
                  {dir === "rtl"
                    ? "تاريخ الطلب"
                    : "Request date"}
                </th>

                <th>{t("clients.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10"
                  >
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : pendingClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-slate-500"
                  >
                    {dir === "rtl"
                      ? "لا توجد طلبات تسجيل معلقة حالياً"
                      : "No pending registration requests"}
                  </td>
                </tr>
              ) : (
                pendingClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="font-semibold text-slate-900">
                        {client.firstName}{" "}
                        {client.lastName}
                      </div>

                      <div className="text-xs text-amber-600 mt-1">
                        {dir === "rtl"
                          ? "بانتظار الموافقة"
                          : "Awaiting approval"}
                      </div>
                    </td>

                    <td>
                      {client.companyName || "—"}
                    </td>

                    <td className="text-sm text-slate-500">
                      {client.email}
                    </td>

                    <td>
                      {client.phone || "—"}
                    </td>

                    <td className="text-sm text-slate-500">
                      {formatDate(
                        client.createdAt,
                        locale
                      )}
                    </td>

                    <td>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-success"
                          disabled={
                            actionLoading === client.id
                          }
                          onClick={() =>
                            approveClient(client)
                          }
                        >
                          {actionLoading === client.id
                            ? "..."
                            : dir === "rtl"
                            ? "قبول"
                            : "Approve"}
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          disabled={
                            actionLoading === client.id
                          }
                          onClick={() =>
                            rejectClient(client)
                          }
                        >
                          {dir === "rtl"
                            ? "رفض"
                            : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Existing clients */}
      <div className="card">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">
            {dir === "rtl"
              ? "العملاء"
              : "Clients"}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {dir === "rtl"
              ? "الحسابات المقبولة والمرفوضة وحالة التفعيل"
              : "Approved and rejected client accounts"}
          </p>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("clients.name")}</th>
                <th>{t("clients.company")}</th>
                <th>{t("clients.email")}</th>
                <th>{t("clients.phone")}</th>
                <th>{t("clients.status")}</th>
                <th>{t("common.date")}</th>
                <th>{t("clients.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10"
                  >
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : managedClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-slate-500"
                  >
                    {dir === "rtl"
                      ? "لا يوجد عملاء حالياً"
                      : "No clients found"}
                  </td>
                </tr>
              ) : (
                managedClients.map((client) => {
                  const rejected =
                    client.approvalStatus === "rejected";

                  return (
                    <tr key={client.id}>
                      <td className="font-medium">
                        {client.firstName}{" "}
                        {client.lastName}
                      </td>

                      <td>
                        {client.companyName || "—"}
                      </td>

                      <td className="text-sm text-slate-500">
                        {client.email}
                      </td>

                      <td>
                        {client.phone || "—"}
                      </td>

                      <td>
                        {rejected ? (
                          <span className="badge badge-suspended">
                            {dir === "rtl"
                              ? "مرفوض"
                              : "Rejected"}
                          </span>
                        ) : (
                          <span
                            className={`badge badge-${
                              client.isActive
                                ? "active"
                                : "suspended"
                            }`}
                          >
                            {client.isActive
                              ? dir === "rtl"
                                ? "نشط"
                                : "Active"
                              : dir === "rtl"
                              ? "موقوف"
                              : "Suspended"}
                          </span>
                        )}
                      </td>

                      <td className="text-sm text-slate-500">
                        {formatDate(
                          client.createdAt,
                          locale
                        )}
                      </td>

                      <td>
                        <div className="flex gap-1 flex-wrap">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() =>
                              openEdit(client)
                            }
                          >
                            {t("common.edit")}
                          </button>

                          {!rejected && (
                            <button
                              className={`btn btn-sm ${
                                client.isActive
                                  ? "btn-danger"
                                  : "btn-success"
                              }`}
                              disabled={
                                actionLoading ===
                                client.id
                              }
                              onClick={() =>
                                toggleStatus(client)
                              }
                            >
                              {client.isActive
                                ? t("clients.suspend")
                                : t(
                                    "clients.reactivate"
                                  )}
                            </button>
                          )}

                          {rejected && (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={
                                actionLoading ===
                                client.id
                              }
                              onClick={() =>
                                approveClient(client)
                              }
                            >
                              {dir === "rtl"
                                ? "قبول الحساب"
                                : "Approve account"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              {editId
                ? t("clients.editClient")
                : t("clients.addClient")}

              <button
                className="btn btn-icon btn-secondary"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    {dir === "rtl"
                      ? "الاسم الأول"
                      : "First name"}
                  </label>

                  <input
                    className="input"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        firstName:
                          e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {dir === "rtl"
                      ? "اسم العائلة"
                      : "Last name"}
                  </label>

                  <input
                    className="input"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        lastName:
                          e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("clients.email")}
                  </label>

                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        email:
                          e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("auth.password")}
                  </label>

                  <input
                    className="input"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        password:
                          e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("clients.company")}
                  </label>

                  <input
                    className="input"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        companyName:
                          e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("clients.phone")}
                  </label>

                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        phone:
                          e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("clients.city")}
                  </label>

                  <input
                    className="input"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        city:
                          e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("settings.defaultPrice")}
                  </label>

                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    value={
                      form.defaultPricePerOrder
                    }
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        defaultPricePerOrder:
                          e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() =>
                  setShowModal(false)
                }
              >
                {t("common.cancel")}
              </button>

              <button
                className="btn btn-primary"
                onClick={handleSave}
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

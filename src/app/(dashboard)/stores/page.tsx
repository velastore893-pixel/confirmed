"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import GoogleSheetsConnectCard from "@/components/GoogleSheetsConnectCard";

type Store = {
  id: string;
  name: string;
  status: string;
  url: string | null;
  clientId: string;
  assignedEmployeeId: string | null;
  platformId: string | null;
  deliveryCompanyId: string | null;
  pricePerOrder: string;
  commissionPerOrder?: string;
  clientName?: string | null;
  clientCompanyName?: string | null;
  platformName?: string | null;
  platformSlug?: string | null;
  deliveryName?: string | null;
  connectionStatus?: string | null;
  lastConnectionTestAt?: string | null;
  platformConfig?: {
    googleSheets?: {
      spreadsheetId?: string;
      spreadsheetTitle?: string;
      sheetName?: string;
      sheetGid?: number | null;
      sheetUrl?: string;
      connectedAt?: string;
      lastCheckedAt?: string;
    };
  } | null;
  createdAt: string;
};

type Platform = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
};

const emptyForm = {
  name: "",
  platformId: "",
  url: "",
  assignedEmployeeId: "",
  pricePerOrder: "10.00",
  commissionPerOrder: "3.00",
};

export default function StoresPage() {
  const { t, locale, dir } = useI18n();
  const { user } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const isClient = user?.role === "client";
  const isAdmin = user?.role === "admin";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [storesRes, platformsRes] = await Promise.all([
        fetch("/api/stores", { cache: "no-store" }),
        fetch("/api/platforms", { cache: "no-store" }),
      ]);

      if (!storesRes.ok) {
        throw new Error("Failed to load stores");
      }

      if (!platformsRes.ok) {
        throw new Error("Failed to load platforms");
      }

      const storesData = await storesRes.json();
      const platformsData = await platformsRes.json();

      setStores(storesData.items || []);
      setPlatforms(platformsData.items || []);

      if (isAdmin) {
        const employeesRes = await fetch("/api/users?role=employee", {
          cache: "no-store",
        });

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          setEmployees(employeesData.items || []);
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        dir === "rtl"
          ? "تعذر تحميل بيانات المتاجر. حاول مرة أخرى."
          : locale === "fr"
          ? "Impossible de charger les boutiques. Réessayez."
          : "Unable to load stores. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, dir, locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSuccess = () => {
    setToast(t("common.success"));
    window.setTimeout(() => setToast(""), 3000);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (store: Store) => {
    setEditId(store.id);
    setForm({
      name: store.name || "",
      platformId: store.platformId || "",
      url: store.url || "",
      assignedEmployeeId: store.assignedEmployeeId || "",
      pricePerOrder: store.pricePerOrder || "10.00",
      commissionPerOrder: store.commissionPerOrder || "3.00",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");

    if (!form.name.trim()) {
      setError(
        dir === "rtl"
          ? "اسم المتجر مطلوب."
          : locale === "fr"
          ? "Le nom de la boutique est obligatoire."
          : "Store name is required."
      );
      return;
    }

    if (!form.platformId) {
      setError(
        dir === "rtl"
          ? "اختر منصة المتجر."
          : locale === "fr"
          ? "Sélectionnez la plateforme."
          : "Select a store platform."
      );
      return;
    }

    setSaving(true);

    try {
      const url = editId ? `/api/stores/${editId}` : "/api/stores";
      const method = editId ? "PATCH" : "POST";

      const payload: Record<string, string> = {
        name: form.name.trim(),
        platformId: form.platformId,
        url: form.url.trim(),
      };

      if (isAdmin && editId) {
        payload.assignedEmployeeId = form.assignedEmployeeId;
        payload.pricePerOrder = form.pricePerOrder;
        payload.commissionPerOrder = form.commissionPerOrder;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      setShowModal(false);
      await fetchData();
      showSuccess();
    } catch (err) {
      console.error(err);
      setError(
        dir === "rtl"
          ? "تعذر حفظ المتجر. تحقق من المعلومات وحاول مرة أخرى."
          : locale === "fr"
          ? "Impossible d’enregistrer la boutique."
          : "Unable to save the store."
      );
    } finally {
      setSaving(false);
    }
  };

  const approveStore = async (
    id: string,
    action: "activate" | "reject" | "request_correction",
    notes?: string
  ) => {
    setError("");

    try {
      const res = await fetch(`/api/stores/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });

      if (!res.ok) {
        throw new Error("Approval failed");
      }

      await fetchData();
      showSuccess();
    } catch (err) {
      console.error(err);
      setError(
        dir === "rtl"
          ? "تعذر تحديث حالة المتجر."
          : locale === "fr"
          ? "Impossible de mettre à jour le statut."
          : "Unable to update store status."
      );
    }
  };

  const statusLabel = (status: string) => {
    try {
      return t(`statuses.${status}`);
    } catch {
      return status;
    }
  };

  const heading =
    dir === "rtl"
      ? "المتاجر"
      : locale === "fr"
      ? "Boutiques"
      : "Stores";

  const subheading =
    dir === "rtl"
      ? "أضف متاجرك واربط كل متجر بمنصته. ربط شركات التوصيل يتم بشكل مستقل من قسم التوصيل."
      : locale === "fr"
      ? "Ajoutez vos boutiques et connectez chaque boutique à sa plateforme. La livraison se configure séparément."
      : "Add your stores and connect each one to its platform. Delivery companies are configured separately.";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              {dir === "rtl"
                ? "إدارة المتاجر"
                : locale === "fr"
                ? "Gestion des boutiques"
                : "Store management"}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {heading}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              {subheading}
            </p>
          </div>

          {isClient && (
            <button
              type="button"
              className="btn btn-primary shrink-0"
              onClick={openCreate}
            >
              <span className="text-lg leading-none">+</span>
              {t("stores.addStore")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-3">
          <div className="bg-white p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {dir === "rtl"
                ? "إجمالي المتاجر"
                : locale === "fr"
                ? "Total boutiques"
                : "Total stores"}
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-950">
              {stores.length}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {dir === "rtl"
                ? "النشطة"
                : locale === "fr"
                ? "Actives"
                : "Active"}
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-950">
              {stores.filter((s) => s.status === "active").length}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {dir === "rtl"
                ? "بانتظار المراجعة"
                : locale === "fr"
                ? "En attente"
                : "Pending"}
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-950">
              {stores.filter((s) => s.status === "pending").length}
            </div>
          </div>
        </div>
      </section>


      {isClient && (
        <GoogleSheetsConnectCard
          stores={stores}
          onConnected={fetchData}
        />
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-bold text-slate-950">
            {dir === "rtl"
              ? "قائمة المتاجر"
              : locale === "fr"
              ? "Liste des boutiques"
              : "Store list"}
          </h2>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : stores.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              🏪
            </div>
            <h3 className="font-bold text-slate-900">
              {dir === "rtl"
                ? "لا توجد متاجر بعد"
                : locale === "fr"
                ? "Aucune boutique"
                : "No stores yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {dir === "rtl"
                ? "أضف أول متجر واختر المنصة الخاصة به. شركة التوصيل ستربطها لاحقاً من قسم التوصيل."
                : locale === "fr"
                ? "Ajoutez votre première boutique et choisissez sa plateforme. La livraison sera liée séparément."
                : "Add your first store and choose its platform. Delivery will be connected separately."}
            </p>

            {isClient && (
              <button
                type="button"
                className="btn btn-primary mt-5"
                onClick={openCreate}
              >
                + {t("stores.addStore")}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>{t("stores.storeName")}</th>
                    {isAdmin && <th>{t("stores.client")}</th>}
                    <th>{t("stores.platform")}</th>
                    <th>{t("stores.status")}</th>
                    <th>{t("common.date")}</th>
                    <th>{t("stores.actions")}</th>
                  </tr>
                </thead>

                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id}>
                      <td>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {store.name}
                          </div>
                          {store.url ? (
                            <a
                              href={store.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block max-w-[280px] truncate text-xs text-indigo-600 hover:underline"
                            >
                              {store.url}
                            </a>
                          ) : (
                            <span className="mt-1 block text-xs text-slate-400">
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      {isAdmin && (
                        <td>{store.clientCompanyName || store.clientName || "—"}</td>
                      )}

                      <td>
                        <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-700">
                          {store.platformName || "—"}
                        </span>
                      </td>

                      <td>
                        <span className={`badge badge-${store.status}`}>
                          {statusLabel(store.status)}
                        </span>
                      </td>

                      <td className="text-sm text-slate-500">
                        {formatDate(store.createdAt, locale)}
                      </td>

                      <td>
                        <div className="flex flex-wrap gap-2">
                          {(isClient || isAdmin) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => openEdit(store)}
                            >
                              {t("common.edit")}
                            </button>
                          )}

                          {isAdmin && store.status === "pending" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => approveStore(store.id, "activate")}
                            >
                              {t("stores.activate")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {stores.map((store) => (
                <article
                  key={store.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-950">
                        {store.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {store.platformName || "—"}
                      </p>
                    </div>

                    <span className={`badge badge-${store.status}`}>
                      {statusLabel(store.status)}
                    </span>
                  </div>

                  {store.url && (
                    <a
                      href={store.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block truncate rounded-xl bg-slate-50 px-3 py-2 text-xs text-indigo-600"
                    >
                      {store.url}
                    </a>
                  )}

                  {isAdmin && (
                    <div className="mt-3 text-sm text-slate-500">
                      {t("stores.client")}:{" "}
                      <span className="font-medium text-slate-800">
                        {store.clientCompanyName || store.clientName || "—"}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {(isClient || isAdmin) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEdit(store)}
                      >
                        {t("common.edit")}
                      </button>
                    )}

                    {isAdmin && store.status === "pending" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => approveStore(store.id, "activate")}
                      >
                        {t("stores.activate")}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal w-[calc(100%-24px)] max-w-2xl overflow-hidden rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {dir === "rtl"
                    ? "إعداد المتجر"
                    : locale === "fr"
                    ? "Configuration"
                    : "Store setup"}
                </div>
                <div className="mt-1 text-lg font-bold">
                  {editId ? t("stores.editStore") : t("stores.addStore")}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-icon btn-secondary"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-800">
                {dir === "rtl"
                  ? "هنا تربط المتجر بالمنصة فقط. معلومات شركة التوصيل لا تُدخل هنا؛ يتم ربطها بشكل مستقل من قسم التوصيل."
                  : locale === "fr"
                  ? "Ici, vous configurez uniquement la plateforme de la boutique. La livraison se connecte séparément."
                  : "This section is only for the store platform. Delivery credentials are connected separately."}
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="form-group sm:col-span-2">
                  <label className="form-label">{t("stores.storeName")}</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        name: e.target.value,
                      }))
                    }
                    placeholder={
                      dir === "rtl"
                        ? "مثال: متجر الدار البيضاء"
                        : "My Store"
                    }
                  />
                </div>

                <div className="form-group sm:col-span-2">
                  <label className="form-label">
                    {t("stores.selectPlatform")}
                  </label>
                  <select
                    className="input"
                    value={form.platformId}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        platformId: e.target.value,
                      }))
                    }
                  >
                    <option value="">{t("common.select")}</option>
                    {platforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.icon ? `${platform.icon} ` : ""}
                        {platform.name}
                      </option>
                    ))}
                  </select>

                  {platforms.length === 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      {dir === "rtl"
                        ? "لا توجد منصات متاحة حالياً."
                        : locale === "fr"
                        ? "Aucune plateforme disponible."
                        : "No platforms are currently available."}
                    </p>
                  )}
                </div>

                <div className="form-group sm:col-span-2">
                  <label className="form-label">{t("stores.url")}</label>
                  <input
                    className="input"
                    type="url"
                    dir="ltr"
                    value={form.url}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>

                {isAdmin && editId && (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        {t("stores.assignedEmployee")}
                      </label>
                      <select
                        className="input"
                        value={form.assignedEmployeeId}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            assignedEmployeeId: e.target.value,
                          }))
                        }
                      >
                        <option value="">{t("common.select")}</option>
                        {employees.map((employee) => (
                          <option
                            key={employee.employeeId || employee.id}
                            value={employee.employeeId || employee.id}
                          >
                            {employee.firstName} {employee.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {t("stores.pricePerOrder")}
                      </label>
                      <input
                        className="input"
                        type="number"
                        step="0.5"
                        value={form.pricePerOrder}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            pricePerOrder: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? dir === "rtl"
                    ? "جاري الحفظ..."
                    : locale === "fr"
                    ? "Enregistrement..."
                    : "Saving..."
                  : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

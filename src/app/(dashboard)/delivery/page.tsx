"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";

type DeliveryConfig = {
  testPath?: string;
  authType?: string;
  apiKeyHeader?: string;
  authHeader?: string;
  authPrefix?: string;
  testMethod?: string;
  integrationState?: "ready" | "needs_documentation" | "manual";
  notes?: string;
};

type ClientConnection = {
  id: string;
  deliveryCompanyId: string;
  connectionStatus: "not_tested" | "connected" | "failed" | string;
  lastTestAt?: string | null;
  isActive: boolean;
};

type DeliveryCompany = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  hasApi: boolean;
  codAvailable: boolean;
  cities: string[];
  regions: string[];
  apiBaseUrl?: string;
  config?: DeliveryConfig;
};

const defaultForm = {
  name: "",
  slug: "",
  hasApi: false,
  codAvailable: true,
  cities: "",
  regions: "",
  apiBaseUrl: "",
  testPath: "",
  authType: "bearer",
  apiKeyHeader: "X-API-Key",
  authHeader: "Authorization",
  authPrefix: "",
};

export default function DeliveryPage() {
  const { t, dir } = useI18n();
  const { user } = useAuth();

  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery", {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setCompanies(data.items || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreate = () => {
    setEditId(null);
    setError("");
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (company: DeliveryCompany) => {
    setEditId(company.id);
    setError("");

    setForm({
      name: company.name,
      slug: company.slug,
      hasApi: company.hasApi,
      codAvailable: company.codAvailable,
      cities: (company.cities || []).join(", "),
      regions: (company.regions || []).join(", "),
      apiBaseUrl: company.apiBaseUrl || "",
      testPath: company.config?.testPath || "",
      authType: company.config?.authType || "bearer",
      apiKeyHeader: company.config?.apiKeyHeader || "X-API-Key",
      authHeader: company.config?.authHeader || "Authorization",
      authPrefix: company.config?.authPrefix || "",
    });

    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");

    if (!form.name.trim() || !form.slug.trim()) {
      setError(
        dir === "rtl"
          ? "اسم الشركة والمعرف مطلوبان."
          : "Company name and slug are required."
      );
      return;
    }

    if (
      form.hasApi &&
      (!form.apiBaseUrl.trim() || !form.testPath.trim())
    ) {
      setError(
        dir === "rtl"
          ? "شركة API خاصها API Base URL و Test Path."
          : "API companies require an API Base URL and Test Path."
      );
      return;
    }

    setSaving(true);

    try {
      const url = editId
        ? `/api/delivery/${editId}`
        : "/api/delivery";

      const method = editId ? "PATCH" : "POST";

      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        hasApi: form.hasApi,
        codAvailable: form.codAvailable,
        apiBaseUrl: form.apiBaseUrl.trim() || null,

        cities: form.cities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        regions: form.regions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        config: {
          testPath: form.testPath.trim(),
          authType: form.authType,
          apiKeyHeader: form.apiKeyHeader.trim(),
          authHeader: form.authHeader.trim(),
          authPrefix: form.authPrefix,
          testMethod: "GET",
        },
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchCompanies();

        setToast(
          dir === "rtl"
            ? "تم حفظ شركة التوصيل بنجاح"
            : "Delivery company saved successfully"
        );

        setTimeout(() => setToast(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));

        setError(
          data.error ||
            (dir === "rtl"
              ? "تعذر حفظ شركة التوصيل"
              : "Could not save delivery company")
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const authLabel = (company: DeliveryCompany) => {
    const type = company.config?.authType;

    if (!company.hasApi) return "Manual";

    if (type === "custom") {
      return company.config?.authHeader || "Custom Header";
    }

    if (type === "api_key") return "API Key";
    if (type === "basic") return "Basic Auth";
    if (type === "none") return "No Auth";

    return "Bearer Token";
  };

  if (user?.role === "client") {
    return <ClientDeliveryPanel companies={companies} loading={loading} dir={dir} />;
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            {dir === "rtl"
              ? "ليس لديك صلاحية لعرض هذه الصفحة."
              : "You do not have permission to view this page."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-7">
      {toast && (
        <div className="toast toast-success">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            CODFlow
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {dir === "rtl"
              ? "شركات التوصيل"
              : "Delivery Companies"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {dir === "rtl"
              ? "أدر شركات التوصيل وإعدادات الربط من مكان واحد. الكليان غادي يشوف غير الشركات المهيأة والمتاحة."
              : "Manage delivery providers and their API connection settings from one place."}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>

          {dir === "rtl"
            ? "إضافة شركة"
            : "Add Company"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">
            {dir === "rtl" ? "إجمالي الشركات" : "Total"}
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {companies.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">
            {dir === "rtl" ? "API" : "API"}
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {companies.filter((c) => c.hasApi).length}
          </div>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-1">
          <div className="text-xs font-medium text-slate-500">
            {dir === "rtl" ? "الشركات النشطة" : "Active"}
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {companies.filter((c) => c.isActive).length}
          </div>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="spinner" />
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M3 7h18M5 7l1 13h12l1-13M9 11v5M15 11v5M8 7l1-3h6l1 3" />
            </svg>
          </div>

          <h3 className="font-semibold text-slate-900">
            {dir === "rtl"
              ? "ما كايناش شركات توصيل"
              : "No delivery companies"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {dir === "rtl"
              ? "بدا بإضافة أول شركة توصيل."
              : "Start by adding your first delivery provider."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {companies.map((company) => {
            const isSift =
              company.slug === "sift-livraison" ||
              company.slug === "sift";

            return (
              <div
                key={company.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
                        <svg
                          width="23"
                          height="23"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M3 6h13v10H3z" />
                          <path d="M16 9h3l2 3v4h-5z" />
                          <circle cx="7" cy="18" r="2" />
                          <circle cx="18" cy="18" r="2" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-bold text-slate-950">
                            {company.name}
                          </h3>

                          {isSift && (
                            <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">
                              SIFT
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {company.slug}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        company.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          company.isActive
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />

                      {company.isActive
                        ? dir === "rtl"
                          ? "نشط"
                          : "Active"
                        : dir === "rtl"
                        ? "غير نشط"
                        : "Inactive"}
                    </span>
                  </div>

                  <div className="my-5 h-px bg-slate-100" />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3.5">
                      <div className="text-[11px] font-medium text-slate-400">
                        {dir === "rtl"
                          ? "نوع الربط"
                          : "Connection"}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-800">
                        {company.hasApi ? "API" : "Manual"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3.5">
                      <div className="text-[11px] font-medium text-slate-400">
                        {dir === "rtl"
                          ? "المصادقة"
                          : "Authentication"}
                      </div>

                      <div className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {authLabel(company)}
                      </div>
                    </div>
                  </div>

                  {company.hasApi && (
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        API Base URL
                      </div>

                      <div
                        dir="ltr"
                        className="truncate text-sm font-medium text-slate-700"
                      >
                        {company.apiBaseUrl || "—"}
                      </div>

                      {isSift &&
                        company.config?.authHeader === "Special-Token" && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>

                            Special-Token configured
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                  <div className="text-xs text-slate-400">
                    {company.codAvailable
                      ? dir === "rtl"
                        ? "الدفع عند الاستلام متاح"
                        : "COD available"
                      : dir === "rtl"
                      ? "COD غير متاح"
                      : "COD unavailable"}
                  </div>

                  <button
                    onClick={() => openEdit(company)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" />
                    </svg>

                    {dir === "rtl"
                      ? "تعديل الإعدادات"
                      : "Edit settings"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setShowModal(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {editId
                    ? dir === "rtl"
                      ? "تعديل شركة التوصيل"
                      : "Edit Delivery Company"
                    : dir === "rtl"
                    ? "إضافة شركة توصيل"
                    : "Add Delivery Company"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {dir === "rtl"
                    ? "هيّئ المعلومات العامة وربط الـAPI."
                    : "Configure company information and API connection."}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(92vh-140px)] overflow-y-auto px-5 py-5 sm:px-6">
              {error && (
                <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-7">
                {/* General */}
                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      {dir === "rtl"
                        ? "المعلومات العامة"
                        : "General information"}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {dir === "rtl"
                        ? "اسم الشركة والمعرف وطريقة العمل."
                        : "Company identity and connection mode."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        {dir === "rtl" ? "اسم الشركة" : "Company name"}
                      </label>

                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Slug
                      </label>

                      <input
                        dir="ltr"
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        value={form.slug}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            slug: e.target.value,
                          }))
                        }
                        placeholder="sift-livraison"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        {dir === "rtl"
                          ? "نوع الربط"
                          : "Connection mode"}
                      </label>

                      <select
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        value={form.hasApi ? "yes" : "no"}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            hasApi: e.target.value === "yes",
                          }))
                        }
                      >
                        <option value="yes">API</option>
                        <option value="no">Manual</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        COD
                      </label>

                      <select
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        value={form.codAvailable ? "yes" : "no"}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            codAvailable:
                              e.target.value === "yes",
                          }))
                        }
                      >
                        <option value="yes">
                          {dir === "rtl" ? "متاح" : "Available"}
                        </option>
                        <option value="no">
                          {dir === "rtl" ? "غير متاح" : "Unavailable"}
                        </option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Coverage */}
                <section className="border-t border-slate-100 pt-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      {dir === "rtl"
                        ? "التغطية"
                        : "Coverage"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        {dir === "rtl" ? "المدن" : "Cities"}
                      </label>

                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        value={form.cities}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            cities: e.target.value,
                          }))
                        }
                        placeholder="Casablanca, Rabat, Marrakech"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        {dir === "rtl"
                          ? "المناطق"
                          : "Regions"}
                      </label>

                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        value={form.regions}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            regions: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* API */}
                {form.hasApi && (
                  <section className="border-t border-slate-100 pt-6">
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <div className="mt-0.5 text-indigo-600">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {dir === "rtl"
                            ? "إعداد API"
                            : "API configuration"}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {dir === "rtl"
                            ? "هاد الإعدادات كيديرها الـAdmin مرة وحدة. الكليان غادي يدخل غير بيانات الحساب ديالو."
                            : "These settings are configured once by the admin. Clients only provide their credentials."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          API Base URL
                        </label>

                        <input
                          dir="ltr"
                          className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                          value={form.apiBaseUrl}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              apiBaseUrl: e.target.value,
                            }))
                          }
                          placeholder="https://app.siftlivraison.com"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Test Path
                        </label>

                        <input
                          dir="ltr"
                          className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                          value={form.testPath}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              testPath: e.target.value,
                            }))
                          }
                          placeholder="/api/client/get/list-status"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Authentication
                        </label>

                        <select
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                          value={form.authType}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              authType: e.target.value,
                            }))
                          }
                        >
                          <option value="bearer">
                            Bearer Token
                          </option>

                          <option value="api_key">
                            API Key Header
                          </option>

                          <option value="basic">
                            Username + Password
                          </option>

                          <option value="custom">
                            Custom Header
                          </option>

                          <option value="none">
                            No authentication
                          </option>
                        </select>
                      </div>

                      {form.authType === "api_key" && (
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                            API Key Header
                          </label>

                          <input
                            dir="ltr"
                            className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                            value={form.apiKeyHeader}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                apiKeyHeader: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}

                      {form.authType === "custom" && (
                        <>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Auth Header
                            </label>

                            <input
                              dir="ltr"
                              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                              value={form.authHeader}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  authHeader: e.target.value,
                                }))
                              }
                              placeholder="Special-Token"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Prefix
                            </label>

                            <input
                              dir="ltr"
                              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                              value={form.authPrefix}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  authPrefix: e.target.value,
                                }))
                              }
                              placeholder={
                                dir === "rtl"
                                  ? "خليه فارغ إذا ما كاينش Prefix"
                                  : "Leave empty if no prefix"
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
              <button
                onClick={() => setShowModal(false)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {dir === "rtl" ? "إلغاء" : "Cancel"}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-10 min-w-[110px] items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 disabled:opacity-60"
              >
                {saving
                  ? dir === "rtl"
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : dir === "rtl"
                  ? "حفظ التغييرات"
                  : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientDeliveryPanel({
  companies,
  loading,
  dir,
}: {
  companies: DeliveryCompany[];
  loading: boolean;
  dir: string;
}) {
  const [connections, setConnections] = useState<ClientConnection[]>([]);
  const [selected, setSelected] = useState<DeliveryCompany | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/client-delivery-connections", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setConnections(data.items || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const getConnection = (companyId: string) =>
    connections.find((item) => item.deliveryCompanyId === companyId);

  const credentialFields = (company: DeliveryCompany) => {
    if (!company.hasApi) return [];

    const authType = company.config?.authType || "bearer";
    const isSift =
      company.slug === "sift" ||
      company.slug === "sift-livraison" ||
      company.config?.authHeader === "Special-Token";

    if (isSift) {
      return [
        {
          key: "special_token",
          label: "Special-Token",
          type: "password",
        },
      ];
    }

    if (authType === "basic") {
      return [
        { key: "username", label: "Username", type: "text" },
        { key: "password", label: "Password", type: "password" },
      ];
    }

    if (authType === "api_key") {
      return [
        {
          key: "api_key",
          label: company.config?.apiKeyHeader || "API Key",
          type: "password",
        },
      ];
    }

    if (authType === "custom") {
      return [
        {
          key: "token",
          label: company.config?.authHeader || "Token",
          type: "password",
        },
      ];
    }

    if (authType === "none") return [];

    return [{ key: "token", label: "Bearer Token", type: "password" }];
  };

  const openConnect = (company: DeliveryCompany) => {
    setSelected(company);
    setCredentials({});
    setMessage("");
    setError("");
  };

  const saveConnection = async () => {
    if (!selected) return;

    const fields = credentialFields(selected);
    const missing = fields.find((field) => !credentials[field.key]?.trim());

    if (missing) {
      setError(
        dir === "rtl"
          ? `دخل ${missing.label}`
          : `${missing.label} is required`,
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/client-delivery-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryCompanyId: selected.id,
          credentials,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }

      await loadConnections();
      setMessage(
        dir === "rtl"
          ? "تم حفظ معلومات الربط. دابا دير اختبار الاتصال."
          : "Connection details saved. Now test the connection.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : dir === "rtl"
          ? "تعذر حفظ الربط"
          : "Could not save connection",
      );
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (companyId: string) => {
    setTestingId(companyId);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/client-delivery-connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCompanyId: companyId }),
      });

      const data = await res.json().catch(() => ({}));

      await loadConnections();

      if (!res.ok) {
        setError(
          data.error ||
            data.message ||
            (dir === "rtl" ? "فشل اختبار الاتصال" : "Connection test failed"),
        );
        return;
      }

      setMessage(
        dir === "rtl"
          ? "تم الاتصال بشركة التوصيل بنجاح."
          : "Delivery company connected successfully.",
      );
    } catch {
      setError(
        dir === "rtl"
          ? "وقع مشكل أثناء اختبار الاتصال."
          : "Connection test failed unexpectedly.",
      );
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const activeCompanies = companies.filter((company) => company.isActive);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            CODFlow
          </div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            {dir === "rtl" ? "شركة التوصيل" : "Delivery Company"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            {dir === "rtl"
              ? "اختار شركة التوصيل ديالك، دخل معلومات الربط، ومن بعد جرّب الاتصال. منين تولي Connected غادي نستعمل هاد الربط لإرسال الطلبات المؤكدة لاحقاً."
              : "Choose your delivery provider, enter your connection details, then test the connection."}
          </p>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {activeCompanies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h3 className="font-bold text-slate-900">
            {dir === "rtl"
              ? "ما كايناش شركات توصيل متاحة حالياً"
              : "No delivery companies available"}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeCompanies.map((company) => {
            const connection = getConnection(company.id);
            const status = connection?.connectionStatus || "not_connected";
            const connected = status === "connected";

            return (
              <article
                key={company.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <svg
                          width="23"
                          height="23"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M3 6h13v10H3z" />
                          <path d="M16 9h3l2 3v4h-5z" />
                          <circle cx="7" cy="18" r="2" />
                          <circle cx="18" cy="18" r="2" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-slate-950">
                          {company.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {company.hasApi ? "API" : "Manual"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        connected
                          ? "bg-emerald-50 text-emerald-700"
                          : status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {connected
                        ? "Connected"
                        : status === "failed"
                        ? "Failed"
                        : dir === "rtl"
                        ? "غير مربوط"
                        : "Not connected"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openConnect(company)}
                      className="btn btn-primary"
                    >
                      {connection
                        ? dir === "rtl"
                          ? "تحديث معلومات الربط"
                          : "Update connection"
                        : dir === "rtl"
                        ? "ربط الشركة"
                        : "Connect"}
                    </button>

                    {connection && (
                      <button
                        type="button"
                        onClick={() => testConnection(company.id)}
                        disabled={testingId === company.id}
                        className="btn btn-secondary"
                      >
                        {testingId === company.id
                          ? dir === "rtl"
                            ? "جاري الاختبار..."
                            : "Testing..."
                          : "Test Connection"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {selected.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {dir === "rtl"
                    ? "دخل معلومات حساب شركة التوصيل ديالك."
                    : "Enter your delivery account credentials."}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-icon btn-secondary"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-5">
              {credentialFields(selected).length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  {selected.hasApi
                    ? dir === "rtl"
                      ? "هاد الشركة ما كتحتاج حتى معلومة مصادقة إضافية."
                      : "This provider does not require additional credentials."
                    : dir === "rtl"
                    ? "هاد الشركة مهيأة بنظام يدوي وما كتحتاجش API."
                    : "This provider is configured for manual delivery."}
                </div>
              ) : (
                credentialFields(selected).map((field) => (
                  <div key={field.key}>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      {field.label}
                    </label>
                    <input
                      className="input"
                      type={field.type}
                      dir="ltr"
                      autoComplete="off"
                      value={credentials[field.key] || ""}
                      onChange={(e) =>
                        setCredentials((current) => ({
                          ...current,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))
              )}

              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                {dir === "rtl"
                  ? "معلومات الربط كتتحفظ مشفرة. ما تشاركش Token ديالك مع أي شخص."
                  : "Connection credentials are stored encrypted."}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
                disabled={saving}
              >
                {dir === "rtl" ? "إلغاء" : "Cancel"}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={saveConnection}
                disabled={saving}
              >
                {saving
                  ? dir === "rtl"
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : dir === "rtl"
                  ? "حفظ معلومات الربط"
                  : "Save connection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



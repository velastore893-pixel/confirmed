"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type DeliveryCompany = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  isActive: boolean;
  hasApi: boolean;
  codAvailable: boolean;
  cities: string[];
  regions: string[];
  apiBaseUrl?: string | null;
  config?: DeliveryConfig;
};

type ClientConnection = {
  id: string;
  deliveryCompanyId: string;
  connectionStatus: string;
  lastTestAt?: string | null;
  isActive: boolean;
};

type CredentialField = {
  key: string;
  label: string;
  type: "text" | "password";
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

function TruckIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
    </svg>
  );
}

function TestIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3h6" />
      <path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
      <path d="M8.5 15h7" />
    </svg>
  );
}

export default function DeliveryPage() {
  const { dir, locale } = useI18n();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isClient = user?.role === "client";

  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [connections, setConnections] = useState<ClientConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [clientModalCompany, setClientModalCompany] = useState<DeliveryCompany | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState(defaultForm);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const copy = useMemo(() => ({
    title: dir === "rtl" ? "شركات التوصيل" : locale === "fr" ? "Sociétés de livraison" : "Delivery Companies",
    subtitle: isAdmin
      ? dir === "rtl"
        ? "أدر شركات التوصيل وإعدادات الربط من مكان واحد بطريقة واضحة ومنظمة."
        : "Manage delivery providers and integration settings from one place."
      : dir === "rtl"
      ? "اختار شركة التوصيل ديالك واربط الحساب باش نقدر نصيفط الطلبات المؤكدة تلقائياً."
      : "Choose your delivery company and connect your account for automatic shipment creation.",
    total: dir === "rtl" ? "إجمالي الشركات" : "Total companies",
    api: dir === "rtl" ? "شركات API" : "API providers",
    active: dir === "rtl" ? "الشركات النشطة" : "Active providers",
    connected: dir === "rtl" ? "الشركات المربوطة" : "Connected",
    add: dir === "rtl" ? "إضافة شركة" : "Add company",
    noCompanies: dir === "rtl" ? "ما كايناش شركات توصيل متاحة حالياً." : "No delivery companies are available.",
    save: dir === "rtl" ? "حفظ التغييرات" : "Save changes",
    cancel: dir === "rtl" ? "إلغاء" : "Cancel",
  }), [dir, locale, isAdmin]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/delivery", { cache: "no-store" });
      if (!res.ok) throw new Error("delivery_load_failed");
      const data = await res.json();
      setCompanies(data.items || []);

      if (isClient) {
        const cRes = await fetch("/api/client-delivery-connections", { cache: "no-store" });
        if (cRes.ok) {
          const cData = await cRes.json();
          setConnections(cData.items || []);
        }
      }
    } catch (e) {
      console.error(e);
      setError(
        dir === "rtl"
          ? "تعذر تحميل شركات التوصيل. حاول مرة أخرى."
          : "Unable to load delivery companies."
      );
    } finally {
      setLoading(false);
    }
  }, [dir, isClient]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const authLabel = (company: DeliveryCompany) => {
    const type = company.config?.authType;
    if (!company.hasApi) return "Manual";
    if (type === "custom") return company.config?.authHeader || "Custom Header";
    if (type === "api_key") return "API Key";
    if (type === "basic") return "Basic Auth";
    if (type === "none") return "No Auth";
    return "Bearer Token";
  };

  const getConnection = (companyId: string) =>
    connections.find((item) => item.deliveryCompanyId === companyId);

  const credentialFields = (company: DeliveryCompany): CredentialField[] => {
    if (!company.hasApi) return [];

    const authType = company.config?.authType || "bearer";
    const isSift =
      company.slug === "sift" ||
      company.slug === "sift-livraison" ||
      company.config?.authHeader === "Special-Token";

    if (isSift) {
      return [{ key: "special_token", label: "Special-Token", type: "password" }];
    }

    if (authType === "basic") {
      return [
        { key: "username", label: "Username", type: "text" },
        { key: "password", label: "Password", type: "password" },
      ];
    }

    if (authType === "api_key") {
      return [{
        key: "api_key",
        label: company.config?.apiKeyHeader || "API Key",
        type: "password",
      }];
    }

    if (authType === "custom") {
      return [{
        key: "token",
        label: company.config?.authHeader || "Token",
        type: "password",
      }];
    }

    if (authType === "none") return [];

    return [{ key: "token", label: "Bearer Token", type: "password" }];
  };

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setError("");
    setAdminModalOpen(true);
  };

  const openEdit = (company: DeliveryCompany) => {
    setEditId(company.id);
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
    setError("");
    setAdminModalOpen(true);
  };

  const saveAdminCompany = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setError(dir === "rtl" ? "اسم الشركة والمعرف مطلوبان." : "Company name and slug are required.");
      return;
    }

    if (form.hasApi && (!form.apiBaseUrl.trim() || !form.testPath.trim())) {
      setError(dir === "rtl" ? "API Base URL و Test Path مطلوبان." : "API Base URL and Test Path are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(editId ? `/api/delivery/${editId}` : "/api/delivery", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          hasApi: form.hasApi,
          codAvailable: form.codAvailable,
          apiBaseUrl: form.apiBaseUrl.trim() || null,
          cities: form.cities.split(",").map((x) => x.trim()).filter(Boolean),
          regions: form.regions.split(",").map((x) => x.trim()).filter(Boolean),
          config: {
            testPath: form.testPath.trim(),
            authType: form.authType,
            apiKeyHeader: form.apiKeyHeader.trim(),
            authHeader: form.authHeader.trim(),
            authPrefix: form.authPrefix,
            testMethod: "GET",
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "save_failed");

      setAdminModalOpen(false);
      await fetchCompanies();
      showToast(dir === "rtl" ? "تم حفظ شركة التوصيل بنجاح" : "Delivery company saved successfully");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openClientConnect = (company: DeliveryCompany) => {
    setClientModalCompany(company);
    setCredentials({});
    setError("");
  };

  const saveClientConnection = async () => {
    if (!clientModalCompany) return;

    const fields = credentialFields(clientModalCompany);
    const missing = fields.find((field) => !credentials[field.key]?.trim());

    if (missing) {
      setError(dir === "rtl" ? `دخل ${missing.label}` : `${missing.label} is required`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/client-delivery-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryCompanyId: clientModalCompany.id,
          credentials,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "save_failed");

      await fetchCompanies();
      showToast(dir === "rtl" ? "تم حفظ معلومات الربط" : "Connection saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (companyId: string) => {
    setTestingId(companyId);
    setError("");

    try {
      const res = await fetch("/api/client-delivery-connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCompanyId: companyId }),
      });

      const data = await res.json().catch(() => ({}));
      await fetchCompanies();

      if (!res.ok) {
        throw new Error(
          data.error ||
          data.message ||
          (dir === "rtl" ? "فشل اختبار الاتصال" : "Connection test failed")
        );
      }

      showToast(dir === "rtl" ? "تم الاتصال بنجاح" : "Connection successful");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection test failed");
    } finally {
      setTestingId(null);
    }
  };

  if (user?.role === "employee") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <TruckIcon />
        </div>
        <p className="text-sm text-slate-500">
          {dir === "rtl" ? "ليس لديك صلاحية لعرض هذه الصفحة." : "You do not have permission to view this page."}
        </p>
      </div>
    );
  }

  const visibleCompanies = isClient ? companies.filter((c) => c.isActive) : companies;
  const connectedCount = connections.filter((c) => c.connectionStatus === "connected").length;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}

      <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.05)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-blue-500" />

        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
              <TruckIcon size={24} />
            </div>

            <div className="min-w-0">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                CODFlow
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {copy.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                {copy.subtitle}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
            >
              <span className="text-lg leading-none">+</span>
              {copy.add}
            </button>
          )}
        </div>
      </section>

      <section className={`grid grid-cols-2 gap-3 ${isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-3"}`}>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="text-xs font-semibold text-slate-400">{copy.total}</div>
          <div className="mt-2 text-3xl font-bold text-slate-950">{visibleCompanies.length}</div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="text-xs font-semibold text-slate-400">{isClient ? copy.connected : copy.api}</div>
          <div className="mt-2 text-3xl font-bold text-indigo-600">
            {isClient ? connectedCount : companies.filter((c) => c.hasApi).length}
          </div>
        </article>

        <article className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-1">
          <div className="text-xs font-semibold text-slate-400">{copy.active}</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">
            {companies.filter((c) => c.isActive).length}
          </div>
        </article>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[340px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
          <div className="spinner" />
        </div>
      ) : visibleCompanies.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <TruckIcon />
          </div>
          <h3 className="font-semibold text-slate-900">{copy.noCompanies}</h3>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibleCompanies.map((company) => {
            const connection = getConnection(company.id);
            const status = connection?.connectionStatus || "not_connected";
            const connected = status === "connected";

            return (
              <article
                key={company.id}
                className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
                        {company.logo ? (
                          <img src={company.logo} alt="" className="h-full w-full object-contain p-2" />
                        ) : (
                          <TruckIcon size={23} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-slate-950">{company.name}</h3>
                        <div className="mt-1 text-xs text-slate-400">{company.slug}</div>
                      </div>
                    </div>

                    {isAdmin ? (
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        company.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${company.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {company.isActive ? (dir === "rtl" ? "نشط" : "Active") : (dir === "rtl" ? "غير نشط" : "Inactive")}
                      </span>
                    ) : (
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        connected ? "bg-emerald-50 text-emerald-700" :
                        status === "failed" ? "bg-red-50 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          connected ? "bg-emerald-500" : status === "failed" ? "bg-red-500" : "bg-slate-400"
                        }`} />
                        {connected ? "Connected" : status === "failed" ? "Failed" : (dir === "rtl" ? "غير مربوط" : "Not connected")}
                      </span>
                    )}
                  </div>

                  <div className="my-5 h-px bg-slate-100" />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3.5">
                      <div className="text-[11px] font-semibold text-slate-400">
                        {dir === "rtl" ? "نوع الربط" : "Connection"}
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-800">
                        {company.hasApi ? "API" : "Manual"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3.5">
                      <div className="text-[11px] font-semibold text-slate-400">
                        {dir === "rtl" ? "المصادقة" : "Authentication"}
                      </div>
                      <div className="mt-1 truncate text-sm font-bold text-slate-800">
                        {authLabel(company)}
                      </div>
                    </div>
                  </div>

                  {isAdmin && company.hasApi && (
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        API Base URL
                      </div>
                      <div dir="ltr" className="truncate text-sm font-medium text-slate-700">
                        {company.apiBaseUrl || "—"}
                      </div>
                    </div>
                  )}

                  {isClient && connection?.lastTestAt && (
                    <div className="mt-3 text-xs text-slate-400">
                      {dir === "rtl" ? "آخر اختبار:" : "Last test:"}{" "}
                      {new Date(connection.lastTestAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="text-xs text-slate-400">
                    {company.codAvailable
                      ? dir === "rtl" ? "الدفع عند الاستلام متاح" : "COD available"
                      : dir === "rtl" ? "COD غير متاح" : "COD unavailable"}
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => openEdit(company)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                    >
                      <EditIcon />
                      {dir === "rtl" ? "تعديل الإعدادات" : "Edit settings"}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openClientConnect(company)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm"
                      >
                        <LinkIcon />
                        {connection
                          ? dir === "rtl" ? "إدارة الربط" : "Manage"
                          : dir === "rtl" ? "ربط الشركة" : "Connect"}
                      </button>

                      {connection && (
                        <button
                          type="button"
                          onClick={() => testConnection(company.id)}
                          disabled={testingId === company.id}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
                        >
                          <TestIcon />
                          {testingId === company.id
                            ? dir === "rtl" ? "جاري الاختبار..." : "Testing..."
                            : "Test"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {adminModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setAdminModalOpen(false)}>
          <div className="max-h-[92vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-w-3xl sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
                  {dir === "rtl" ? "إعدادات الشركة" : "Provider settings"}
                </div>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {editId
                    ? dir === "rtl" ? "تعديل شركة التوصيل" : "Edit delivery company"
                    : dir === "rtl" ? "إضافة شركة توصيل" : "Add delivery company"}
                </h2>
              </div>
              <button type="button" onClick={() => setAdminModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500">✕</button>
            </div>

            <div className="max-h-[calc(92vh-145px)] overflow-y-auto px-5 py-5 sm:px-6">
              {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

              <div className="space-y-7">
                <section>
                  <h3 className="mb-4 text-sm font-bold text-slate-900">{dir === "rtl" ? "المعلومات العامة" : "General information"}</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={dir === "rtl" ? "اسم الشركة" : "Company name"}>
                      <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                    </Field>

                    <Field label="Slug">
                      <input dir="ltr" className="input" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                    </Field>

                    <Field label={dir === "rtl" ? "نوع الربط" : "Connection mode"}>
                      <select className="input" value={form.hasApi ? "yes" : "no"} onChange={(e) => setForm((f) => ({ ...f, hasApi: e.target.value === "yes" }))}>
                        <option value="yes">API</option>
                        <option value="no">Manual</option>
                      </select>
                    </Field>

                    <Field label="COD">
                      <select className="input" value={form.codAvailable ? "yes" : "no"} onChange={(e) => setForm((f) => ({ ...f, codAvailable: e.target.value === "yes" }))}>
                        <option value="yes">{dir === "rtl" ? "متاح" : "Available"}</option>
                        <option value="no">{dir === "rtl" ? "غير متاح" : "Unavailable"}</option>
                      </select>
                    </Field>
                  </div>
                </section>

                <section className="border-t border-slate-100 pt-6">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">{dir === "rtl" ? "التغطية" : "Coverage"}</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={dir === "rtl" ? "المدن" : "Cities"}>
                      <input className="input" value={form.cities} onChange={(e) => setForm((f) => ({ ...f, cities: e.target.value }))} placeholder="Casablanca, Rabat..." />
                    </Field>
                    <Field label={dir === "rtl" ? "المناطق" : "Regions"}>
                      <input className="input" value={form.regions} onChange={(e) => setForm((f) => ({ ...f, regions: e.target.value }))} />
                    </Field>
                  </div>
                </section>

                {form.hasApi && (
                  <section className="border-t border-slate-100 pt-6">
                    <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                      <h3 className="text-sm font-bold text-slate-900">{dir === "rtl" ? "إعداد API" : "API configuration"}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {dir === "rtl"
                          ? "هاد الإعدادات خاصة بالـAdmin، والكليان كيدخل غير معلومات الحساب ديالو."
                          : "These settings are admin-only. Clients only enter their own credentials."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="API Base URL">
                        <input dir="ltr" className="input" value={form.apiBaseUrl} onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))} />
                      </Field>

                      <Field label="Test Path">
                        <input dir="ltr" className="input" value={form.testPath} onChange={(e) => setForm((f) => ({ ...f, testPath: e.target.value }))} />
                      </Field>

                      <Field label="Authentication">
                        <select className="input" value={form.authType} onChange={(e) => setForm((f) => ({ ...f, authType: e.target.value }))}>
                          <option value="bearer">Bearer Token</option>
                          <option value="api_key">API Key Header</option>
                          <option value="basic">Username + Password</option>
                          <option value="custom">Custom Header</option>
                          <option value="none">No authentication</option>
                        </select>
                      </Field>

                      {form.authType === "api_key" && (
                        <Field label="API Key Header">
                          <input dir="ltr" className="input" value={form.apiKeyHeader} onChange={(e) => setForm((f) => ({ ...f, apiKeyHeader: e.target.value }))} />
                        </Field>
                      )}

                      {form.authType === "custom" && (
                        <>
                          <Field label="Auth Header">
                            <input dir="ltr" className="input" value={form.authHeader} onChange={(e) => setForm((f) => ({ ...f, authHeader: e.target.value }))} />
                          </Field>
                          <Field label="Prefix">
                            <input dir="ltr" className="input" value={form.authPrefix} onChange={(e) => setForm((f) => ({ ...f, authPrefix: e.target.value }))} />
                          </Field>
                        </>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <button type="button" onClick={() => setAdminModalOpen(false)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600">
                {copy.cancel}
              </button>
              <button type="button" onClick={saveAdminCompany} disabled={saving} className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? (dir === "rtl" ? "جاري الحفظ..." : "Saving...") : copy.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {clientModalCompany && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setClientModalCompany(null)}>
          <div className="w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-w-xl sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <TruckIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{clientModalCompany.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {dir === "rtl" ? "دخل معلومات حساب شركة التوصيل ديالك." : "Enter your delivery account credentials."}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setClientModalCompany(null)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500">✕</button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

              {credentialFields(clientModalCompany).map((field) => (
                <Field key={field.key} label={field.label}>
                  <input
                    className="input"
                    type={field.type}
                    dir="ltr"
                    autoComplete="off"
                    value={credentials[field.key] || ""}
                    onChange={(e) => setCredentials((c) => ({ ...c, [field.key]: e.target.value }))}
                  />
                </Field>
              ))}

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs leading-5 text-indigo-800">
                {dir === "rtl"
                  ? "معلومات الربط كتتحفظ مشفرة، وما كيبانش الـToken لأي مستخدم آخر."
                  : "Your credentials are stored encrypted and are never shown to other users."}
              </div>

              {getConnection(clientModalCompany.id) && (
                <button
                  type="button"
                  onClick={() => testConnection(clientModalCompany.id)}
                  disabled={testingId === clientModalCompany.id}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white text-sm font-semibold text-indigo-700 disabled:opacity-60"
                >
                  <TestIcon />
                  {testingId === clientModalCompany.id
                    ? dir === "rtl" ? "جاري اختبار الاتصال..." : "Testing connection..."
                    : dir === "rtl" ? "اختبار الاتصال" : "Test Connection"}
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <button type="button" onClick={() => setClientModalCompany(null)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600">
                {copy.cancel}
              </button>
              <button type="button" onClick={saveClientConnection} disabled={saving} className="inline-flex h-10 min-w-[130px] items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? (dir === "rtl" ? "جاري الحفظ..." : "Saving...") : (dir === "rtl" ? "حفظ الربط" : "Save connection")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}



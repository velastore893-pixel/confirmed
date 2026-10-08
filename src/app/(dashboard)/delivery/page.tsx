"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";

type DeliveryConfig = { testPath?: string; authType?: string; apiKeyHeader?: string; authHeader?: string; authPrefix?: string; testMethod?: string; integrationState?: "ready" | "needs_documentation" | "manual"; notes?: string };
type DeliveryCompany = { id: string; name: string; slug: string; isActive: boolean; hasApi: boolean; codAvailable: boolean; cities: string[]; regions: string[]; apiBaseUrl?: string; config?: DeliveryConfig };

export default function DeliveryPage() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", hasApi: false, codAvailable: true, cities: "", regions: "", apiBaseUrl: "", testPath: "", authType: "bearer", apiKeyHeader: "X-API-Key", authHeader: "Authorization", authPrefix: "" });
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const fetchCompanies = useCallback(async () => {
    try { const res = await fetch("/api/delivery"); if (res.ok) { const d = await res.json(); setCompanies(d.items); } } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const openCreate = () => {
    setEditId(null); setError("");
    setForm({ name: "", slug: "", hasApi: false, codAvailable: true, cities: "", regions: "", apiBaseUrl: "", testPath: "", authType: "bearer", apiKeyHeader: "X-API-Key", authHeader: "Authorization", authPrefix: "" });
    setShowModal(true);
  };
  const openEdit = (c: DeliveryCompany) => {
    setEditId(c.id); setError("");
    setForm({
      name: c.name, slug: c.slug, hasApi: c.hasApi, codAvailable: c.codAvailable,
      cities: (c.cities || []).join(", "), regions: (c.regions || []).join(", "),
      apiBaseUrl: c.apiBaseUrl || "", testPath: c.config?.testPath || "", authType: c.config?.authType || "bearer",
      apiKeyHeader: c.config?.apiKeyHeader || "X-API-Key", authHeader: c.config?.authHeader || "Authorization", authPrefix: c.config?.authPrefix || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.name.trim() || !form.slug.trim()) { setError(dir === "rtl" ? "الاسم والرمز مطلوبان" : "Name and slug are required"); return; }
    if (form.hasApi && (!form.apiBaseUrl.trim() || !form.testPath.trim())) {
      setError(dir === "rtl" ? "شركة API خاصها رابط API ومسار اختبار حقيقي" : "API companies need a real API Base URL and Test Path"); return;
    }
    const url = editId ? `/api/delivery/${editId}` : "/api/delivery";
    const method = editId ? "PATCH" : "POST";
    const body = {
      name: form.name, slug: form.slug, hasApi: form.hasApi, codAvailable: form.codAvailable, apiBaseUrl: form.apiBaseUrl || null,
      cities: form.cities.split(",").map(s => s.trim()).filter(Boolean), regions: form.regions.split(",").map(s => s.trim()).filter(Boolean),
      config: { testPath: form.testPath, authType: form.authType, apiKeyHeader: form.apiKeyHeader, authHeader: form.authHeader, authPrefix: form.authPrefix, testMethod: "GET" },
    };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setShowModal(false); fetchCompanies(); setToast(t("common.success")); setTimeout(() => setToast(""), 3000); }
    else { const d = await res.json().catch(() => ({})); setError(d.error || "Could not save delivery company"); }
  };

  if (user?.role !== "admin") return <div className="empty-state"><div className="empty-state-icon">🔒</div></div>;

  return (
    <div className="space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="text-2xl font-bold">{t("delivery.title")}</h1><p className="text-sm text-slate-500 mt-1">{dir === "rtl" ? "هيئ API الحقيقي لكل شركة قبل أن يربطها العميل بمتجره" : "Configure each provider's real API before clients connect it to a store"}</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ {t("delivery.addCompany")}</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 text-center py-8"><div className="spinner mx-auto" /></div>
        : companies.map(c => (
          <div key={c.id} className="card"><div className="card-body space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">{c.name}</h3><span className={`badge badge-${c.isActive ? "active" : "suspended"}`}>{t(`statuses.${c.isActive ? "active" : "suspended"}`)}</span></div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-400 block">Slug</span><b>{c.slug}</b></div>
              <div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-400 block">Mode</span><b>{c.hasApi ? "API" : (c.config?.integrationState === "needs_documentation" ? "API pending" : "Manual")}</b></div>
            </div>
            {c.config?.integrationState === "needs_documentation" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{dir === "rtl" ? "مهيأة فالنظام ولكن الربط الأوتوماتيكي باقي محتاج الوثائق الرسمية ديال API." : "Provider is available in CODFlow, but automatic API integration still needs official documentation."}</div>}
            {c.hasApi && <div className="rounded-xl border border-slate-200 p-3 text-xs space-y-1"><div className="font-semibold text-slate-700">API configuration</div><div className="text-slate-500 break-all">{c.apiBaseUrl || "No base URL"}</div><div className="text-slate-500">Test: {c.config?.testPath || "Not configured"}</div><div className="text-slate-500">Auth: {c.config?.authType || "Not configured"}</div></div>}
            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>{t("common.edit")}</button>
          </div></div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal max-w-2xl" onClick={e => e.stopPropagation()}>
          <div className="modal-header">{editId ? t("delivery.editCompany") : t("delivery.addCompany")}<button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="modal-body space-y-4">
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>}
            <div className="form-grid form-grid-2">
              <div className="form-group"><label className="form-label">{t("delivery.name")}</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">{t("delivery.slug")}</label><input className="input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">{t("delivery.cities")}</label><input className="input" value={form.cities} onChange={e => setForm(f => ({ ...f, cities: e.target.value }))} placeholder="Marrakech, Casablanca, Rabat" /></div>
              <div className="form-group"><label className="form-label">{t("delivery.hasApi")}</label><select className="input" value={form.hasApi ? "yes" : "no"} onChange={e => setForm(f => ({ ...f, hasApi: e.target.value === "yes" }))}><option value="yes">{t("common.yes")}</option><option value="no">{t("common.no")}</option></select></div>
            </div>
            {form.hasApi && <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-4">
              <div><h3 className="font-semibold text-slate-900">{dir === "rtl" ? "إعداد API الحقيقي" : "Real API configuration"}</h3><p className="text-xs text-slate-500 mt-1">{dir === "rtl" ? "استعمل القيم الرسمية التي تعطيها شركة التوصيل. السيستم لن يعتبر الربط ناجحاً بدون طلب API ناجح." : "Use values from the provider. CODFlow will not mark it connected without a successful real API request."}</p></div>
              <div className="form-grid form-grid-2">
                <div className="form-group"><label className="form-label">API Base URL</label><input className="input" dir="ltr" value={form.apiBaseUrl} onChange={e => setForm(f => ({ ...f, apiBaseUrl: e.target.value }))} placeholder="https://api.company.ma" /></div>
                <div className="form-group"><label className="form-label">Test Path</label><input className="input" dir="ltr" value={form.testPath} onChange={e => setForm(f => ({ ...f, testPath: e.target.value }))} placeholder="/api/account or /cities" /></div>
                <div className="form-group"><label className="form-label">Authentication</label><select className="input" value={form.authType} onChange={e => setForm(f => ({ ...f, authType: e.target.value }))}><option value="bearer">Bearer token</option><option value="api_key">API Key header</option><option value="basic">Username + Password</option><option value="custom">Custom header</option><option value="none">No authentication</option></select></div>
                {form.authType === "api_key" && <div className="form-group"><label className="form-label">API Key Header</label><input className="input" dir="ltr" value={form.apiKeyHeader} onChange={e => setForm(f => ({ ...f, apiKeyHeader: e.target.value }))} placeholder="X-API-Key" /></div>}
                {form.authType === "custom" && <><div className="form-group"><label className="form-label">Auth Header</label><input className="input" dir="ltr" value={form.authHeader} onChange={e => setForm(f => ({ ...f, authHeader: e.target.value }))} /></div><div className="form-group"><label className="form-label">Prefix</label><input className="input" dir="ltr" value={form.authPrefix} onChange={e => setForm(f => ({ ...f, authPrefix: e.target.value }))} placeholder="Token / ApiKey / empty" /></div></>}
              </div>
            </div>}
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t("common.cancel")}</button><button className="btn btn-primary" onClick={handleSave}>{t("common.save")}</button></div>
        </div></div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";

type Platform = { id: string; name: string; slug: string; icon: string; configSchema?: unknown };
type DeliveryConfig = { testPath?: string; authType?: string; apiKeyHeader?: string; authHeader?: string; authPrefix?: string };
type Delivery = { id: string; name: string; slug: string; hasApi: boolean; cities: string[]; isActive?: boolean; apiBaseUrl?: string; config?: DeliveryConfig };
type ClientProfile = { id: string; companyName: string; city: string; region: string; address: string; onboardingStep: number; onboardingComplete: boolean };
type Store = { id: string; name: string; status: string; platformName: string; deliveryName: string; connectionStatus: string; deliveryConnectionStatus: string; url: string };

const PLATFORM_FIELDS: Record<string, Array<{ key: string; label: string; labelAr: string; required: boolean; placeholder: string }>> = {
  shopify: [
    { key: "access_token", label: "Admin API access token", labelAr: "رمز وصول Shopify Admin API", required: true, placeholder: "shpat_..." },
    { key: "api_version", label: "Admin API version", labelAr: "إصدار Shopify Admin API", required: false, placeholder: "Configured by your Shopify app / admin" },
  ],
  // YouCan does not expose a simple merchant API-key field in the store settings UI.
  // It must be connected through a YouCan app/client authorization flow once the developer app is configured.
  youcan: [],
  woocommerce: [
    { key: "consumer_key", label: "REST API Consumer Key", labelAr: "مفتاح WooCommerce Consumer Key", required: true, placeholder: "ck_..." },
    { key: "consumer_secret", label: "REST API Consumer Secret", labelAr: "سر WooCommerce Consumer Secret", required: true, placeholder: "cs_..." },
  ],
  prestashop: [
    { key: "webservice_key", label: "Webservice Key", labelAr: "مفتاح PrestaShop Webservice", required: true, placeholder: "PrestaShop Webservice key" },
  ],
  google_sheets: [],
};

const PLATFORM_CONNECTION_INFO: Record<string, { title: string; titleAr: string; description: string; descriptionAr: string }> = {
  shopify: {
    title: "Shopify Admin API connection",
    titleAr: "ربط Shopify Admin API",
    description: "Use the Admin API access token created for your Shopify app/store. The store URL is entered above; do not enter a random API key or test endpoint.",
    descriptionAr: "استعمل رمز وصول Admin API الخاص بتطبيق/متجر Shopify. رابط المتجر كيتدخل الفوق؛ ما تدخلش API Key أو Test Endpoint عشوائي.",
  },
  youcan: {
    title: "YouCan App / Client connection",
    titleAr: "ربط YouCan عبر App / Client",
    description: "YouCan is not configured here with a random API key. This platform must be authorized through a YouCan app/client (OAuth-style) integration. Until the developer app is configured, keep this connection as Not verified.",
    descriptionAr: "YouCan ما خاصوش API Key عشوائي من إعدادات المتجر. الربط خاصو يدوز عبر YouCan App / Client (OAuth). حتى يتجهز Developer App، خليه Not verified وما تدخل حتى secret عشوائي.",
  },
  woocommerce: {
    title: "WooCommerce REST API",
    titleAr: "ربط WooCommerce REST API",
    description: "Use the Consumer Key and Consumer Secret generated from WooCommerce REST API settings. The store URL is entered above.",
    descriptionAr: "استعمل Consumer Key وConsumer Secret اللي كيتولدو من إعدادات WooCommerce REST API. رابط المتجر كيتدخل الفوق.",
  },
  prestashop: {
    title: "PrestaShop Webservice",
    titleAr: "ربط PrestaShop Webservice",
    description: "Use the Webservice Key generated in PrestaShop Webservice settings. The store URL is entered above.",
    descriptionAr: "استعمل Webservice Key اللي كيتولد من إعدادات PrestaShop Webservice. رابط المتجر كيتدخل الفوق.",
  },
  google_sheets: {
    title: "Google Sheets connection",
    titleAr: "ربط Google Sheets",
    description: "Paste the Google Sheet link only. For link-only access, the sheet must be readable with 'Anyone with the link'. Private sheets require Google OAuth or a service account.",
    descriptionAr: "دخل غير رابط Google Sheet. باش يخدم الربط بالرابط فقط، خاص الشيت يكون قابل للقراءة بـ Anyone with the link. الشيت الخاص كيحتاج Google OAuth أو Service Account.",
  },
};

function StepIndicator({ currentStep, totalSteps, labels }: { currentStep: number; totalSteps: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < currentStep ? "bg-green-500 text-white" : i === currentStep ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-400"
            }`}>
              {i < currentStep ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === currentStep ? "text-blue-700" : i < currentStep ? "text-green-600" : "text-slate-400"}`}>
              {labels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && <div className={`h-0.5 flex-1 rounded ${i < currentStep ? "bg-green-300" : "bg-slate-100"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { t, locale, dir } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [testingPlatform, setTestingPlatform] = useState(false);
  const [testingDelivery, setTestingDelivery] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; message?: string } | null>(null);

  // Form state
  const [profileForm, setProfileForm] = useState({ companyName: "", city: "", region: "", address: "", phone: "" });
  const [storeForm, setStoreForm] = useState({ name: "", url: "", platformId: "", deliveryCompanyId: "", platformCreds: {} as Record<string, string>, deliveryCreds: {} as Record<string, string> });

  const fetchData = useCallback(async () => {
    try {
      const [platRes, delRes, profRes, storeRes] = await Promise.all([
        fetch("/api/platforms"),
        fetch("/api/delivery"),
        fetch("/api/onboarding/profile"),
        fetch("/api/onboarding/store"),
      ]);
      if (platRes.ok) setPlatforms((await platRes.json()).items || []);
      if (delRes.ok) setDeliveries((await delRes.json()).items || []);
      if (profRes.ok) {
        const d = await profRes.json();
        setClientProfile(d.client);
        if (d.client) {
          setProfileForm({
            companyName: d.client.companyName || "",
            city: d.client.city || "",
            region: d.client.region || "",
            address: d.client.address || "",
            phone: "",
          });
          setStep(d.client.onboardingStep || 0);
          if (d.client.onboardingComplete) {
            setStep(d.client.onboardingStep || 3);
          }
        }
      }
      if (storeRes.ok) {
        const d = await storeRes.json();
        setStores(d.stores || []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Check if client has pending/active stores — if yes, skip onboarding
  useEffect(() => {
    if (!loading && stores.length > 0 && clientProfile?.onboardingComplete) {
      router.replace("/stores");
    }
  }, [loading, stores, clientProfile, router]);

  const handleProfileSave = async () => {
    setSaving(true); setError("");
    if (!profileForm.companyName.trim()) {
      setError(dir === "rtl" ? "اسم الشركة مطلوب" : "Company name is required");
      setSaving(false); return;
    }
    const res = await fetch("/api/onboarding/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileForm),
    });
    if (res.ok) { setStep(1); setToast(dir === "rtl" ? "تم حفظ المعلومات" : "Profile saved"); setTimeout(() => setToast(""), 3000); }
    setSaving(false);
  };

  const handleStoreSave = async () => {
    setSaving(true); setError("");
    if (!storeForm.name.trim() || !storeForm.platformId || !storeForm.deliveryCompanyId || !storeForm.url.trim()) {
      setError(dir === "rtl" ? "جميع الحقول مطلوبة" : "All fields are required");
      setSaving(false); return;
    }
    const res = await fetch("/api/onboarding/store", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: storeForm.name, platformId: storeForm.platformId,
        deliveryCompanyId: storeForm.deliveryCompanyId, url: storeForm.url,
        platformCredentials: storeForm.platformCreds,
        deliveryCredentials: storeForm.deliveryCreds,
      }),
    });
    if (res.ok) {
      setStep(2);
      setToast(dir === "rtl" ? "تم إنشاء المتجر" : "Store created");
      setTimeout(() => setToast(""), 3000);
      fetchData();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to create store");
    }
    setSaving(false);
  };

  const handleTestConnection = async (storeId: string, type: "platform" | "delivery") => {
    if (!storeId) return;
    const setter = type === "platform" ? setTestingPlatform : setTestingDelivery;
    setter(true);
    setTestResult(null);
    const res = await fetch("/api/onboarding/test-connection", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, testType: type }),
    });
    const result = await res.json();
    setTestResult(result);
    setter(false);
    fetchData();
  };

  const handleCompleteOnboarding = async () => {
    setSaving(true);
    const res = await fetch("/api/onboarding/complete", { method: "POST" });
    if (res.ok) {
      setStep(3);
      setToast(dir === "rtl" ? "تم إكمال الإعداد! متجرك قيد المراجعة" : "Setup complete! Your store is pending review.");
      setTimeout(() => setToast(""), 5000);
      fetchData();
    }
    setSaving(false);
  };

  const selectedPlatform = platforms.find(p => p.id === storeForm.platformId);
  const selectedDelivery = deliveries.find(d => d.id === storeForm.deliveryCompanyId);
  const platformFields = selectedPlatform ? PLATFORM_FIELDS[selectedPlatform.slug] || [] : [];
  const platformConnectionInfo = selectedPlatform ? PLATFORM_CONNECTION_INFO[selectedPlatform.slug] : undefined;
  const deliveryFields = (() => {
    if (!selectedDelivery?.hasApi) return [] as Array<{ key: string; label: string; labelAr: string; placeholder: string }>;
    const authType = selectedDelivery.config?.authType || "bearer";
    const fields: Array<{ key: string; label: string; labelAr: string; placeholder: string }> = [];
    if (["sift", "sift-livraison"].includes(selectedDelivery.slug)) {
      fields.push({ key: "special_token", label: "Special-Token", labelAr: "Special-Token ديال SIFT", placeholder: "Special-Token" });
      return fields;
    }
    if (authType === "basic") {
      fields.push({ key: "username", label: "Username", labelAr: "اسم المستخدم", placeholder: "API username" });
      fields.push({ key: "password", label: "Password", labelAr: "كلمة المرور", placeholder: "API password" });
    } else if (authType === "api_key") {
      fields.push({ key: "api_key", label: "API Key", labelAr: "مفتاح API", placeholder: "API key" });
    } else if (authType === "none") {
      // no credentials
    } else {
      fields.push({ key: "token", label: "API Token", labelAr: "رمز API", placeholder: "Token / access token" });
    }
    return fields;
  })();

  if (loading) return <div className="flex items-center justify-center py-20"><div className="spinner" style={{ width: 28, height: 28 }} /></div>;

  const stepLabels = dir === "rtl"
    ? ["المعلومات", "المتجر", "الاختبار", "المراجعة"]
    : ["Business", "Store", "Test", "Review"];

  return (
    <div className="max-w-2xl mx-auto">
      {toast && <div className="toast toast-success">{toast}</div>}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          {dir === "rtl" ? "إعداد حسابك" : "Set Up Your Account"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {dir === "rtl" ? "أكمل الخطوات التالية لبدء إدارة متجرك" : "Complete the steps below to start managing your store"}
        </p>
      </div>

      <StepIndicator currentStep={step} totalSteps={4} labels={stepLabels} />

      {error && (
        <div className="mb-4 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Step 0: Business Information */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {dir === "rtl" ? "معلومات النشاط التجاري" : "Business Information"}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="form-group">
              <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "اسم الشركة / المتجر *" : "Company / Store Name *"}</label>
              <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                value={profileForm.companyName} onChange={e => setProfileForm(f => ({ ...f, companyName: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "المدينة" : "City"}</label>
                <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "المنطقة" : "Region"}</label>
                <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  value={profileForm.region} onChange={e => setProfileForm(f => ({ ...f, region: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "العنوان" : "Address"}</label>
              <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <button className="w-full h-[48px] rounded-xl text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: saving ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              onClick={handleProfileSave} disabled={saving}>
              {saving ? <span className="spinner" /> : <>{dir === "rtl" ? "التالي: ربط المتجر" : "Next: Connect Store"} →</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Connect Store */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                {dir === "rtl" ? "ربط المتجر" : "Connect Your Store"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Platform selection */}
              <div className="form-group">
                <label className="block text-[13px] font-medium text-slate-700 mb-2">{dir === "rtl" ? "منصة التجارة الإلكترونية" : "E-commerce Platform"}</label>
                <div className="grid grid-cols-2 gap-2">
                  {platforms.map(p => (
                    <button key={p.id} onClick={() => setStoreForm(f => ({ ...f, platformId: p.id, platformCreds: {} }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${storeForm.platformId === p.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <span className="text-xl">{p.icon}</span>
                      <span className="text-sm font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Store name + URL */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "اسم المتجر" : "Store Name"} *</label>
                  <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    value={storeForm.name} onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "رابط المتجر" : "Store URL"} *</label>
                  <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    dir="ltr" value={storeForm.url} onChange={e => setStoreForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
                </div>
              </div>

              {/* Platform-specific connection method */}
              {selectedPlatform && platformConnectionInfo && (
                <div className={`rounded-xl border p-4 ${selectedPlatform.slug === "youcan" ? "bg-amber-50 border-amber-200" : selectedPlatform.slug === "google_sheets" ? "bg-emerald-50 border-emerald-200" : "bg-sky-50 border-sky-100"}`}>
                  <div className={`text-sm font-semibold ${selectedPlatform.slug === "youcan" ? "text-amber-900" : selectedPlatform.slug === "google_sheets" ? "text-emerald-900" : "text-sky-900"}`}>
                    {dir === "rtl" ? platformConnectionInfo.titleAr : platformConnectionInfo.title}
                  </div>
                  <div className={`text-xs mt-1 leading-5 ${selectedPlatform.slug === "youcan" ? "text-amber-800" : selectedPlatform.slug === "google_sheets" ? "text-emerald-800" : "text-sky-800"}`}>
                    {dir === "rtl" ? platformConnectionInfo.descriptionAr : platformConnectionInfo.description}
                  </div>
                </div>
              )}

              {/* Platform credentials */}
              {platformFields.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">{dir === "rtl" ? "بيانات اتصال المنصة" : "Platform Credentials"}</h3>
                  {platformFields.map(field => (
                    <div key={field.key} className="form-group">
                      <label className="block text-[13px] font-medium text-slate-700">
                        {dir === "rtl" ? field.labelAr : field.label} {field.required && "*"}
                      </label>
                      <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 font-mono"
                        dir="ltr" value={storeForm.platformCreds[field.key] || ""} placeholder={field.placeholder}
                        onChange={e => setStoreForm(f => ({ ...f, platformCreds: { ...f.platformCreds, [field.key]: e.target.value } }))} />
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery company selection */}
              <div className="form-group pt-3 border-t border-slate-100">
                <label className="block text-[13px] font-medium text-slate-700 mb-2">{dir === "rtl" ? "شركة التوصيل" : "Delivery Company"} *</label>
                <div className="grid grid-cols-2 gap-2">
                  {deliveries.filter(d => d.isActive !== false).map(d => (
                    <button key={d.id} onClick={() => setStoreForm(f => ({ ...f, deliveryCompanyId: d.id, deliveryCreds: {} }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${storeForm.deliveryCompanyId === d.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-slate-400">{d.hasApi ? "API" : "Manual"}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery credentials */}
              {selectedDelivery?.hasApi && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
                    <div className="font-semibold mb-1">{dir === "rtl" ? "ربط شركة التوصيل عبر API" : "Connect delivery API"}</div>
                    <div>{dir === "rtl" ? "الـAdmin خاصو يهيئ رابط API وطريقة المصادقة ديال هاد الشركة. دخل هنا غير بيانات الحساب اللي عطاتهالك شركة التوصيل." : "Admin must configure this provider's API URL and auth method. Enter only the account credentials supplied by the delivery company."}</div>
                    {selectedDelivery.apiBaseUrl && <div className="mt-1 font-mono break-all">{selectedDelivery.apiBaseUrl}</div>}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">{dir === "rtl" ? "بيانات حساب التوصيل" : "Delivery Account Credentials"}</h3>
                  {deliveryFields.length === 0 ? (
                    <div className="text-sm text-slate-500">{dir === "rtl" ? "هاد الشركة ما كتحتاجش بيانات مصادقة إضافية." : "This provider does not require additional authentication fields."}</div>
                  ) : deliveryFields.map(field => (
                    <div key={field.key} className="form-group">
                      <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? field.labelAr : field.label} *</label>
                      <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 font-mono"
                        type={["password", "special_token", "token", "api_key"].includes(field.key) ? "password" : "text"} dir="ltr" value={storeForm.deliveryCreds[field.key] || ""} placeholder={field.placeholder}
                        onChange={e => setStoreForm(f => ({ ...f, deliveryCreds: { ...f.deliveryCreds, [field.key]: e.target.value } }))} />
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full h-[48px] rounded-xl text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: saving ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                onClick={handleStoreSave} disabled={saving}>
                {saving ? <span className="spinner" /> : <>{dir === "rtl" ? "حفظ وإنشاء المتجر" : "Save & Create Store"} →</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Test & Review */}
      {step === 2 && stores.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                {dir === "rtl" ? "اختبار الاتصال" : "Test Connection"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {stores.map(store => (
                <div key={store.id} className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-medium text-sm">{store.name}</div>
                      <div className="text-xs text-slate-400">{store.platformName} · {store.deliveryName}</div>
                    </div>
                    <span className={`badge badge-${store.status}`}>{t(`statuses.${store.status}`)}</span>
                  </div>

                  {/* Platform test */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{dir === "rtl" ? "اتصال المنصة" : "Platform Connection"}</div>
                      <div className="text-xs text-slate-400">
                        {store.connectionStatus === "connected" ? "✅ " : store.connectionStatus === "failed" ? "❌ " : "⏳ "}
                        {store.connectionStatus === "connected" ? (dir === "rtl" ? "متصل" : "Connected") : store.connectionStatus === "failed" ? (dir === "rtl" ? "فشل الاتصال" : "Failed") : (dir === "rtl" ? "لم يتم الاختبار" : "Not tested")}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleTestConnection(store.id, "platform")} disabled={testingPlatform}>
                      {testingPlatform ? <span className="spinner" /> : (dir === "rtl" ? "اختبار" : "Test")}
                    </button>
                  </div>

                  {/* Delivery test */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{dir === "rtl" ? "اتصال التوصيل" : "Delivery Connection"}</div>
                      <div className="text-xs text-slate-400">
                        {store.deliveryConnectionStatus === "connected" ? "✅ " : store.deliveryConnectionStatus === "failed" ? "❌ " : "⏳ "}
                        {store.deliveryConnectionStatus === "connected" ? (dir === "rtl" ? "متصل" : "Connected") : store.deliveryConnectionStatus === "failed" ? (dir === "rtl" ? "فشل الاتصال" : "Failed") : (dir === "rtl" ? "لم يتم الاختبار" : "Not tested")}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleTestConnection(store.id, "delivery")} disabled={testingDelivery}>
                      {testingDelivery ? <span className="spinner" /> : (dir === "rtl" ? "اختبار" : "Test")}
                    </button>
                  </div>

                  {/* Test result */}
                  {testResult && (
                    <div className={`p-3 rounded-xl text-sm ${testResult.success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                      {testResult.success ? "✅ " : "❌ "}{testResult.message || testResult.error}
                    </div>
                  )}
                </div>
              ))}

              <button className="w-full h-[48px] rounded-xl text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: saving ? "#94a3b8" : "linear-gradient(135deg, #059669, #047857)" }}
                onClick={handleCompleteOnboarding} disabled={saving}>
                {saving ? <span className="spinner" /> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> {dir === "rtl" ? "إرسال للمراجعة" : "Submit for Review"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Pending Review */}
      {step >= 3 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              {dir === "rtl" ? "في انتظار المراجعة" : "Pending Admin Review"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {dir === "rtl"
                ? "تم إرسال متجرك للمراجعة. سيقوم المدير بمراجعة المعلومات وتفعيل المتجر. ستتلقى إشعاراً عند الموافقة."
                : "Your store has been submitted for review. Admin will review and activate it. You'll receive a notification when approved."}
            </p>

            {/* Onboarding checklist */}
            <div className="max-w-sm mx-auto text-left space-y-2">
              {[
                { label: dir === "rtl" ? "إنشاء الحساب" : "Account created", done: true },
                { label: dir === "rtl" ? "معلومات النشاط" : "Business information", done: true },
                { label: dir === "rtl" ? "ربط المتجر" : "Store connected", done: true },
                { label: dir === "rtl" ? "شركة التوصيل" : "Delivery company", done: true },
                { label: dir === "rtl" ? "مراجعة المدير" : "Admin review", done: false },
                { label: dir === "rtl" ? "تفعيل المتجر" : "Store activated", done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  {item.done ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  )}
                  <span className={`text-sm ${item.done ? "text-slate-600" : "text-amber-600 font-medium"}`}>{item.label}</span>
                </div>
              ))}
            </div>

            <a href="/stores" className="btn btn-primary btn-sm mt-6">
              {dir === "rtl" ? "عرض متاجري" : "View My Stores"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth-context";

type SettingsMap = Record<string, unknown>;

function SettingCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 font-semibold text-slate-900 text-sm">{title}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<SettingsMap>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const fetchSettings = useCallback(async () => {
    try { const res = await fetch("/api/settings"); if (res.ok) { const d = await res.json(); setSettings(d.settings); setForm(d.settings); } } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (keys: string[]) => {
    setSaving(true);
    const updates: SettingsMap = {};
    keys.forEach(k => { if (form[k] !== undefined) updates[k] = form[k]; });
    const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: updates }) });
    if (res.ok) { setToast(t("settings.saved")); setTimeout(() => setToast(""), 3000); fetchSettings(); }
    setSaving(false);
  };

  const get = (key: string, fallback = "") => String(form[key] ?? settings[key] ?? fallback);

  if (user?.role !== "admin") return <div className="empty-state"><div className="empty-state-icon">🔒</div></div>;

  const tabs = [
    { id: "general", label: t("settings.general"), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
    { id: "pricing", label: t("settings.pricing"), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
    { id: "delivery", label: t("settings.deliveryApi"), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { id: "identity", label: t("nav.systemIdentity"), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5"/><path d="M17.5 10.5c0 0-1-1.5-4-1.5s-4 1.5-4 1.5"/><circle cx="12" cy="12" r="10"/></svg> },
    { id: "finance", label: t("finance.title"), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    { id: "security", label: dir === "rtl" ? "الأمان" : "Security", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
  ];

  return (
    <div className="space-y-6">
      {toast && <div className="toast toast-success">{toast}</div>}

      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("settings.title")}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{dir === "rtl" ? "إدارة إعدادات النظام" : "Manage system configuration"}</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Tabs sidebar */}
        <div className="w-48 flex-shrink-0 hidden md:block">
          <nav className="bg-white rounded-xl border border-slate-200 p-2 space-y-0.5 sticky top-20">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
                <span className={activeTab === tab.id ? "text-blue-600" : "text-slate-400"}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden w-full overflow-x-auto pb-2">
          <div className="flex gap-1.5">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${activeTab === tab.id ? "bg-blue-50 text-blue-700" : "bg-white border border-slate-200 text-slate-600"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {loading ? <div className="text-center py-12"><div className="spinner mx-auto" /></div>
          : (<>
            {activeTab === "general" && (
              <SettingCard title={t("settings.general")}>
                <div className="max-w-lg space-y-4">
                  <div className="form-group">
                    <label className="form-label">{t("settings.deliveryApi")} — {t("settings.retryCount")}</label>
                    <input className="input" type="number" min="1" max="10" value={get("delivery_retry_count", "3")}
                      onChange={e => setForm(f => ({ ...f, delivery_retry_count: e.target.value }))} />
                    <p className="text-xs text-slate-400 mt-1">{dir === "rtl" ? "عدد محاولات إعادة إرسال الشحنة عند الفشل" : "Number of retry attempts for failed shipment creation"}</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleSave(["delivery_retry_count"])} disabled={saving}>{saving ? <span className="spinner" /> : t("settings.save")}</button>
                </div>
              </SettingCard>
            )}

            {activeTab === "pricing" && (
              <SettingCard title={t("settings.pricing")}>
                <div className="max-w-lg space-y-4">
                  <div className="form-group">
                    <label className="form-label">{t("settings.defaultPrice")}</label>
                    <div className="relative">
                      <input className="input" type="number" step="0.5" value={get("default_price_per_order", "10")}
                        onChange={e => setForm(f => ({ ...f, default_price_per_order: e.target.value }))} dir="ltr" />
                      <span className="absolute inset-y-0 end-0 pe-3 flex items-center text-sm text-slate-400">DH</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("settings.defaultCommission")}</label>
                    <div className="relative">
                      <input className="input" type="number" step="0.5" value={get("default_commission_per_order", "3")}
                        onChange={e => setForm(f => ({ ...f, default_commission_per_order: e.target.value }))} dir="ltr" />
                      <span className="absolute inset-y-0 end-0 pe-3 flex items-center text-sm text-slate-400">DH</span>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleSave(["default_price_per_order", "default_commission_per_order"])} disabled={saving}>{saving ? <span className="spinner" /> : t("settings.save")}</button>
                </div>
              </SettingCard>
            )}

            {activeTab === "delivery" && (
              <SettingCard title={t("settings.deliveryApi")}>
                <div className="max-w-lg space-y-4">
                  <div className="form-group">
                    <label className="form-label">{t("settings.retryCount")}</label>
                    <input className="input" type="number" min="1" max="10" value={get("delivery_retry_count", "3")}
                      onChange={e => setForm(f => ({ ...f, delivery_retry_count: e.target.value }))} />
                    <p className="text-xs text-slate-400 mt-1">{dir === "rtl" ? "عدد المحاولات قبل إشعار المدير بالفشل" : "Attempts before notifying admin of failure"}</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleSave(["delivery_retry_count"])} disabled={saving}>{saving ? <span className="spinner" /> : t("settings.save")}</button>
                </div>
              </SettingCard>
            )}

            {activeTab === "identity" && (
              <SettingCard title={t("systemIdentity.title")}>
                <div className="max-w-xl space-y-5">
                  <div className="form-group">
                    <label className="form-label">{t("systemIdentity.systemName")}</label>
                    <input className="input" value={get("system_name", "CODFlow")}
                      onChange={e => setForm(f => ({ ...f, system_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label mb-2 block">{dir === "rtl" ? "ألوان النظام" : "System Colors"}</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { key: "primary_color", label: t("systemIdentity.primaryColor"), fallback: "#2563eb" },
                        { key: "secondary_color", label: t("systemIdentity.secondaryColor"), fallback: "#7c3aed" },
                        { key: "accent_color", label: t("systemIdentity.accentColor"), fallback: "#0891b2" },
                      ].map(c => (
                        <div key={c.key} className="space-y-1.5">
                          <div className="text-xs font-medium text-slate-500">{c.label}</div>
                          <div className="flex items-center gap-2">
                            <input type="color" className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0"
                              value={get(c.key, c.fallback)} onChange={e => setForm(f => ({ ...f, [c.key]: e.target.value }))} />
                            <input className="input text-xs font-mono" value={get(c.key, c.fallback)}
                              onChange={e => setForm(f => ({ ...f, [c.key]: e.target.value }))} dir="ltr" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-400 mb-2 font-medium">{dir === "rtl" ? "معاينة" : "Preview"}</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: get("primary_color", "#2563eb") }}>C</div>
                      <div><div className="font-bold text-slate-900">{get("system_name", "CODFlow")}</div><div className="text-xs text-slate-400">Preview</div></div>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleSave(["system_name", "primary_color", "secondary_color", "accent_color"])} disabled={saving}>{saving ? <span className="spinner" /> : t("settings.save")}</button>
                </div>
              </SettingCard>
            )}

            {activeTab === "finance" && (
              <SettingCard title={dir === "rtl" ? "معلومات البنك" : "Bank Information"}>
                <div className="max-w-lg space-y-4">
                  <div className="form-group">
                    <label className="form-label">{dir === "rtl" ? "اسم البنك" : "Bank Name"}</label>
                    <input className="input" value={get("bank_name")} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{dir === "rtl" ? "رقم الحساب" : "Account Number"}</label>
                    <input className="input" dir="ltr" value={get("bank_account")} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">RIB</label>
                    <input className="input" dir="ltr" value={get("bank_rib")} onChange={e => setForm(f => ({ ...f, bank_rib: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" onClick={() => handleSave(["bank_name", "bank_account", "bank_rib"])} disabled={saving}>{saving ? <span className="spinner" /> : t("settings.save")}</button>
                </div>
              </SettingCard>
            )}

            {activeTab === "security" && (
              <SettingCard title={dir === "rtl" ? "تغيير كلمة المرور" : "Change Password"}>
                <ChangePasswordForm dir={dir} />
              </SettingCard>
            )}
          </>)}
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm({ dir, locale }: { dir: string; locale?: string }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.currentPassword || !form.newPassword) { setError(dir === "rtl" ? "جميع الحقول مطلوبة" : "All fields required"); return; }
    if (form.newPassword.length < 8) { setError(dir === "rtl" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters"); return; }
    if (form.newPassword !== form.confirmPassword) { setError(dir === "rtl" ? "كلمات المرور غير متطابقة" : "Passwords do not match"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
    const data = await res.json();
    if (res.ok) { setSuccess(dir === "rtl" ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully"); setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
    else { setError(data.error || (dir === "rtl" ? "حدث خطأ" : "An error occurred")); }
    setLoading(false);
  };

  return (
    <div className="max-w-lg space-y-4">
      {error && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-green-50 border border-green-100">
          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span className="text-sm text-green-700">{success}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "كلمة المرور الحالية" : "Current Password"}</label>
        <input type="password" className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "كلمة المرور الجديدة (8 أحرف على الأقل)" : "New Password (min 8 characters)"}</label>
        <input type="password" className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} dir="ltr" minLength={8} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
        <input type="password" className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} dir="ltr" />
      </div>
      <button className="w-full h-[48px] rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-60"
        style={{ background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
        onClick={handleSubmit} disabled={loading}>
        {loading ? <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M4 12a8 8 0 018-8" strokeOpacity="1"/></svg> : (dir === "rtl" ? "تغيير كلمة المرور" : "Change Password")}
      </button>
    </div>
  );
}
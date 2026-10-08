"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import Link from "next/link";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function RegisterPage() {
  const { t, locale, dir } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", companyName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const f = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const passwordsMatch = form.password.length > 0 && form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      setError(dir === "rtl" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }
    if (form.password.length < 8) {
      setError(dir === "rtl" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(dir === "rtl" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/login?registered=1");
      } else {
        setError(data.error || (dir === "rtl" ? "حدث خطأ في التسجيل" : "Registration failed"));
      }
    } catch {
      setError(dir === "rtl" ? "خطأ في الاتصال" : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {dir === "rtl" ? "إنشاء حساب جديد" : locale === "fr" ? "Créer un compte" : "Create your account"}
        </h2>
        <p className="text-sm text-slate-500 mt-1.5">
          {dir === "rtl" ? "سجّل كتاجر للبدء في إدارة طلباتك" : "Register as a merchant to manage your COD orders"}
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="text-sm text-red-700 leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "الاسم الأول" : "First Name"} *</label>
            <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={form.firstName} onChange={e => f("firstName", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "اسم العائلة" : "Last Name"} *</label>
            <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={form.lastName} onChange={e => f("lastName", e.target.value)} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "اسم المتجر / الشركة" : "Business / Store Name"}</label>
          <input className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            value={form.companyName} onChange={e => f("companyName", e.target.value)}
            placeholder={dir === "rtl" ? "مثال: متجر الأناقة" : "e.g. My Store"} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">{t("auth.email")} *</label>
          <div className="relative">
            <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <input type="email" dir="ltr"
              className="w-full h-[48px] px-4 ps-11 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
              value={form.email} onChange={e => f("email", e.target.value)}
              placeholder="you@example.com" required autoComplete="email" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">{dir === "rtl" ? "رقم الهاتف" : "Phone"}</label>
          <div className="relative">
            <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            </span>
            <input type="tel" dir="ltr"
              className="w-full h-[48px] px-4 ps-11 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
              value={form.phone} onChange={e => f("phone", e.target.value)}
              placeholder="+212 6XX XXX XXX" />
          </div>
        </div>

        <PasswordInput value={form.password} onChange={v => f("password", v)}
          label={`${t("auth.password")} *`} locale={locale} showStrength />

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">{t("auth.confirmPassword")} *</label>
          <div className="relative">
            <input type={showConfirm ? "text" : "password"} dir="ltr"
              className="w-full h-[48px] px-4 pe-12 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={form.confirmPassword} onChange={e => f("confirmPassword", e.target.value)}
              placeholder="••••••••" required />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
              className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-slate-400 hover:text-slate-600 transition">
              {showConfirm ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {form.confirmPassword.length > 0 && (
            <div className="flex items-center gap-1.5">
              {passwordsMatch ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-[11px] text-green-600 font-medium">{dir === "rtl" ? "كلمات المرور متطابقة" : "Passwords match"}</span></>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span className="text-[11px] text-red-500 font-medium">{dir === "rtl" ? "كلمات المرور غير متطابقة" : "Passwords don't match"}</span></>
              )}
            </div>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <div className="relative mt-0.5">
            <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="peer sr-only" />
            <div className="w-[18px] h-[18px] rounded-md border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all flex items-center justify-center">
              {acceptTerms && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
          </div>
          <span className="text-[12px] text-slate-500 leading-relaxed">
            {dir === "rtl" ? "أوافق على شروط الاستخدام وسياسة الخصوصية" : "I agree to the Terms of Service and Privacy Policy"}
          </span>
        </label>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full h-[48px] rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] mt-2"
          style={{ background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
          {loading ? (
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M4 12a8 8 0 018-8" strokeOpacity="1"/></svg>
          ) : (
            <>
              {dir === "rtl" ? "إنشاء الحساب" : locale === "fr" ? "Créer le compte" : "Create Account"}
            </>
          )}
        </button>
      </form>

      {/* Login link */}
      <div className="mt-7 text-center">
        <p className="text-sm text-slate-500">
          {dir === "rtl" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#2563eb" }}>
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/i18n";
import Link from "next/link";

export default function LoginPage() {
  const { t, locale, dir } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError(dir === "rtl" ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // Use replace instead of push to avoid back-button to login
        router.replace("/");
      } else {
        if (result.error === "Account suspended") {
          setError(dir === "rtl" ? "تم تعليق حسابك. يرجى التواصل مع الإدارة." : "Your account has been suspended. Please contact support.");
        } else {
          setError(dir === "rtl" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : locale === "fr" ? "Adresse e-mail ou mot de passe incorrect" : "Incorrect email or password");
        }
      }
    } catch {
      setError(dir === "rtl" ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {dir === "rtl" ? "مرحباً بعودتك" : locale === "fr" ? "Bienvenue" : "Welcome back"}
        </h2>
        <p className="text-sm text-slate-500 mt-1.5">
          {dir === "rtl" ? "سجّل دخولك لإدارة عملياتك" : "Sign in to manage your operations"}
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="text-sm text-red-700 leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">{t("auth.email")}</label>
          <div className="relative">
            <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-[48px] px-4 ps-11 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
              placeholder={dir === "rtl" ? "بريدك الإلكتروني" : "you@example.com"}
              required autoComplete="email" dir="ltr" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-slate-700">{t("auth.password")}</label>
            <Link href="/forgot-password" className="text-[12px] font-medium hover:underline" style={{ color: "#2563eb" }}>
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </span>
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full h-[48px] px-4 ps-11 pe-12 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
              placeholder="••••••••" required autoComplete="current-password" dir="ltr" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-slate-400 hover:text-slate-600 transition" tabIndex={-1}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <div className="relative">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="peer sr-only" />
            <div className="w-[18px] h-[18px] rounded-md border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all flex items-center justify-center">
              {remember && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
          </div>
          <span className="text-[13px] text-slate-600">{dir === "rtl" ? "تذكرني" : locale === "fr" ? "Se souvenir de moi" : "Remember me"}</span>
        </label>

        <button type="submit" disabled={loading}
          className="w-full h-[48px] rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98]"
          style={{ background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
          {loading ? (
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M4 12a8 8 0 018-8" strokeOpacity="1"/></svg>
          ) : (
            <>
              {dir === "rtl" ? "تسجيل الدخول" : locale === "fr" ? "Se connecter" : "Sign in"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={dir === "rtl" ? "rotate-180" : ""}>
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-slate-400">{dir === "rtl" ? "أو" : "or"}</span></div>
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-500">
          {dir === "rtl" ? "ليس لديك حساب؟" : locale === "fr" ? "Pas encore de compte ?" : "Don't have an account?"}{" "}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: "#2563eb" }}>
            {dir === "rtl" ? "إنشاء حساب تاجر" : locale === "fr" ? "Créer un compte" : "Create Client Account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
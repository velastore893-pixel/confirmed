"use client";
import { useState } from "react";
import { useI18n } from "@/i18n";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { t, locale, dir } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError(dir === "rtl" ? "يرجى إدخال بريدك الإلكتروني" : "Please enter your email");
      return;
    }
    setLoading(true);
    // Simulate — in production this would send an email
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {dir === "rtl" ? "نسيت كلمة المرور؟" : locale === "fr" ? "Mot de passe oublié ?" : "Forgot your password?"}
        </h2>
        <p className="text-sm text-slate-500 mt-1.5">
          {dir === "rtl"
            ? "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين"
            : "Enter your email and we'll send you a reset link"}
        </p>
      </div>

      {sent ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">
            {dir === "rtl" ? "تم إرسال البريد الإلكتروني" : "Email sent"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {dir === "rtl"
              ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. يرجى التحقق من بريدك الإلكتروني.`
              : `A password reset link has been sent to ${email}. Please check your inbox.`}
          </p>
          <div className="mt-6">
            <Link href="/login" className="text-sm font-semibold hover:underline" style={{ color: "#2563eb" }}>
              {dir === "rtl" ? "العودة لتسجيل الدخول" : "Back to sign in"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
              <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-slate-700">{t("auth.email")}</label>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-slate-400 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" dir="ltr" required
                  className="w-full h-[48px] px-4 ps-11 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-[48px] rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              style={{ background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
              {loading ? (
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M4 12a8 8 0 018-8" strokeOpacity="1"/></svg>
              ) : (
                dir === "rtl" ? "إرسال رابط إعادة التعيين" : locale === "fr" ? "Envoyer le lien" : "Send reset link"
              )}
            </button>
          </form>

          <div className="mt-7 text-center">
            <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700 font-medium inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={dir === "rtl" ? "" : "rotate-180"}>
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              {dir === "rtl" ? "العودة لتسجيل الدخول" : locale === "fr" ? "Retour à la connexion" : "Back to sign in"}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
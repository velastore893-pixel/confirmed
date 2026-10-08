"use client";

import { useState } from "react";
import { useI18n } from "@/i18n";
import Link from "next/link";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function RegisterPage() {
  const { t, locale, dir } = useI18n();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [success, setSuccess] = useState(false);

  const f = (key: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const passwordsMatch =
    form.password.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError(
        dir === "rtl"
          ? "يرجى ملء جميع الحقول المطلوبة"
          : locale === "fr"
          ? "Veuillez remplir tous les champs obligatoires"
          : "Please fill in all required fields"
      );
      return;
    }

    if (form.password.length < 8) {
      setError(
        dir === "rtl"
          ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
          : locale === "fr"
          ? "Le mot de passe doit contenir au moins 8 caractères"
          : "Password must be at least 8 characters"
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(
        dir === "rtl"
          ? "كلمات المرور غير متطابقة"
          : locale === "fr"
          ? "Les mots de passe ne correspondent pas"
          : "Passwords do not match"
      );
      return;
    }

    if (!acceptTerms) {
      setError(
        dir === "rtl"
          ? "يجب الموافقة على شروط الاستخدام وسياسة الخصوصية"
          : locale === "fr"
          ? "Vous devez accepter les conditions d’utilisation"
          : "You must accept the Terms of Service"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(
          data.error ||
            (dir === "rtl"
              ? "حدث خطأ في التسجيل"
              : locale === "fr"
              ? "Échec de l'inscription"
              : "Registration failed")
        );
      }
    } catch {
      setError(
        dir === "rtl"
          ? "خطأ في الاتصال"
          : locale === "fr"
          ? "Erreur de connexion"
          : "Network error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          {dir === "rtl"
            ? "تم إرسال طلبك بنجاح"
            : locale === "fr"
            ? "Votre demande a été envoyée"
            : "Your request has been submitted"}
        </h2>

        <p className="mt-3 text-sm text-slate-500 leading-7 max-w-md mx-auto">
          {dir === "rtl"
            ? "تم إنشاء طلب حسابك وهو الآن قيد المراجعة من طرف الإدارة. لن تتمكن من تسجيل الدخول حتى تتم الموافقة على حسابك."
            : locale === "fr"
            ? "Votre compte est maintenant en attente de validation par l’administration. Vous pourrez vous connecter après approbation."
            : "Your account is now waiting for administrator approval. You will be able to sign in once it has been approved."}
        </p>

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
          {dir === "rtl"
            ? "سنقوم بتفعيل حسابك بعد مراجعته."
            : locale === "fr"
            ? "Votre compte sera activé après vérification."
            : "Your account will be activated after review."}
        </div>

        <Link
          href="/client-login"
          className="mt-6 inline-flex items-center justify-center w-full h-[48px] rounded-xl text-white text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, #6366f1, #7c3aed)",
          }}
        >
          {dir === "rtl"
            ? "العودة إلى تسجيل الدخول"
            : locale === "fr"
            ? "Retour à la connexion"
            : "Back to sign in"}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {dir === "rtl"
            ? "إنشاء حساب عميل"
            : locale === "fr"
            ? "Créer un compte client"
            : "Create client account"}
        </h2>

        <p className="text-sm text-slate-500 mt-1.5">
          {dir === "rtl"
            ? "أنشئ حسابك وسيتم مراجعته من طرف الإدارة قبل التفعيل"
            : locale === "fr"
            ? "Créez votre compte. Il sera validé par l’administration avant activation."
            : "Create your account. It will be reviewed by the administrator before activation."}
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
          <svg
            className="flex-shrink-0 mt-0.5"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <span className="text-sm text-red-700 leading-relaxed">
            {error}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-slate-700">
              {dir === "rtl"
                ? "الاسم الأول"
                : locale === "fr"
                ? "Prénom"
                : "First Name"}{" "}
              *
            </label>

            <input
              className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={form.firstName}
              onChange={(e) => f("firstName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-slate-700">
              {dir === "rtl"
                ? "اسم العائلة"
                : locale === "fr"
                ? "Nom"
                : "Last Name"}{" "}
              *
            </label>

            <input
              className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={form.lastName}
              onChange={(e) => f("lastName", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">
            {dir === "rtl"
              ? "اسم المتجر / الشركة"
              : locale === "fr"
              ? "Nom de la boutique / société"
              : "Business / Store Name"}
          </label>

          <input
            className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            value={form.companyName}
            onChange={(e) => f("companyName", e.target.value)}
            placeholder={
              dir === "rtl"
                ? "مثال: متجر الأناقة"
                : locale === "fr"
                ? "Ex: Ma Boutique"
                : "e.g. My Store"
            }
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">
            {t("auth.email")} *
          </label>

          <input
            type="email"
            dir="ltr"
            className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
            value={form.email}
            onChange={(e) => f("email", e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">
            {dir === "rtl"
              ? "رقم الهاتف"
              : locale === "fr"
              ? "Téléphone"
              : "Phone"}
          </label>

          <input
            type="tel"
            dir="ltr"
            className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
            value={form.phone}
            onChange={(e) => f("phone", e.target.value)}
            placeholder="+212 6XX XXX XXX"
          />
        </div>

        <PasswordInput
          value={form.password}
          onChange={(v) => f("password", v)}
          label={`${t("auth.password")} *`}
          locale={locale}
          showStrength
        />

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">
            {t("auth.confirmPassword")} *
          </label>

          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              dir="ltr"
              className="w-full h-[48px] px-4 pe-12 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={form.confirmPassword}
              onChange={(e) => f("confirmPassword", e.target.value)}
              placeholder="••••••••"
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
              className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
            >
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>

          {form.confirmPassword.length > 0 && (
            <div className="text-[11px] font-medium">
              {passwordsMatch ? (
                <span className="text-green-600">
                  {dir === "rtl"
                    ? "كلمات المرور متطابقة"
                    : locale === "fr"
                    ? "Les mots de passe correspondent"
                    : "Passwords match"}
                </span>
              ) : (
                <span className="text-red-500">
                  {dir === "rtl"
                    ? "كلمات المرور غير متطابقة"
                    : locale === "fr"
                    ? "Les mots de passe ne correspondent pas"
                    : "Passwords don't match"}
                </span>
              )}
            </div>
          )}
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 accent-blue-600"
          />

          <span className="text-[12px] text-slate-500 leading-relaxed">
            {dir === "rtl"
              ? "أوافق على شروط الاستخدام وسياسة الخصوصية"
              : locale === "fr"
              ? "J’accepte les conditions d’utilisation et la politique de confidentialité"
              : "I agree to the Terms of Service and Privacy Policy"}
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[48px] rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] mt-2"
          style={{
            background: loading
              ? "#94a3b8"
              : "linear-gradient(135deg, #2563eb, #1d4ed8)",
          }}
        >
          {loading
            ? dir === "rtl"
              ? "جارٍ إرسال الطلب..."
              : locale === "fr"
              ? "Envoi..."
              : "Submitting..."
            : dir === "rtl"
            ? "إرسال طلب التسجيل"
            : locale === "fr"
            ? "Envoyer la demande"
            : "Submit registration request"}
        </button>
      </form>

      <div className="mt-7 text-center">
        <p className="text-sm text-slate-500">
          {dir === "rtl"
            ? "لديك حساب بالفعل؟"
            : locale === "fr"
            ? "Vous avez déjà un compte ?"
            : "Already have an account?"}{" "}
          <Link
            href="/client-login"
            className="font-semibold hover:underline"
            style={{ color: "#2563eb" }}
          >
            {dir === "rtl"
              ? "تسجيل الدخول"
              : locale === "fr"
              ? "Se connecter"
              : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

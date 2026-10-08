"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type AuthUser } from "@/lib/auth-context";
import { useI18n } from "@/i18n";

type Role = AuthUser["role"];

const roleMeta = {
  admin: {
    arTitle: "دخول الإدارة",
    frTitle: "Connexion administrateur",
    enTitle: "Admin sign in",
    arSubtitle: "هذه البوابة مخصصة لإدارة CODFlow.",
    frSubtitle: "Ce portail est réservé à l’administration CODFlow.",
    enSubtitle: "This portal is reserved for CODFlow administrators.",
    arBadge: "بوابة الإدارة",
    frBadge: "Portail Admin",
    enBadge: "Admin Portal",
  },
  employee: {
    arTitle: "دخول الموظف",
    frTitle: "Connexion employé",
    enTitle: "Employee sign in",
    arSubtitle: "ادخل إلى مساحة العمل الخاصة بموظفي التأكيد.",
    frSubtitle: "Accédez à votre espace de travail employé.",
    enSubtitle: "Access your employee workspace.",
    arBadge: "مساحة الموظفين",
    frBadge: "Espace Employé",
    enBadge: "Employee Portal",
  },
  client: {
    arTitle: "دخول العميل",
    frTitle: "Connexion client",
    enTitle: "Client sign in",
    arSubtitle: "تابع طلباتك، متاجرك، فواتيرك وتقاريرك.",
    frSubtitle: "Suivez vos commandes, boutiques, factures et rapports.",
    enSubtitle: "Track your orders, stores, invoices and reports.",
    arBadge: "مساحة العملاء",
    frBadge: "Espace Client",
    enBadge: "Client Portal",
  },
} as const;

export default function RoleLogin({ role }: { role: Role }) {
  const { login, logout, user, loading: authLoading } = useAuth();
  const { t, locale, dir } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const meta = roleMeta[role];

  const pick = (ar: string, fr: string, en: string) =>
    dir === "rtl" ? ar : locale === "fr" ? fr : en;

  useEffect(() => {
    if (!authLoading && user?.role === role) {
      router.replace("/");
    }
  }, [authLoading, user, role, router]);

  const wrongPortalMessage = () =>
    role === "admin"
      ? pick(
          "هذا الحساب ليس حساب إدارة. استعمل رابط الدخول الخاص بك.",
          "Ce compte n’est pas un compte administrateur. Utilisez votre portail.",
          "This is not an admin account. Please use your own login portal."
        )
      : role === "employee"
      ? pick(
          "هذا الحساب ليس حساب موظف. استعمل رابط الدخول الخاص بك.",
          "Ce compte n’est pas un compte employé. Utilisez votre portail.",
          "This is not an employee account. Please use your own login portal."
        )
      : pick(
          "هذا الحساب ليس حساب عميل. استعمل رابط الدخول الخاص بك.",
          "Ce compte n’est pas un compte client. Utilisez votre portail.",
          "This is not a client account. Please use your own login portal."
        );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError(
        pick(
          "يرجى ملء جميع الحقول",
          "Veuillez remplir tous les champs",
          "Please fill in all fields"
        )
      );
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        if (result.error === "Account suspended") {
          setError(
            pick(
              "تم تعليق حسابك. يرجى التواصل مع الإدارة.",
              "Votre compte a été suspendu. Contactez l’administration.",
              "Your account has been suspended. Please contact support."
            )
          );
        } else {
          setError(
            pick(
              "البريد الإلكتروني أو كلمة المرور غير صحيحة",
              "Adresse e-mail ou mot de passe incorrect",
              "Incorrect email or password"
            )
          );
        }

        return;
      }

      if (result.user.role !== role) {
        await logout();
        setError(wrongPortalMessage());
        return;
      }

      router.replace("/");
    } catch {
      setError(
        pick(
          "حدث خطأ. يرجى المحاولة مرة أخرى.",
          "Une erreur est survenue. Veuillez réessayer.",
          "An error occurred. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {pick(meta.arBadge, meta.frBadge, meta.enBadge)}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {pick(meta.arTitle, meta.frTitle, meta.enTitle)}
        </h2>

        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          {pick(meta.arSubtitle, meta.frSubtitle, meta.enSubtitle)}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-slate-700">
            {t("auth.email")}
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[48px] px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            placeholder={dir === "rtl" ? "بريدك الإلكتروني" : "you@example.com"}
            required
            autoComplete="email"
            dir="ltr"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-slate-700">
              {t("auth.password")}
            </label>

            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-indigo-600 hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[48px] px-4 pe-12 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              dir="ltr"
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 end-0 pe-3.5 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-indigo-600"
          />

          <span className="text-[13px] text-slate-600">
            {pick("تذكرني", "Se souvenir de moi", "Remember me")}
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[48px] rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: loading
              ? "#94a3b8"
              : "linear-gradient(135deg, #6366f1, #7c3aed)",
          }}
        >
          {loading
            ? pick("جارٍ الدخول...", "Connexion...", "Signing in...")
            : pick("تسجيل الدخول", "Se connecter", "Sign in")}
        </button>
      </form>

      {role === "client" && (
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            {pick(
              "ليس لديك حساب؟",
              "Pas encore de compte ?",
              "Don't have an account?"
            )}{" "}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 hover:underline"
            >
              {pick(
                "إنشاء حساب عميل",
                "Créer un compte client",
                "Create client account"
              )}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

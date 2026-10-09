"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type AuthUser } from "@/lib/auth-context";
import { useI18n } from "@/i18n";

type Role = AuthUser["role"];

const roleMeta = {
  admin: {
    arTitle: "لوحة تحكم الإدارة",
    frTitle: "Espace administrateur",
    enTitle: "Admin Portal",
    arSubtitle: "سجل الدخول إلى حسابك الإداري",
    frSubtitle: "Connectez-vous à votre compte administrateur",
    enSubtitle: "Sign in to your admin account",
  },
  employee: {
    arTitle: "مساحة الموظف",
    frTitle: "Espace employé",
    enTitle: "Employee Portal",
    arSubtitle: "سجل الدخول إلى مساحة تأكيد الطلبات",
    frSubtitle: "Connectez-vous à votre espace de confirmation",
    enSubtitle: "Sign in to your order confirmation workspace",
  },
  client: {
    arTitle: "مساحة العميل",
    frTitle: "Espace client",
    enTitle: "Client Portal",
    arSubtitle: "سجل الدخول لمتابعة طلباتك ومتاجرك",
    frSubtitle: "Connectez-vous pour suivre vos commandes et boutiques",
    enSubtitle: "Sign in to manage your orders and stores",
  },
} as const;

const portalLinks: Array<{
  role: Role;
  href: string;
  ar: string;
  fr: string;
  en: string;
}> = [
  {
    role: "admin",
    href: "/admin-login",
    ar: "الإدمن",
    fr: "Admin",
    en: "Admin",
  },
  {
    role: "employee",
    href: "/employee-login",
    ar: "الموظف",
    fr: "Employé",
    en: "Employee",
  },
  {
    role: "client",
    href: "/client-login",
    ar: "العميل",
    fr: "Client",
    en: "Client",
  },
];

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 6.5h16v11H4z" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.4" />
      {off && <path d="m4 4 16 16" />}
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.6 1.6 3.5-3.8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-4 3.1-6 6.5-6s5.7 2 6.5 6" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 9h16l-1-4H5L4 9Z" />
      <path d="M5 9v10h14V9" />
      <path d="M9 19v-6h6v6" />
    </svg>
  );
}

function ArrowIcon({ rtl }: { rtl: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${rtl ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

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
  const isRtl = dir === "rtl";

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

  const iconForRole = (itemRole: Role) => {
    if (itemRole === "admin") return <ShieldIcon />;
    if (itemRole === "employee") return <UserIcon />;
    return <StoreIcon />;
  };

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[#f5f8ff] text-slate-900 lg:grid lg:grid-cols-[1.08fr_.92fr]"
    >
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/codflow-login-hero.png')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/5 to-[#f5f8ff]/20" />

        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/20 to-transparent" />
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-10 xl:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,.11),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,.08),_transparent_32%)]" />

        <div className="w-full max-w-[590px] rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-[0_30px_80px_rgba(15,23,42,.12)] backdrop-blur sm:p-8 xl:p-10">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-lg font-black text-white shadow-lg shadow-indigo-200">
              C
            </div>

            <div>
              <div className="text-2xl font-black tracking-tight text-slate-950">
                COD<span className="text-indigo-600">Flow</span>
              </div>

              <p className="text-xs text-slate-500">
                {pick(
                  "تأكيد الطلبات باحترافية",
                  "Confirmation COD professionnelle",
                  "Professional COD confirmation"
                )}
              </p>
            </div>
          </div>

          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 hidden items-center justify-center gap-3 lg:flex">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-lg font-black text-white shadow-lg shadow-indigo-200">
                C
              </div>

              <div className="text-[30px] font-black tracking-tight text-slate-950">
                COD<span className="text-indigo-600">Flow</span>
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-[30px]">
              {pick(meta.arTitle, meta.frTitle, meta.enTitle)}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {pick(
                meta.arSubtitle,
                meta.frSubtitle,
                meta.enSubtitle
              )}
            </p>
          </div>

          <div className="mb-7 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
            {portalLinks.map((item) => {
              const active = item.role === role;

              return (
                <Link
                  key={item.role}
                  href={item.href}
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-2 text-[13px] font-bold transition ${
                    active
                      ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <span className="shrink-0">
                    {iconForRole(item.role)}
                  </span>

                  <span>
                    {pick(item.ar, item.fr, item.en)}
                  </span>
                </Link>
              );
            })}
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                {t("auth.email")}
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-slate-400">
                  <MailIcon />
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[58px] w-full rounded-2xl border border-slate-200 bg-white px-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  placeholder={pick(
                    "أدخل بريدك الإلكتروني",
                    "Entrez votre e-mail",
                    "Enter your email"
                  )}
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                {t("auth.password")}
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-slate-400">
                  <LockIcon />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="h-[58px] w-full rounded-2xl border border-slate-200 bg-white px-12 pe-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  placeholder={pick(
                    "أدخل كلمة المرور",
                    "Entrez votre mot de passe",
                    "Enter your password"
                  )}
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((v) => !v)
                  }
                  className="absolute inset-y-0 end-0 flex items-center pe-4 text-slate-400 transition hover:text-indigo-600"
                  tabIndex={-1}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) =>
                    setRemember(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />

                <span className="text-[13px] font-medium text-slate-600">
                  {pick(
                    "تذكرني",
                    "Se souvenir de moi",
                    "Remember me"
                  )}
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[13px] font-bold text-indigo-600 transition hover:text-indigo-700 hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 px-5 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <span>
                {loading
                  ? pick(
                      "جارٍ الدخول...",
                      "Connexion...",
                      "Signing in..."
                    )
                  : pick(
                      "تسجيل الدخول",
                      "Se connecter",
                      "Sign in"
                    )}
              </span>

              {!loading && (
                <ArrowIcon rtl={isRtl} />
              )}
            </button>
          </form>

          {role === "client" && (
            <div className="mt-7 text-center">
              <p className="text-sm text-slate-500">
                {pick(
                  "ليس لديك حساب؟",
                  "Pas encore de compte ?",
                  "Don't have an account?"
                )}{" "}
                <Link
                  href="/register"
                  className="font-extrabold text-indigo-600 hover:underline"
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

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 text-center">
              <p className="text-sm font-bold text-slate-800">
                {pick(
                  "تحتاج مساعدة؟",
                  "Besoin d’aide ?",
                  "Need help?"
                )}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {pick(
                  "تواصل مع مسؤول النظام",
                  "Contactez l’administrateur du système",
                  "Contact your system administrator"
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

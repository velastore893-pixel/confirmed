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
  { role: "admin", href: "/admin-login", ar: "الإدمن", fr: "Admin", en: "Admin" },
  { role: "employee", href: "/employee-login", ar: "الموظف", fr: "Employé", en: "Employee" },
  { role: "client", href: "/client-login", ar: "العميل", fr: "Client", en: "Client" },
];

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.4" />
      {off && <path d="m4 4 16 16" />}
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.6 1.6 3.5-3.8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-4 3.1-6 6.5-6s5.7 2 6.5 6" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
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

function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-[14px] bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
        <path d="M16 3 27 9.2v13L16 29 5 22.2v-13L16 3Z" fill="currentColor" opacity=".96" />
        <path d="m8.5 10.6 7.5 4.1 7.5-4.1M16 14.7V25" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function HeroVisual({
  pick,
}: {
  pick: (ar: string, fr: string, en: string) => string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_30px_80px_rgba(49,46,129,.16)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-indigo-600">
              CODFlow Live
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-900">
              {pick("مركز تأكيد الطلبيات", "Centre de confirmation", "Order confirmation center")}
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {pick("متصل", "En ligne", "Online")}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[.82fr_1.18fr]">
          <div className="rounded-2xl bg-gradient-to-b from-slate-950 to-slate-800 p-4 text-white">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-slate-700/70">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-[#d9a97f]" />
                <div className="absolute -left-4 top-1 h-14 w-3 rounded-full bg-slate-950" />
                <div className="absolute -right-4 top-1 h-14 w-3 rounded-full bg-slate-950" />
                <div className="absolute -left-2 -right-2 top-[-6px] h-7 rounded-t-full bg-slate-950" />
                <div className="absolute -right-9 top-9 h-1.5 w-8 rounded-full bg-slate-950" />
                <div className="absolute -right-10 top-[33px] h-3 w-3 rounded-full bg-slate-950" />
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-sm font-extrabold">
                {pick("موظف التأكيد", "Agent de confirmation", "Confirmation agent")}
              </div>
              <div className="mt-1 text-[11px] text-slate-300">
                {pick("يتابع الطلبات لحظة بلحظة", "Suivi des commandes en temps réel", "Real-time order follow-up")}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white/10 px-3 py-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">
                  {pick("طلبات اليوم", "Commandes aujourd’hui", "Orders today")}
                </span>
                <span className="font-black">128</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div className="h-1.5 w-[78%] rounded-full bg-gradient-to-r from-indigo-400 to-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black text-slate-900">
                {pick("الطلبات الجديدة", "Nouvelles commandes", "New orders")}
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                Live
              </span>
            </div>

            <div className="space-y-2">
              {[
                ["Ahmed", "0612 34 56 78", "Sneakers"],
                ["Sara", "0701 23 45 67", "Sac"],
                ["Youssef", "0666 78 90 12", "Montre"],
                ["Fatima", "0688 11 22 33", "Veste"],
              ].map(([name, phone, product]) => (
                <div
                  key={phone}
                  className="grid grid-cols-[32px_1fr_auto] items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-[11px] font-black text-indigo-700">
                    {name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-extrabold text-slate-800">
                      {name} · {product}
                    </div>
                    <div className="text-[10px] text-slate-500">{phone}</div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[10px] font-extrabold text-white"
                  >
                    {pick("تأكيد", "Confirmer", "Confirm")}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["92", pick("مؤكدة", "Confirmées", "Confirmed")],
                ["18", pick("اتصال لاحق", "Rappel", "Callback")],
                ["18", pick("قيد المعالجة", "En cours", "Processing")],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-2 py-2.5 text-center">
                  <div className="text-sm font-black text-slate-900">{value}</div>
                  <div className="mt-0.5 text-[9px] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          ["10K+", pick("طلبات معالجة", "Commandes traitées", "Orders processed")],
          ["500+", pick("عملاء نشطين", "Clients actifs", "Active clients")],
          ["99%", pick("جودة المتابعة", "Qualité de suivi", "Follow-up quality")],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-3 text-center shadow-sm backdrop-blur"
          >
            <div className="text-lg font-black text-slate-950">{value}</div>
            <div className="mt-1 text-[10px] font-medium text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
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
      className="min-h-screen bg-[#f4f7fc] text-slate-900 lg:grid lg:grid-cols-[minmax(0,1.02fr)_minmax(460px,.98fr)]"
    >
      <section className="relative hidden min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_18%,rgba(96,165,250,.34),transparent_26%),radial-gradient(circle_at_86%_80%,rgba(124,58,237,.20),transparent_26%),linear-gradient(145deg,#f8fbff_0%,#edf4ff_48%,#e8edff_100%)] lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 opacity-[.28] [background-image:linear-gradient(rgba(99,102,241,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,.08)_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative z-10 w-full max-w-[760px] px-8 py-8 xl:px-12">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark size={48} />
              <div>
                <div className="text-[28px] font-black tracking-tight text-slate-950">
                  COD<span className="text-indigo-600">Flow</span>
                </div>
                <div className="text-[10px] font-bold tracking-[.18em] text-slate-500">
                  ORDER CONFIRMATION
                </div>
              </div>
            </div>

            <div className="rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-[11px] font-bold text-indigo-700 shadow-sm backdrop-blur">
              {pick(
                "منصة احترافية لتسيير وتأكيد الطلبيات",
                "Plateforme professionnelle de confirmation COD",
                "Professional COD confirmation platform"
              )}
            </div>
          </div>

          <div className="mb-6 max-w-[620px]">
            <h2 className="text-[32px] font-black leading-[1.15] tracking-tight text-slate-950 xl:text-[38px]">
              {pick(
                "أكد الطلبيات ونمّي عملك",
                "Confirmez vos commandes et développez votre activité",
                "Confirm orders and grow your business"
              )}
            </h2>
            <p className="mt-3 max-w-[590px] text-[14px] leading-6 text-slate-600">
              {pick(
                "منصة متكاملة لإدارة الطلبيات، الموظفين والعملاء وتتبع عملية التأكيد من مكان واحد.",
                "Une plateforme complète pour gérer les commandes, les employés, les clients et le suivi de confirmation.",
                "A complete platform to manage orders, employees, clients and confirmation workflows in one place."
              )}
            </p>
          </div>

          <HeroVisual pick={pick} />
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-10 xl:px-14">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,.07),transparent_28%)]" />

        <div className="w-full max-w-[470px] rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.10)] sm:p-8">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <LogoMark size={44} />
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

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 hidden items-center justify-center gap-3 lg:flex">
              <LogoMark size={46} />
              <div className="text-[28px] font-black tracking-tight text-slate-950">
                COD<span className="text-indigo-600">Flow</span>
              </div>
            </div>

            <h1 className="text-[26px] font-black tracking-tight text-slate-950">
              {pick(meta.arTitle, meta.frTitle, meta.enTitle)}
            </h1>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              {pick(meta.arSubtitle, meta.frSubtitle, meta.enSubtitle)}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-3 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {portalLinks.map((item) => {
              const active = item.role === role;

              return (
                <Link
                  key={item.role}
                  href={item.href}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-[12px] font-bold transition ${
                    active
                      ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <span className="shrink-0">{iconForRole(item.role)}</span>
                  <span>{pick(item.ar, item.fr, item.en)}</span>
                </Link>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-800">
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
                  className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
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
              <label className="mb-1.5 block text-sm font-bold text-slate-800">
                {t("auth.password")}
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-slate-400">
                  <LockIcon />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-12 pe-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
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
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 end-0 flex items-center pe-4 text-slate-400 transition hover:text-indigo-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                <span className="text-[12px] font-medium text-slate-600">
                  {pick("تذكرني", "Se souvenir de moi", "Remember me")}
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[12px] font-bold text-indigo-600 hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 px-5 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <span>
                {loading
                  ? pick("جارٍ الدخول...", "Connexion...", "Signing in...")
                  : pick("تسجيل الدخول", "Se connecter", "Sign in")}
              </span>
              {!loading && <ArrowIcon rtl={isRtl} />}
            </button>
          </form>

          {role === "client" && (
            <div className="mt-6 text-center">
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

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-center">
              <p className="text-[13px] font-bold text-slate-800">
                {pick("تحتاج مساعدة؟", "Besoin d’aide ?", "Need help?")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
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



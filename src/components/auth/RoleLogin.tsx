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
      <path d="M4 6.5h16v11H4z" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="10" width="14" height="10" rx="2" />
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

function LogoMark({ size = 46 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
        <path d="M16 3 27 9.2v13L16 29 5 22.2v-13L16 3Z" fill="currentColor" opacity=".95" />
        <path d="m8.5 10.6 7.5 4.1 7.5-4.1M16 14.7V25" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ConfirmationIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

      <svg
        viewBox="0 0 760 520"
        className="relative z-10 w-full drop-shadow-[0_30px_50px_rgba(15,23,42,.22)]"
        role="img"
        aria-label="CODFlow order confirmation workspace"
      >
        <defs>
          <linearGradient id="desk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eef4ff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity=".22" />
          </filter>
        </defs>

        <rect x="35" y="400" width="690" height="65" rx="24" fill="url(#desk)" opacity=".98" />

        <rect x="350" y="130" width="340" height="245" rx="24" fill="#0f172a" filter="url(#shadow)" />
        <rect x="366" y="146" width="308" height="212" rx="16" fill="url(#screen)" />

        <rect x="390" y="170" width="130" height="18" rx="9" fill="#dbe7ff" />
        <rect x="533" y="170" width="110" height="18" rx="9" fill="#eef2ff" />

        <text x="390" y="220" fontSize="18" fontWeight="800" fill="#0f172a">New Orders</text>
        <text x="612" y="220" fontSize="12" textAnchor="end" fill="#64748b">Live queue</text>

        {[
          ["Ahmed", "0612 34 56 78", "#22c55e"],
          ["Sara", "0701 23 45 67", "#22c55e"],
          ["Youssef", "0666 78 90 12", "#22c55e"],
          ["Fatima", "0688 11 22 33", "#22c55e"],
        ].map((row, i) => {
          const y = 245 + i * 31;
          return (
            <g key={row[0]}>
              <rect x="388" y={y - 18} width="264" height="26" rx="8" fill={i % 2 ? "#f8fafc" : "#ffffff"} />
              <circle cx="405" cy={y - 5} r="8" fill="#e0e7ff" />
              <text x="420" y={y} fontSize="11" fontWeight="700" fill="#334155">{row[0]}</text>
              <text x="485" y={y} fontSize="10" fill="#64748b">{row[1]}</text>
              <rect x="592" y={y - 15} width="48" height="20" rx="7" fill={row[2]} />
              <text x="616" y={y - 1} fontSize="9" textAnchor="middle" fontWeight="800" fill="#fff">Confirm</text>
            </g>
          );
        })}

        <rect x="480" y="375" width="90" height="16" rx="8" fill="#475569" />
        <rect x="508" y="389" width="34" height="38" rx="8" fill="#334155" />

        <ellipse cx="245" cy="420" rx="120" ry="38" fill="#0b1220" opacity=".28" />
        <path d="M135 430c10-88 36-128 97-144 70 11 104 58 115 144H135Z" fill="url(#shirt)" />
        <ellipse cx="232" cy="230" rx="58" ry="66" fill="#d7a77a" />
        <path d="M175 225c2-54 26-82 64-82 29 0 51 15 59 44-21-8-47-10-75-4-17 4-33 17-48 42Z" fill="#171717" />
        <path d="M182 210c-13 3-18 17-16 31 3 16 12 24 22 22" fill="none" stroke="#111827" strokeWidth="10" strokeLinecap="round" />
        <path d="M291 210c15 2 21 14 20 28-1 14-9 23-20 24" fill="none" stroke="#111827" strokeWidth="10" strokeLinecap="round" />
        <path d="M179 204c10-35 34-51 59-51 33 0 57 18 65 52" fill="none" stroke="#111827" strokeWidth="11" strokeLinecap="round" />
        <path d="M289 245c15 4 24 11 31 25" fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
        <circle cx="323" cy="273" r="6" fill="#111827" />

        <rect x="180" y="334" width="120" height="38" rx="10" fill="#0f172a" opacity=".96" />
        <text x="240" y="357" textAnchor="middle" fontSize="16" fontWeight="900" fill="#fff">COD</text>
        <text x="276" y="357" textAnchor="middle" fontSize="16" fontWeight="900" fill="#60a5fa">Flow</text>

        <g transform="translate(70 120)">
          <rect width="220" height="92" rx="20" fill="#fff" opacity=".96" filter="url(#shadow)" />
          <circle cx="44" cy="46" r="22" fill="#dcfce7" />
          <path d="m34 46 7 7 13-16" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="78" y="38" fontSize="13" fontWeight="800" fill="#0f172a">Order confirmed</text>
          <text x="78" y="58" fontSize="11" fill="#64748b">Customer accepted the order</text>
        </g>

        <g transform="translate(65 255)">
          <rect width="230" height="90" rx="20" fill="#fff" opacity=".96" filter="url(#shadow)" />
          <rect x="25" y="24" width="44" height="44" rx="12" fill="url(#blue)" />
          <path d="M36 45h22M47 34v22" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
          <text x="84" y="38" fontSize="13" fontWeight="800" fill="#0f172a">Confirmation service</text>
          <text x="84" y="58" fontSize="11" fill="#64748b">Fast • Organized • Real-time</text>
        </g>
      </svg>

      <div className="relative z-20 -mt-6 grid grid-cols-3 gap-3 px-3">
        {[
          ["10K+", "طلبات تمت معالجتها"],
          ["500+", "عملاء نشطين"],
          ["99%", "جودة المتابعة"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-center text-white shadow-xl backdrop-blur"
          >
            <div className="text-xl font-black">{value}</div>
            <div className="mt-1 text-[11px] text-slate-300">{label}</div>
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
      className="min-h-screen overflow-hidden bg-[#f5f8ff] text-slate-900 lg:grid lg:grid-cols-[1.08fr_.92fr]"
    >
      <section className="relative hidden min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_15%,rgba(96,165,250,.35),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,.3),transparent_28%),linear-gradient(145deg,#f8fbff_0%,#e8f1ff_45%,#dfe9ff_100%)] lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10 px-10 pt-9 xl:px-14 xl:pt-11">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <LogoMark size={52} />
              <div>
                <div className="text-[32px] font-black tracking-tight text-slate-950">
                  COD<span className="text-indigo-600">Flow</span>
                </div>
                <div className="text-xs font-semibold tracking-[.16em] text-slate-500">
                  ORDER CONFIRMATION
                </div>
              </div>
            </div>

            <div className="rounded-full border border-blue-200/70 bg-white/80 px-4 py-2 text-xs font-bold text-blue-700 shadow-sm backdrop-blur">
              {pick(
                "منصة احترافية لتسيير وتأكيد الطلبيات",
                "Plateforme professionnelle de confirmation COD",
                "Professional COD confirmation platform"
              )}
            </div>
          </div>

          <div className="mt-9 max-w-[650px]">
            <h2 className="text-[42px] font-black leading-[1.08] tracking-tight text-slate-950 xl:text-[50px]">
              {pick(
                "أكد الطلبيات ونمّي عملك",
                "Confirmez vos commandes et développez votre activité",
                "Confirm orders and grow your business"
              )}
            </h2>
            <p className="mt-4 max-w-[560px] text-[15px] leading-7 text-slate-600">
              {pick(
                "منصة متكاملة لإدارة الطلبيات، الموظفين، العملاء وتتبع عملية التأكيد في مكان واحد.",
                "Une plateforme complète pour gérer les commandes, les employés, les clients et le suivi de confirmation.",
                "A complete platform to manage orders, employees, clients and confirmation workflows in one place."
              )}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex-1 px-7 pb-8 pt-2 xl:px-10">
          <ConfirmationIllustration />
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-7 sm:px-8 lg:px-10 xl:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,.11),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,.08),_transparent_32%)]" />

        <div className="w-full max-w-[590px] rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-[0_30px_80px_rgba(15,23,42,.12)] backdrop-blur sm:p-8 xl:p-10">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <LogoMark size={46} />
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
              <LogoMark size={48} />
              <div className="text-[30px] font-black tracking-tight text-slate-950">
                COD<span className="text-indigo-600">Flow</span>
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-[30px]">
              {pick(meta.arTitle, meta.frTitle, meta.enTitle)}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {pick(meta.arSubtitle, meta.frSubtitle, meta.enSubtitle)}
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
                  <span className="shrink-0">{iconForRole(item.role)}</span>
                  <span>{pick(item.ar, item.fr, item.en)}</span>
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
                  onChange={(e) => setPassword(e.target.value)}
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
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                <span className="text-[13px] font-medium text-slate-600">
                  {pick("تذكرني", "Se souvenir de moi", "Remember me")}
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
                  ? pick("جارٍ الدخول...", "Connexion...", "Signing in...")
                  : pick("تسجيل الدخول", "Se connecter", "Sign in")}
              </span>
              {!loading && <ArrowIcon rtl={isRtl} />}
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
                {pick("تحتاج مساعدة؟", "Besoin d’aide ?", "Need help?")}
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


"use client";

import { useState } from "react";
import Link from "next/link";

export default function SetupAdminPage() {
  const [email, setEmail] = useState("admin@codflow.ma");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/setup/admin-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          setupSecret: secret,
          email,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Reset failed");
      }

      setMessage(
        "تم تغيير كلمة مرور الأدمن بنجاح. يمكنك تسجيل الدخول الآن."
      );

      setPassword("");
      setSecret("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Reset failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/40">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          استرجاع دخول الأدمن
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          استعمل SETUP_SECRET الموجود في Vercel لتعيين كلمة
          مرور جديدة لحساب الأدمن.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              بريد الأدمن
            </label>

            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              dir="ltr"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              كلمة المرور الجديدة
            </label>

            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              dir="ltr"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              SETUP_SECRET
            </label>

            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              dir="ltr"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-emerald-50 text-emerald-700 p-3 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold disabled:opacity-50"
          >
            {loading
              ? "جاري التغيير..."
              : "تغيير كلمة المرور"}
          </button>
        </form>

        <Link
          href="/login"
          className="block text-center text-sm text-blue-600 mt-5 font-medium"
        >
          الرجوع لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}

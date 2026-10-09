"use client";

import { useMemo, useState } from "react";

type ConnectResult = {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetTitle?: string;
  sheets?: Array<{
    id?: number;
    title: string;
    index?: number;
  }>;
  defaultSheet?: string;
  serviceAccountEmail?: string;
  message?: string;
  error?: string;
};

const SERVICE_ACCOUNT_EMAIL =
  "codflow-sheets@codflow-511102.iam.gserviceaccount.com";

export default function GoogleSheetsConnectCard() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConnectResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState("");

  const sheets = useMemo(() => result?.sheets || [], [result]);

  async function copyServiceEmail() {
    try {
      await navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function connectSheet() {
    const url = sheetUrl.trim();

    if (!url) {
      setResult({
        success: false,
        error: "دخل رابط Google Sheet أولاً.",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setSelectedSheet("");

    try {
      const response = await fetch("/api/google-sheets/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetUrl: url,
        }),
      });

      const data = (await response.json()) as ConnectResult;

      setResult(data);

      if (response.ok && data.success) {
        setSelectedSheet(data.defaultSheet || data.sheets?.[0]?.title || "");
      }
    } catch {
      setResult({
        success: false,
        error: "تعذر الاتصال بالسيرفر. عاود المحاولة.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h8M12 8v8" />
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950">
              ربط Google Sheets
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              شارك الشيت مع CODFlow كـ Viewer، لصق الرابط، ومن بعد اضغط Connect.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              n: "1",
              title: "شارك الشيت",
              text: "من Google Sheets اضغط Share.",
            },
            {
              n: "2",
              title: "ضيف CODFlow",
              text: "خليه Viewer / Lecteur.",
            },
            {
              n: "3",
              title: "لصق الرابط",
              text: "رجع هنا واضغط Connect.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {step.n}
              </div>
              <div className="text-sm font-bold text-slate-800">
                {step.title}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                {step.text}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            إيميل CODFlow للمشاركة
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div
              dir="ltr"
              className="flex min-h-12 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700"
            >
              {SERVICE_ACCOUNT_EMAIL}
            </div>

            <button
              type="button"
              onClick={copyServiceEmail}
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {copied ? "تم النسخ ✓" : "نسخ الإيميل"}
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-400">
            الصلاحية المطلوبة حالياً: Viewer / Lecteur فقط.
          </p>
        </div>

        <div>
          <label
            htmlFor="google-sheet-url"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            رابط Google Sheet
          </label>

          <input
            id="google-sheet-url"
            type="url"
            dir="ltr"
            value={sheetUrl}
            onChange={(event) => setSheetUrl(event.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          />
        </div>

        <button
          type="button"
          onClick={connectSheet}
          disabled={loading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              جاري اختبار الربط...
            </>
          ) : (
            <>Connect Google Sheet</>
          )}
        </button>

        {result && !result.success && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="text-sm font-bold text-red-700">فشل الربط</div>
            <p className="mt-1 text-sm leading-6 text-red-600">
              {result.error || "تعذر الاتصال بـ Google Sheet."}
            </p>
          </div>
        )}

        {result?.success && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-xs text-white">
                ✓
              </span>
              تم الاتصال بـ Google Sheet بنجاح
            </div>

            {result.spreadsheetTitle && (
              <div className="mt-3 text-sm text-emerald-800">
                <span className="font-semibold">الملف:</span>{" "}
                {result.spreadsheetTitle}
              </div>
            )}

            {sheets.length > 0 && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold text-emerald-800">
                  Tab اللي غادي نقراو منو
                </label>

                <select
                  value={selectedSheet}
                  onChange={(event) => setSelectedSheet(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm text-slate-800 outline-none sm:max-w-sm"
                >
                  {sheets.map((sheet) => (
                    <option key={`${sheet.id}-${sheet.title}`} value={sheet.title}>
                      {sheet.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

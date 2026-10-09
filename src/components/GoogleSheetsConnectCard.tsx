"use client";

import { useEffect, useMemo, useState } from "react";

type StoreOption = {
  id: string;
  name: string;
  platformName?: string | null;
  platformSlug?: string | null;
  connectionStatus?: string | null;
  platformConfig?: {
    googleSheets?: {
      spreadsheetId?: string;
      spreadsheetTitle?: string;
      sheetName?: string;
      sheetGid?: number | null;
      sheetUrl?: string;
      connectedAt?: string;
      lastCheckedAt?: string;
    };
  } | null;
};

type ConnectResult = {
  success: boolean;
  storeId?: string;
  spreadsheetId?: string;
  spreadsheetTitle?: string;
  sheets?: Array<{
    id?: number;
    title: string;
    index?: number;
  }>;
  defaultSheet?: string;
  selectedSheet?: string;
  headers?: string[];
  missingHeaders?: string[];
  configurationValid?: boolean;
  message?: string;
  error?: string;
};

const SERVICE_ACCOUNT_EMAIL =
  "codflow-sheets@codflow-511102.iam.gserviceaccount.com";

export default function GoogleSheetsConnectCard({
  stores,
  onConnected,
}: {
  stores: StoreOption[];
  onConnected?: () => void | Promise<void>;
}) {
  const preferredStore =
    stores.find((store) => store.platformSlug === "google_sheets") || stores[0];

  const [storeId, setStoreId] = useState(preferredStore?.id || "");
  const [sheetUrl, setSheetUrl] = useState("");
  const [selectedSheet, setSelectedSheet] = useState("");
  const [availableSheets, setAvailableSheets] = useState<
    Array<{ id?: number; title: string; index?: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConnectResult | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === storeId),
    [stores, storeId]
  );

  const savedConnection = selectedStore?.platformConfig?.googleSheets;

  useEffect(() => {
    if (!storeId && preferredStore?.id) {
      setStoreId(preferredStore.id);
    }
  }, [storeId, preferredStore?.id]);

  useEffect(() => {
    setResult(null);
    setAvailableSheets([]);

    if (savedConnection?.sheetUrl) {
      setSheetUrl(savedConnection.sheetUrl);
    } else {
      setSheetUrl("");
    }

    if (savedConnection?.sheetName) {
      setSelectedSheet(savedConnection.sheetName);
    } else {
      setSelectedSheet("");
    }
  }, [
    storeId,
    savedConnection?.sheetUrl,
    savedConnection?.sheetName,
  ]);

  const isPersistedConnected =
    selectedStore?.connectionStatus === "connected" &&
    !!savedConnection?.spreadsheetId;

  async function copyServiceEmail() {
    try {
      await navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function connectSheet() {
    if (!storeId) {
      setResult({
        success: false,
        error: "اختار المتجر أولاً.",
      });
      return;
    }

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

    try {
      const response = await fetch("/api/google-sheets/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId,
          sheetUrl: url,
          sheetName: selectedSheet || undefined,
        }),
      });

      const data = (await response.json()) as ConnectResult;
      setResult(data);

      if (!response.ok || !data.success) {
        return;
      }

      setAvailableSheets(data.sheets || []);
      setSelectedSheet(
        data.selectedSheet ||
          data.defaultSheet ||
          data.sheets?.[0]?.title ||
          ""
      );

      if (onConnected) {
        await onConnected();
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

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">
                ربط Google Sheets
              </h2>

              {isPersistedConnected && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              )}
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              شارك الشيت مع CODFlow كـ Viewer، اختار المتجر، لصق الرابط، ومن بعد اضغط Connect.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {stores.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            خاصك تزيد متجر أولاً قبل ربط Google Sheets.
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                المتجر
              </label>

              <select
                value={storeId}
                onChange={(event) => setStoreId(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                    {store.platformName ? ` — ${store.platformName}` : ""}
                  </option>
                ))}
              </select>
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
                الصلاحية المطلوبة: Viewer / Lecteur فقط.
              </p>
            </div>

            <div>
              <label
                htmlFor="google-sheet-url"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Google Sheet URL
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

            {(availableSheets.length > 0 || savedConnection?.sheetName) && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Sheet / Tab
                </label>

                {availableSheets.length > 0 ? (
                  <select
                    value={selectedSheet}
                    onChange={(event) => setSelectedSheet(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none"
                  >
                    {availableSheets.map((sheet) => (
                      <option
                        key={`${sheet.id}-${sheet.title}`}
                        value={sheet.title}
                      >
                        {sheet.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
                    {savedConnection?.sheetName}
                  </div>
                )}
              </div>
            )}

            {isPersistedConnected && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="text-sm font-bold text-emerald-800">
                  الربط محفوظ
                </div>
                <div className="mt-2 space-y-1 text-sm text-emerald-700">
                  {savedConnection?.spreadsheetTitle && (
                    <div>
                      الملف:{" "}
                      <span className="font-semibold">
                        {savedConnection.spreadsheetTitle}
                      </span>
                    </div>
                  )}
                  {savedConnection?.sheetName && (
                    <div>
                      Tab:{" "}
                      <span className="font-semibold">
                        {savedConnection.sheetName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={connectSheet}
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  جاري الربط والحفظ...
                </>
              ) : isPersistedConnected ? (
                "إعادة اختبار وحفظ الربط"
              ) : (
                "Connect Google Sheet"
              )}
            </button>
          </>
        )}

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
            <div className="text-sm font-bold text-emerald-700">
              ✓ تم الاتصال وحفظ الربط بنجاح
            </div>

            {result.spreadsheetTitle && (
              <div className="mt-2 text-sm text-emerald-800">
                الملف:{" "}
                <span className="font-semibold">
                  {result.spreadsheetTitle}
                </span>
              </div>
            )}

            {result.missingHeaders &&
              result.missingHeaders.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  الربط خدام، ولكن خاص الشيت يحتوي على هاد الأعمدة:
                  <div dir="ltr" className="mt-1 font-semibold">
                    {result.missingHeaders.join(", ")}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </section>
  );
}

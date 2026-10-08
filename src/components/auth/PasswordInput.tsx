"use client";
import { useState, useMemo } from "react";
import { checkPasswordStrength, type PasswordStrength } from "@/lib/password";

const strengthColors: Record<PasswordStrength, string> = {
  weak: "#dc2626",
  fair: "#d97706",
  good: "#2563eb",
  strong: "#059669",
};

const strengthLabels: Record<string, Record<PasswordStrength, string>> = {
  ar: { weak: "ضعيفة", fair: "مقبولة", good: "جيدة", strong: "قوية" },
  fr: { weak: "Faible", fair: "Correct", good: "Bon", strong: "Fort" },
  en: { weak: "Weak", fair: "Fair", good: "Good", strong: "Strong" },
};

export function PasswordInput({
  value, onChange, label, placeholder, locale = "en", showStrength = false, required = true,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  locale?: string;
  showStrength?: boolean;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const strength = useMemo(() => checkPasswordStrength(value), [value]);

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[13px] font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "••••••••"}
          required={required}
          minLength={8}
          autoComplete="new-password"
          className="w-full h-[48px] px-4 pe-12 rounded-xl border border-slate-200 text-sm bg-white outline-none transition-all
            focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          dir="ltr"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
          tabIndex={-1}
        >
          {visible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {/* Strength indicator */}
      {showStrength && value.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300"
                style={{ background: strength.score >= i ? strengthColors[strength.level] : "#e2e8f0" }} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium" style={{ color: strengthColors[strength.level] }}>
              {strengthLabels[locale]?.[strength.level] || strengthLabels.en[strength.level]}
            </span>
            {strength.feedback.length > 0 && (
              <span className="text-[10px] text-slate-400">{strength.feedback[0]}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
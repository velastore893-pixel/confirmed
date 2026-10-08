export function formatCurrency(amount: number | string, locale = "ar"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00 DH";
  return `${num.toLocaleString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
}

export function formatDate(date: Date | string, locale = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  return d.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA", opts);
}

export function formatDateTime(date: Date | string, locale = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return d.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA", opts);
}

export function generateInvoiceNumber(prefix = "INV"): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${y}${m}-${rand}`;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `ORD-${y}${m}${d}-${rand}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    assigned: "bg-indigo-100 text-indigo-800",
    calling: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    sent_to_delivery: "bg-cyan-100 text-cyan-800",
    in_transit: "bg-purple-100 text-purple-800",
    out_for_delivery: "bg-orange-100 text-orange-800",
    delivered: "bg-emerald-100 text-emerald-800",
    returned: "bg-red-100 text-red-800",
    no_answer: "bg-gray-100 text-gray-800",
    callback: "bg-amber-100 text-amber-800",
    cancelled: "bg-red-100 text-red-800",
    delayed: "bg-orange-100 text-orange-800",
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
    created: "bg-blue-100 text-blue-800",
    pending_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    sent_to_client: "bg-cyan-100 text-cyan-800",
    paid: "bg-emerald-100 text-emerald-800",
    overdue: "bg-red-100 text-red-800",
    cancelled_inv: "bg-red-100 text-red-800",
    verified: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
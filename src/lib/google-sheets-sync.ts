import { createHash } from "crypto";
import { db } from "@/db";
import {
  activityLogs,
  ecommercePlatforms,
  employees,
  integrationLogs,
  notifications,
  orderItems,
  orders,
  orderStatusHistory,
  stores,
} from "@/db/schema";
import { chooseEmployeeForOrder } from "@/lib/distribution-engine";
import { and, eq } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";

export type GoogleSheetSyncResult = {
  success: boolean;
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
  endpoint?: string;
};

type SheetRow = Record<string, string>;

type ColumnMapping = {
  externalOrderId?: string;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  customerRegion?: string;
  customerAddress?: string;
  amount?: string;
  productName?: string;
  quantity?: string;
  sku?: string;
  notes?: string;
};

const aliases: Record<keyof ColumnMapping, string[]> = {
  externalOrderId: ["order id", "order_id", "id", "order number", "order_number", "numero commande", "num commande", "commande", "رقم الطلب"],
  customerName: ["customer name", "customer_name", "customer", "name", "nom", "client", "destinataire", "الاسم", "اسم الزبون"],
  customerPhone: ["customer phone", "customer_phone", "phone", "telephone", "téléphone", "tel", "mobile", "الهاتف", "رقم الهاتف"],
  customerCity: ["customer city", "customer_city", "city", "ville", "المدينة"],
  customerRegion: ["customer region", "customer_region", "region", "région", "الجهة"],
  customerAddress: ["customer address", "customer_address", "address", "adresse", "العنوان"],
  amount: ["cod amount", "cod_amount", "amount", "total", "price", "prix", "montant", "cod", "المبلغ", "الثمن"],
  productName: ["product name", "product_name", "product", "produit", "article", "marchandise", "المنتج"],
  quantity: ["quantity", "qty", "qte", "quantite", "quantité", "الكمية"],
  sku: ["sku", "reference", "référence", "ref"],
  notes: ["notes", "note", "comment", "commentaire", "ملاحظة", "ملاحظات"],
};

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function extractSheetInfo(value: string) {
  const url = (value || "").trim();
  const id = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) throw new Error("Invalid Google Sheets URL");
  let gid = "0";
  try {
    const parsed = new URL(url);
    gid = parsed.searchParams.get("gid") || parsed.hash.match(/gid=(\d+)/)?.[1] || "0";
  } catch {}
  return { id, gid };
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ""; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function resolveMapping(headers: string[], custom: ColumnMapping = {}): ColumnMapping {
  const normalized = new Map(headers.map((h) => [normalizeHeader(h), h]));
  const out: ColumnMapping = {};
  for (const key of Object.keys(aliases) as (keyof ColumnMapping)[]) {
    const preferred = custom[key];
    if (preferred && headers.includes(preferred)) { out[key] = preferred; continue; }
    for (const candidate of aliases[key]) {
      const found = normalized.get(normalizeHeader(candidate));
      if (found) { out[key] = found; break; }
    }
  }
  return out;
}

function asMoney(value?: string) {
  if (!value) return 0;
  const normalized = value.replace(/\s/g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asQuantity(value?: string) {
  const parsed = Number.parseInt((value || "1").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function stableRowId(row: SheetRow) {
  return createHash("sha256").update(JSON.stringify(row)).digest("hex").slice(0, 24);
}

async function fetchSheetCsv(url: string) {
  const { id, gid } = extractSheetInfo(url);
  const endpoint = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: { Accept: "text/csv,text/plain,*/*" },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}`);
    if (/accounts\.google\.com|ServiceLogin|Sign in - Google Accounts/i.test(text) || (response.headers.get("content-type") || "").includes("text/html")) {
      throw new Error("Google Sheet is private. Share it as 'Anyone with the link' (Viewer) or use an authenticated connector.");
    }
    return { text, endpoint, sheetId: id, gid };
  } finally {
    clearTimeout(timer);
  }
}

export async function syncGoogleSheetStore(storeId: string, actorUserId?: string | null): Promise<GoogleSheetSyncResult> {
  const result: GoogleSheetSyncResult = { success: false, imported: 0, skipped: 0, failed: 0, errors: [] };
  const [store] = await db.select({
    id: stores.id,
    clientId: stores.clientId,
    url: stores.url,
    status: stores.status,
    platformId: stores.platformId,
    deliveryCompanyId: stores.deliveryCompanyId,
    assignedEmployeeId: stores.assignedEmployeeId,
    pricePerOrder: stores.pricePerOrder,
    commissionPerOrder: stores.commissionPerOrder,
    platformConfig: stores.platformConfig,
  }).from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) return { ...result, errors: ["Store not found"] };
  if (!store.url) return { ...result, errors: ["Google Sheets URL is missing"] };

  const [platform] = store.platformId
    ? await db.select().from(ecommercePlatforms).where(eq(ecommercePlatforms.id, store.platformId)).limit(1)
    : [null];
  if (!platform || platform.slug !== "google_sheets") return { ...result, errors: ["Store is not configured as Google Sheets"] };

  let fetched: Awaited<ReturnType<typeof fetchSheetCsv>>;
  try {
    fetched = await fetchSheetCsv(store.url);
    result.endpoint = fetched.endpoint;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read Google Sheet";
    await db.insert(integrationLogs).values({
      provider: "google_sheets", providerType: "ecommerce", action: "sync_orders",
      success: false, errorMessage: message, storeId,
    });
    return { ...result, errors: [message] };
  }

  const matrix = parseCsv(fetched.text);
  if (matrix.length < 2) {
    await db.insert(integrationLogs).values({
      provider: "google_sheets", providerType: "ecommerce", action: "sync_orders",
      success: true, storeId, responsePayload: { imported: 0, skipped: 0, reason: "empty_sheet" },
    });
    return { ...result, success: true };
  }

  const headers = matrix[0].map((h) => h.trim());
  const customMapping = ((store.platformConfig as Record<string, unknown> | null)?.sheetMapping || {}) as ColumnMapping;
  const mapping = resolveMapping(headers, customMapping);
  if (!mapping.customerName && !mapping.customerPhone) {
    const error = "No customer name or phone column could be detected. Configure platformConfig.sheetMapping.";
    return { ...result, errors: [error] };
  }

  const rows: SheetRow[] = matrix.slice(1).map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] || "").trim()])));
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const customerName = mapping.customerName ? row[mapping.customerName] : "";
    const customerPhone = mapping.customerPhone ? row[mapping.customerPhone] : "";
    if (!customerName && !customerPhone) { result.skipped++; continue; }

    const sourceId = (mapping.externalOrderId ? row[mapping.externalOrderId] : "") || stableRowId(row);
    const externalOrderId = `gsheet:${fetched.sheetId}:${fetched.gid}:${sourceId}`.slice(0, 100);

    try {
      const [existing] = await db.select({ id: orders.id }).from(orders)
        .where(and(eq(orders.storeId, store.id), eq(orders.externalOrderId, externalOrderId))).limit(1);
      if (existing) { result.skipped++; continue; }

      const city = mapping.customerCity ? row[mapping.customerCity] : "";
      const region = mapping.customerRegion ? row[mapping.customerRegion] : "";
      const distributedEmployeeId = await chooseEmployeeForOrder({ storeId: store.id, city, region });
      const employeeId = distributedEmployeeId || store.assignedEmployeeId;
      const amount = asMoney(mapping.amount ? row[mapping.amount] : undefined);
      const quantity = asQuantity(mapping.quantity ? row[mapping.quantity] : undefined);
      const productName = (mapping.productName ? row[mapping.productName] : "") || "Google Sheets order";

      await db.transaction(async (tx) => {
        const [order] = await tx.insert(orders).values({
          orderNumber: generateOrderNumber(),
          externalOrderId,
          clientId: store.clientId,
          storeId: store.id,
          assignedEmployeeId: employeeId,
          deliveryCompanyId: store.deliveryCompanyId,
          status: employeeId ? "assigned" : "new",
          amount: amount.toFixed(2),
          codAmount: amount.toFixed(2),
          customerName: customerName || customerPhone || "Customer",
          customerPhone: customerPhone || null,
          customerCity: city || null,
          customerRegion: region || null,
          customerAddress: mapping.customerAddress ? row[mapping.customerAddress] || null : null,
          notes: mapping.notes ? row[mapping.notes] || null : null,
          priceAtOrder: store.pricePerOrder || "10.00",
          commissionAtOrder: store.commissionPerOrder || "3.00",
        }).returning();

        await tx.insert(orderItems).values({
          orderId: order.id,
          productName,
          sku: mapping.sku ? row[mapping.sku] || null : null,
          quantity,
          unitPrice: quantity > 0 ? (amount / quantity).toFixed(2) : amount.toFixed(2),
          totalPrice: amount.toFixed(2),
        });

        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          previousStatus: null,
          newStatus: "new",
          changedByUserId: actorUserId || null,
          reason: "Imported from Google Sheets",
          metadata: { externalOrderId, sourceRow: i + 2 },
        });
        if (employeeId) {
          await tx.insert(orderStatusHistory).values({
            orderId: order.id,
            previousStatus: "new",
            newStatus: "assigned",
            changedByUserId: actorUserId || null,
            reason: "Automatic distribution after Google Sheets import",
          });
          const [employee] = await tx.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
          if (employee) {
            await tx.insert(notifications).values({
              userId: employee.userId,
              type: "order_assigned",
              title: "New order assigned",
              body: `Order ${order.orderNumber} imported from Google Sheets`,
              relatedType: "order",
              relatedId: order.id,
            });
          }
        }
      });
      result.imported++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      // Unique constraint races are safe duplicates; everything else is a failed row.
      if (/uniq_orders_store_external|duplicate key/i.test(message)) result.skipped++;
      else { result.failed++; result.errors.push(`Row ${i + 2}: ${message}`); }
    }
  }

  result.success = result.failed === 0;
  await db.insert(integrationLogs).values({
    provider: "google_sheets",
    providerType: "ecommerce",
    action: "sync_orders",
    success: result.success,
    storeId,
    requestPayload: { sheetId: fetched.sheetId, gid: fetched.gid, rows: rows.length },
    responsePayload: { imported: result.imported, skipped: result.skipped, failed: result.failed },
    errorMessage: result.errors.length ? result.errors.slice(0, 5).join(" | ") : null,
  });
  await db.insert(activityLogs).values({
    userId: actorUserId || null,
    action: "google_sheets.synced",
    entityType: "store",
    entityId: storeId,
    newValue: { imported: result.imported, skipped: result.skipped, failed: result.failed },
  });
  return result;
}

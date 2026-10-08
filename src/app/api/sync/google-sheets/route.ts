import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ecommercePlatforms, stores } from "@/db/schema";
import { syncGoogleSheetStore } from "@/lib/google-sheets-sync";
import { and, eq } from "drizzle-orm";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return bearer === secret || req.headers.get("x-cron-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheetStores = await db.select({ id: stores.id, name: stores.name })
    .from(stores)
    .innerJoin(ecommercePlatforms, eq(stores.platformId, ecommercePlatforms.id))
    .where(and(
      eq(stores.status, "active"),
      eq(stores.connectionStatus, "connected"),
      eq(ecommercePlatforms.slug, "google_sheets"),
    ));

  const results = [];
  for (const store of sheetStores) {
    try {
      const result = await syncGoogleSheetStore(store.id, null);
      results.push({ storeId: store.id, storeName: store.name, ...result });
    } catch (error) {
      results.push({ storeId: store.id, storeName: store.name, success: false, imported: 0, skipped: 0, failed: 1, errors: [error instanceof Error ? error.message : "Unknown sync error"] });
    }
  }

  return NextResponse.json({ success: results.every((r) => r.success), stores: results.length, results });
}

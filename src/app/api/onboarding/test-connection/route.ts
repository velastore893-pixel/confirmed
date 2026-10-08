import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stores, ecommercePlatforms, deliveryCompanies, activityLogs } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { testDeliveryProviderConnection, testEcommerceConnection } from "@/lib/integration-connectors";
import { eq } from "drizzle-orm";
import { decryptCredentials } from "@/lib/secrets";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole("client");
    if (!auth.clientId) return NextResponse.json({ error: "No client profile" }, { status: 404 });

    const body = await req.json();
    const { storeId, testType } = body;
    if (!storeId || !["platform", "delivery"].includes(testType)) {
      return NextResponse.json({ error: "Store ID and valid test type are required" }, { status: 400 });
    }

    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (!store || store.clientId !== auth.clientId) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    let result;
    if (testType === "platform") {
      if (!store.platformId) return NextResponse.json({ error: "No platform configured" }, { status: 400 });
      const [platform] = await db.select().from(ecommercePlatforms).where(eq(ecommercePlatforms.id, store.platformId)).limit(1);
      if (!platform) return NextResponse.json({ error: "Platform not found" }, { status: 404 });

      result = await testEcommerceConnection(
        platform.slug,
        store.url || "",
        decryptCredentials(store.platformCredentials),
      );

      await db.update(stores).set({
        connectionStatus: result.success ? "connected" : "failed",
        lastConnectionTestAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(stores.id, storeId));
    } else {
      if (!store.deliveryCompanyId) return NextResponse.json({ error: "No delivery company configured" }, { status: 400 });
      const [company] = await db.select().from(deliveryCompanies).where(eq(deliveryCompanies.id, store.deliveryCompanyId)).limit(1);
      if (!company) return NextResponse.json({ error: "Delivery company not found" }, { status: 404 });

      if (!company.hasApi) {
        result = { success: true, message: "Manual delivery mode selected — no API connection is required" };
      } else {
        result = await testDeliveryProviderConnection(
          company.apiBaseUrl || "",
          (company.config as Record<string, unknown>) || {},
          decryptCredentials(store.deliveryCredentials),
          company.slug,
        );
      }

      await db.update(stores).set({
        deliveryConnectionStatus: result.success ? "connected" : "failed",
        lastDeliveryTestAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(stores.id, storeId));
    }

    await db.insert(activityLogs).values({
      userId: auth.id,
      action: `store.${testType}_test`,
      entityType: "store",
      entityId: storeId,
      newValue: {
        success: result.success,
        status: "status" in result ? result.status : undefined,
        endpoint: "endpoint" in result ? result.endpoint : undefined,
        error: "error" in result ? result.error : undefined,
      },
    });

    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err) {
    console.error("Connection test error:", err);
    return NextResponse.json({ error: "Connection test failed unexpectedly" }, { status: 500 });
  }
}

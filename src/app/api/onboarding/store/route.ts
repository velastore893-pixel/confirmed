import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stores, clients, ecommercePlatforms, deliveryCompanies, notifications, users, activityLogs } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { encryptCredentials } from "@/lib/secrets";

export async function GET() {
  try {
    const auth = await requireRole("client");
    if (!auth.clientId) return NextResponse.json({ stores: [] });
    const items = await db.select({
      id: stores.id, name: stores.name, status: stores.status, url: stores.url,
      platformId: stores.platformId, deliveryCompanyId: stores.deliveryCompanyId,
      connectionStatus: stores.connectionStatus, lastConnectionTestAt: stores.lastConnectionTestAt,
      deliveryConnectionStatus: stores.deliveryConnectionStatus, lastDeliveryTestAt: stores.lastDeliveryTestAt,
      createdAt: stores.createdAt, platformName: ecommercePlatforms.name,
      platformSlug: ecommercePlatforms.slug, deliveryName: deliveryCompanies.name,
    }).from(stores)
      .leftJoin(ecommercePlatforms, eq(stores.platformId, ecommercePlatforms.id))
      .leftJoin(deliveryCompanies, eq(stores.deliveryCompanyId, deliveryCompanies.id))
      .where(eq(stores.clientId, auth.clientId));
    return NextResponse.json({ stores: items });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole("client");
    if (!auth.clientId) return NextResponse.json({ error: "No client profile" }, { status: 404 });
    const body = await req.json();
    const { name, platformId, deliveryCompanyId, url, platformCredentials, deliveryCredentials } = body;

    if (!name?.trim() || !platformId || !deliveryCompanyId || !url?.trim()) {
      return NextResponse.json({ error: "Store name, platform, URL, and delivery company are required" }, { status: 400 });
    }

    // Verify platform exists
    const [platform] = await db.select().from(ecommercePlatforms).where(eq(ecommercePlatforms.id, platformId)).limit(1);
    if (!platform) return NextResponse.json({ error: "Invalid platform" }, { status: 400 });

    // Verify delivery company exists
    const [delCompany] = await db.select().from(deliveryCompanies).where(eq(deliveryCompanies.id, deliveryCompanyId)).limit(1);
    if (!delCompany) return NextResponse.json({ error: "Invalid delivery company" }, { status: 400 });

    const [store] = await db.insert(stores).values({
      clientId: auth.clientId,
      name: name.trim(),
      platformId,
      deliveryCompanyId,
      url: url.trim(),
      status: "pending",
      platformCredentials: encryptCredentials(platformCredentials || {}),
      deliveryCredentials: encryptCredentials(deliveryCredentials || {}),
      connectionStatus: "not_tested",
      deliveryConnectionStatus: "not_tested",
    }).returning();

    // Update client onboarding step
    await db.update(clients).set({
      onboardingStep: 2,
      updatedAt: new Date(),
    }).where(eq(clients.id, auth.clientId));

    // Notify all admins
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: "store_pending",
        title: "New store pending review",
        body: `${name} (${platform.name}) submitted by client for activation`,
        relatedType: "store",
        relatedId: store.id,
      });
    }

    // Log activity
    await db.insert(activityLogs).values({
      userId: auth.id,
      action: "store.submitted",
      entityType: "store",
      entityId: store.id,
      newValue: { name, platform: platform.name, delivery: delCompany.name, status: "pending" },
    });

    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    console.error("Store creation error:", err);
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole("client");
    if (!auth.clientId) return NextResponse.json({ error: "No client profile" }, { status: 404 });
    const body = await req.json();
    const { storeId, name, url, platformCredentials, deliveryCredentials, deliveryCompanyId } = body;

    if (!storeId) return NextResponse.json({ error: "Store ID required" }, { status: 400 });

    // Verify store belongs to client
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (!store || store.clientId !== auth.clientId) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Only allow editing pending stores (or re-connecting active ones)
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (platformCredentials !== undefined) {
      updateData.platformCredentials = encryptCredentials(platformCredentials || {});
      updateData.connectionStatus = "not_tested";
    }
    if (deliveryCredentials !== undefined) {
      updateData.deliveryCredentials = encryptCredentials(deliveryCredentials || {});
      updateData.deliveryConnectionStatus = "not_tested";
    }
    if (deliveryCompanyId !== undefined) updateData.deliveryCompanyId = deliveryCompanyId;

    await db.update(stores).set(updateData).where(eq(stores.id, storeId));

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
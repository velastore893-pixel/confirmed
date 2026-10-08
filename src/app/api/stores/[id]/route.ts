import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stores, clients, users, ecommercePlatforms, deliveryCompanies, notifications, activityLogs } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const [store] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role === "client" && auth.clientId !== store.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole("admin");
    const { id } = await params;
    const body = await req.json();
    const { status, assignedEmployeeId, name, platformId, deliveryCompanyId, pricePerOrder, commissionPerOrder, url } = body;

    const [store] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (assignedEmployeeId !== undefined) updateData.assignedEmployeeId = assignedEmployeeId;
    if (name !== undefined) updateData.name = name;
    if (platformId !== undefined) updateData.platformId = platformId;
    if (deliveryCompanyId !== undefined) updateData.deliveryCompanyId = deliveryCompanyId;
    if (pricePerOrder !== undefined) updateData.pricePerOrder = pricePerOrder;
    if (commissionPerOrder !== undefined) updateData.commissionPerOrder = commissionPerOrder;
    if (url !== undefined) updateData.url = url;

    await db.update(stores).set(updateData).where(eq(stores.id, id));

    if (status === "active" && store.status !== "active") {
      // Notify client
      const [client] = await db.select().from(clients).where(eq(clients.id, store.clientId)).limit(1);
      if (client) {
        await db.insert(notifications).values({
          userId: client.userId, type: "store_activated", title: "Store activated",
          body: `${store.name} is now active`, relatedType: "store", relatedId: id,
        });
      }
    }

    await db.insert(activityLogs).values({
      userId: auth.id, action: "store.updated", entityType: "store", entityId: id,
      previousValue: { status: store.status, assignedEmployeeId: store.assignedEmployeeId },
      newValue: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
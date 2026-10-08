import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  stores,
  clients,
  notifications,
  activityLogs,
} from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (auth.role === "client" && auth.clientId !== store.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ store });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAdmin = auth.role === "admin";
    const isOwnerClient =
      auth.role === "client" &&
      !!auth.clientId &&
      auth.clientId === store.clientId;

    if (!isAdmin && !isOwnerClient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Client can only update his own store connection/basic information.
    if (isOwnerClient) {
      if (body.name !== undefined) updateData.name = body.name;
      if (body.platformId !== undefined) updateData.platformId = body.platformId;
      if (body.url !== undefined) updateData.url = body.url;

      // Kept available for the later "multiple stores -> default delivery"
      // assignment flow. It is NOT required when creating a store.
      if (body.deliveryCompanyId !== undefined) {
        updateData.deliveryCompanyId =
          body.deliveryCompanyId === "" ? null : body.deliveryCompanyId;
      }
    }

    // Admin keeps full management permissions.
    if (isAdmin) {
      if (body.status !== undefined) updateData.status = body.status;
      if (body.assignedEmployeeId !== undefined) {
        updateData.assignedEmployeeId =
          body.assignedEmployeeId === "" ? null : body.assignedEmployeeId;
      }
      if (body.name !== undefined) updateData.name = body.name;
      if (body.platformId !== undefined) {
        updateData.platformId = body.platformId === "" ? null : body.platformId;
      }
      if (body.deliveryCompanyId !== undefined) {
        updateData.deliveryCompanyId =
          body.deliveryCompanyId === "" ? null : body.deliveryCompanyId;
      }
      if (body.pricePerOrder !== undefined) {
        updateData.pricePerOrder = body.pricePerOrder;
      }
      if (body.commissionPerOrder !== undefined) {
        updateData.commissionPerOrder = body.commissionPerOrder;
      }
      if (body.url !== undefined) updateData.url = body.url;
    }

    await db.update(stores).set(updateData).where(eq(stores.id, id));

    if (isAdmin && body.status === "active" && store.status !== "active") {
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, store.clientId))
        .limit(1);

      if (client) {
        await db.insert(notifications).values({
          userId: client.userId,
          type: "store_activated",
          title: "Store activated",
          body: `${store.name} is now active`,
          relatedType: "store",
          relatedId: id,
        });
      }
    }

    await db.insert(activityLogs).values({
      userId: auth.id,
      action: "store.updated",
      entityType: "store",
      entityId: id,
      previousValue: {
        status: store.status,
        assignedEmployeeId: store.assignedEmployeeId,
        platformId: store.platformId,
        deliveryCompanyId: store.deliveryCompanyId,
        name: store.name,
        url: store.url,
      },
      newValue: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Store PATCH error:", err);

    if ((err as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

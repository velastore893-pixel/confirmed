import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stores, clients, users, employees, notifications, activityLogs } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole("admin");
    const { id } = await params;
    const body = await req.json();
    const { action, assignedEmployeeId, notes } = body; // action: "activate" | "reject" | "request_correction"

    const [store] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    let notificationTitle = "";
    let notificationBody = "";

    switch (action) {
      case "activate":
        if (assignedEmployeeId) updateData.assignedEmployeeId = assignedEmployeeId;
        updateData.status = "active";
        notificationTitle = "Store activated";
        notificationBody = `Your store "${store.name}" has been activated and is now live!`;
        break;
      case "reject":
        updateData.status = "suspended";
        notificationTitle = "Store not approved";
        notificationBody = `Your store "${store.name}" was not approved. ${notes || "Please contact support."}`;
        break;
      case "request_correction":
        updateData.status = "pending";
        notificationTitle = "Store needs corrections";
        notificationBody = `Your store "${store.name}" needs corrections: ${notes || "Please review and update."}`;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await db.update(stores).set(updateData).where(eq(stores.id, id));

    // Notify client
    const [client] = await db.select().from(clients).where(eq(clients.id, store.clientId)).limit(1);
    if (client) {
      await db.insert(notifications).values({
        userId: client.userId,
        type: action === "activate" ? "store_activated" : "store_suspended",
        title: notificationTitle,
        body: notificationBody,
        relatedType: "store",
        relatedId: id,
      });
    }

    // Log activity
    await db.insert(activityLogs).values({
      userId: auth.id,
      action: `store.${action}`,
      entityType: "store",
      entityId: id,
      previousValue: { status: store.status },
      newValue: { status: updateData.status, assignedEmployeeId: updateData.assignedEmployeeId },
    });

    return NextResponse.json({ success: true, status: updateData.status });
  } catch (err) {
    console.error("Store approval error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
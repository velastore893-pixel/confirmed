import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, deliveryCompanies, notifications, orders, orderStatusHistory, stores, users } from "@/db/schema";
import { eq } from "drizzle-orm";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function defaultSiftStatusMap(raw: string) {
  const v = normalize(raw);
  if (v === "livree") return "delivered" as const;
  if (v === "nouvelle") return "sent_to_delivery" as const;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.SIFT_WEBHOOK_SECRET;
    if (!expectedSecret) {
      return NextResponse.json({ error: "SIFT webhook secret is not configured" }, { status: 503 });
    }
    const providedSecret = req.nextUrl.searchParams.get("secret") || req.headers.get("x-webhook-secret");
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const rawStatus = String(body.status || "").trim();
    if (!reference || !rawStatus) {
      return NextResponse.json({ error: "reference and status are required" }, { status: 400 });
    }

    const [order] = await db.select().from(orders).where(eq(orders.trackingNumber, reference)).limit(1);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const [store] = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
    let mapped = defaultSiftStatusMap(rawStatus) as typeof order.status | null;
    if (store?.deliveryCompanyId) {
      const [company] = await db.select().from(deliveryCompanies).where(eq(deliveryCompanies.id, store.deliveryCompanyId)).limit(1);
      const configuredMap = ((company?.config as Record<string, unknown>)?.statusMap || {}) as Record<string, string>;
      const configured = configuredMap[rawStatus] || configuredMap[normalize(rawStatus)];
      if (configured) mapped = configured as typeof order.status;
    }

    if (mapped && mapped !== order.status) {
      const updates: Record<string, unknown> = { status: mapped, updatedAt: new Date() };
      if (mapped === "delivered") updates.deliveredAt = new Date();
      if (mapped === "returned") updates.returnedAt = new Date();
      await db.update(orders).set(updates).where(eq(orders.id, order.id));
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        previousStatus: order.status,
        newStatus: mapped,
        reason: body.comment || `SIFT status: ${rawStatus}`,
        metadata: { provider: "sift-livraison", rawStatus, reporter: body.reporter, comment: body.comment },
      });

      const notificationType = mapped === "delivered" ? "order_delivered" : mapped === "returned" ? "order_returned" : null;
      if (notificationType) {
        const admins = await db.select().from(users).where(eq(users.role, "admin"));
        for (const admin of admins) {
          await db.insert(notifications).values({
            userId: admin.id,
            type: notificationType,
            title: mapped === "delivered" ? "Order delivered" : "Order returned",
            body: `Order ${order.orderNumber} updated by SIFT: ${rawStatus}`,
            relatedType: "order",
            relatedId: order.id,
          });
        }
      }
    }

    await db.insert(activityLogs).values({
      action: "sift.webhook",
      entityType: "order",
      entityId: order.id,
      newValue: { reference, rawStatus, mappedStatus: mapped, reporter: body.reporter, comment: body.comment },
    });

    return NextResponse.json({ success: true, mappedStatus: mapped, rawStatus });
  } catch (error) {
    console.error("SIFT webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

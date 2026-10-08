import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceOrders, orders, clients, employees, users, payments, activityLogs, notifications } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Tenant isolation
    if (auth.role === "client" && auth.clientId !== invoice.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invOrders = await db.select({
      id: invoiceOrders.id, orderId: invoiceOrders.orderId, amount: invoiceOrders.amount,
      commission: invoiceOrders.commission, orderNumber: orders.orderNumber,
      orderStatus: orders.status, deliveredAt: orders.deliveredAt,
    }).from(invoiceOrders)
      .leftJoin(orders, eq(invoiceOrders.orderId, orders.id))
      .where(eq(invoiceOrders.invoiceId, id));

    const pays = await db.select().from(payments).where(eq(payments.invoiceId, id));

    const [client] = invoice.clientId ? await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1) : [null];
    const [clientUser] = client ? await db.select().from(users).where(eq(users.id, client.userId)).limit(1) : [null];

    return NextResponse.json({
      invoice, invoiceOrders: invOrders, payments: pays,
      client: client ? { ...client, firstName: clientUser?.firstName, lastName: clientUser?.lastName, email: clientUser?.email } : null,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (status) {
      // Only admin can approve, send, mark paid
      if (["approved", "sent_to_client", "paid"].includes(status) && auth.role !== "admin") {
        return NextResponse.json({ error: "Only admin can change to this status" }, { status: 403 });
      }
      // Client cannot mark as paid
      if (status === "paid" && auth.role === "client") {
        return NextResponse.json({ error: "Clients cannot mark invoices as paid" }, { status: 403 });
      }

      updateData.status = status;
      if (status === "approved") updateData.approvedByUserId = auth.id;
      if (status === "sent_to_client") updateData.sentAt = new Date();
      if (status === "paid") updateData.paidAt = new Date();

      // Notify relevant users
      if (status === "approved" || status === "sent_to_client") {
        if (invoice.clientId) {
          const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
          if (client) {
            await db.insert(notifications).values({
              userId: client.userId, type: status === "approved" ? "invoice_approved" : "invoice_sent",
              title: status === "approved" ? "Invoice approved" : "Invoice sent",
              body: `Invoice ${invoice.invoiceNumber} has been ${status}`,
              relatedType: "invoice", relatedId: id,
            });
          }
        }
      }

      if (status === "paid" && invoice.clientId) {
        const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
        if (client) {
          await db.insert(notifications).values({
            userId: client.userId, type: "invoice_paid", title: "Invoice paid",
            body: `Invoice ${invoice.invoiceNumber} has been marked as paid`,
            relatedType: "invoice", relatedId: id,
          });
        }
      }

      await db.insert(activityLogs).values({
        userId: auth.id, action: `invoice.${status}`, entityType: "invoice", entityId: id,
        previousValue: { status: invoice.status }, newValue: { status },
      });
    }

    if (notes !== undefined) updateData.notes = notes;
    await db.update(invoices).set(updateData).where(eq(invoices.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
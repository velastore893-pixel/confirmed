import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, invoices, clients, users, activityLogs, notifications } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole("admin");
    const { id } = await params;
    const body = await req.json();
    const { status, notes, proofPath } = body;

    const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) {
      updateData.status = status;
      if (status === "verified") {
        updateData.verifiedByUserId = auth.id;
        updateData.verifiedAt = new Date();
      }
    }
    if (notes) updateData.notes = notes;
    if (proofPath) updateData.proofPath = proofPath;

    await db.update(payments).set(updateData).where(eq(payments.id, id));

    // If payment verified, update invoice
    if (status === "verified") {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId)).limit(1);
      if (invoice) {
        await db.update(invoices).set({ status: "paid", paidAt: new Date(), updatedAt: new Date() }).where(eq(invoices.id, invoice.id));
        // Notify
        if (invoice.clientId) {
          const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
          if (client) {
            await db.insert(notifications).values({
              userId: client.userId, type: "invoice_paid", title: "Invoice payment verified",
              body: `Your payment for invoice ${invoice.invoiceNumber} has been verified`,
              relatedType: "invoice", relatedId: invoice.id,
            });
          }
        }
      }
    }

    await db.insert(activityLogs).values({
      userId: auth.id, action: `payment.${status || "updated"}`, entityType: "payment", entityId: id,
      previousValue: { status: payment.status }, newValue: updateData,
    });

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
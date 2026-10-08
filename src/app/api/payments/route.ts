import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, invoices, clients, employees, users, activityLogs, notifications } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");

    let query = db.select().from(payments).$dynamic();
    const conditions = [];

    if (invoiceId) conditions.push(eq(payments.invoiceId, invoiceId));

    // Tenant isolation: client can only see payments for their invoices
    if (auth.role === "client" && auth.clientId) {
      const clientInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.clientId, auth.clientId));
      const invoiceIds = clientInvoices.map(i => i.id);
      if (invoiceIds.length === 0) return NextResponse.json({ items: [] });
    }

    if (conditions.length) query = query.where(and(...conditions));
    const items = await query.orderBy(desc(payments.createdAt));
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();
    const { invoiceId, amount, method, reference, receiptPath, notes } = body;

    if (!invoiceId || !amount) return NextResponse.json({ error: "Invoice and amount required" }, { status: 400 });

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // Client can only submit payments for their own invoices
    if (auth.role === "client" && auth.clientId !== invoice.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [payment] = await db.insert(payments).values({
      invoiceId, amount: String(amount), method: method || "bank_transfer",
      reference, receiptPath, notes,
      status: auth.role === "client" ? "pending" : "verified",
      verifiedByUserId: auth.role !== "client" ? auth.id : undefined,
      verifiedAt: auth.role !== "client" ? new Date() : undefined,
    }).returning();

    // Notify admin of client payment
    if (auth.role === "client") {
      const admins = await db.select().from(users).where(eq(users.role, "admin"));
      for (const a of admins) {
        await db.insert(notifications).values({
          userId: a.id, type: "payment_received", title: "Payment receipt submitted",
          body: `Payment receipt for invoice ${invoice.invoiceNumber} submitted for review`,
          relatedType: "payment", relatedId: payment.id,
        });
      }
    }

    await db.insert(activityLogs).values({
      userId: auth.id, action: "payment.created", entityType: "payment", entityId: payment.id,
      newValue: { invoiceId, amount, method },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
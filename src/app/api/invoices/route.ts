import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceOrders, orders, clients, employees, users, activityLogs, notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc, count, gte, lte } from "drizzle-orm";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (auth.role === "client" && auth.clientId) conditions.push(eq(invoices.clientId, auth.clientId));
    if (auth.role === "employee" && auth.employeeId) conditions.push(eq(invoices.employeeId, auth.employeeId));
    if (type) conditions.push(eq(invoices.type, type));
    if (status) conditions.push(eq(invoices.status, status as typeof invoices.$inferSelect.status));
    const where = conditions.length ? and(...conditions) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(invoices).where(where);
    const items = await db.select({
      id: invoices.id, invoiceNumber: invoices.invoiceNumber, type: invoices.type,
      clientId: invoices.clientId, employeeId: invoices.employeeId,
      linkedInvoiceId: invoices.linkedInvoiceId,
      periodStart: invoices.periodStart, periodEnd: invoices.periodEnd,
      orderCount: invoices.orderCount, pricePerOrder: invoices.pricePerOrder,
      subtotal: invoices.subtotal, total: invoices.total,
      commissionPerOrder: invoices.commissionPerOrder, commissionTotal: invoices.commissionTotal,
      status: invoices.status, createdAt: invoices.createdAt, paidAt: invoices.paidAt,
      dueDate: invoices.dueDate, notes: invoices.notes,
      clientCompanyName: clients.companyName,
      employeeFirstName: users.firstName, employeeLastName: users.lastName,
    }).from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(employees, eq(invoices.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(where).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset);

    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    console.error("Invoices GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.role === "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { clientId, startDate, endDate } = body;
    if (!clientId || !startDate || !endDate) {
      return NextResponse.json({ error: "Client, start date, and end date required" }, { status: 400 });
    }

    const periodStart = new Date(startDate);
    const periodEnd = new Date(`${endDate}T23:59:59.999`);
    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
      return NextResponse.json({ error: "Invalid invoice period" }, { status: 400 });
    }

    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const payload = await db.transaction(async (tx) => {
      // SERIALIZABLE isolation + isBilled=false means two simultaneous invoice requests
      // cannot both successfully bill the same delivered orders.
      const deliveredOrders = await tx.select().from(orders).where(and(
        eq(orders.clientId, clientId),
        eq(orders.status, "delivered"),
        eq(orders.isBilled, false),
        gte(orders.deliveredAt, periodStart),
        lte(orders.deliveredAt, periodEnd),
      ));

      if (deliveredOrders.length === 0) throw new Error("NO_BILLABLE_ORDERS");

      const defaultClientPrice = Number.parseFloat(client.defaultPricePerOrder || "10.00") || 10;
      const billable = deliveredOrders.map((order) => ({
        order,
        price: Number.parseFloat(order.priceAtOrder || "") || defaultClientPrice,
        commission: Number.parseFloat(order.commissionAtOrder || "") || 0,
      }));

      const clientTotal = billable.reduce((sum, item) => sum + item.price, 0);
      const averagePrice = clientTotal / billable.length;
      const clientInvNumber = generateInvoiceNumber("CLI");
      const [clientInvoice] = await tx.insert(invoices).values({
        invoiceNumber: clientInvNumber,
        type: "client",
        clientId,
        periodStart,
        periodEnd,
        orderCount: billable.length,
        pricePerOrder: averagePrice.toFixed(2),
        subtotal: clientTotal.toFixed(2),
        total: clientTotal.toFixed(2),
        status: "created",
        createdByEmployeeId: auth.employeeId || null,
        notes: billable.some((x) => Math.abs(x.price - averagePrice) > 0.001)
          ? "Contains historical per-order pricing; pricePerOrder is the average. Exact amounts are stored on invoice order lines."
          : null,
      }).returning();

      for (const item of billable) {
        await tx.insert(invoiceOrders).values({
          invoiceId: clientInvoice.id,
          orderId: item.order.id,
          amount: item.price.toFixed(2),
          commission: item.commission.toFixed(2),
        });
      }

      // Commission invoices are generated per employee from the commission frozen on each order,
      // not from the user who happened to click "create invoice".
      const grouped = new Map<string, typeof billable>();
      for (const item of billable) {
        const employeeId = item.order.assignedEmployeeId;
        if (!employeeId || item.commission <= 0) continue;
        const group = grouped.get(employeeId) || [];
        group.push(item);
        grouped.set(employeeId, group);
      }

      const commissionInvoices = [];
      for (const [employeeId, items] of grouped.entries()) {
        const commissionTotal = items.reduce((sum, item) => sum + item.commission, 0);
        const averageCommission = commissionTotal / items.length;
        const [commissionInvoice] = await tx.insert(invoices).values({
          invoiceNumber: generateInvoiceNumber("COM"),
          type: "commission",
          clientId,
          employeeId,
          linkedInvoiceId: clientInvoice.id,
          periodStart,
          periodEnd,
          orderCount: items.length,
          commissionPerOrder: averageCommission.toFixed(2),
          subtotal: commissionTotal.toFixed(2),
          total: commissionTotal.toFixed(2),
          commissionTotal: commissionTotal.toFixed(2),
          status: "created",
          createdByEmployeeId: auth.employeeId || null,
          notes: items.some((x) => Math.abs(x.commission - averageCommission) > 0.001)
            ? "Contains historical per-order commission rates; commissionPerOrder is the average."
            : null,
        }).returning();

        for (const item of items) {
          await tx.insert(invoiceOrders).values({
            invoiceId: commissionInvoice.id,
            orderId: item.order.id,
            amount: item.price.toFixed(2),
            commission: item.commission.toFixed(2),
          });
        }
        commissionInvoices.push(commissionInvoice);
      }

      if (commissionInvoices.length === 1) {
        await tx.update(invoices).set({ linkedInvoiceId: commissionInvoices[0].id }).where(eq(invoices.id, clientInvoice.id));
      }

      // Mark billed only after all invoice lines have been created successfully.
      for (const item of billable) {
        await tx.update(orders).set({
          isBilled: true,
          billedInvoiceId: clientInvoice.id,
          updatedAt: new Date(),
        }).where(and(eq(orders.id, item.order.id), eq(orders.isBilled, false)));
      }

      await tx.insert(activityLogs).values({
        userId: auth.id,
        action: "invoice.created",
        entityType: "invoice",
        entityId: clientInvoice.id,
        newValue: {
          invoiceNumber: clientInvNumber,
          orderCount: billable.length,
          total: clientTotal,
          commissionInvoiceCount: commissionInvoices.length,
        },
      });

      await tx.insert(notifications).values({
        userId: client.userId,
        type: "invoice_created",
        title: "New invoice created",
        body: `Invoice ${clientInvNumber} created for ${billable.length} delivered orders`,
        relatedType: "invoice",
        relatedId: clientInvoice.id,
      });

      const admins = await tx.select().from(users).where(eq(users.role, "admin"));
      for (const admin of admins) {
        if (admin.id === auth.id) continue;
        await tx.insert(notifications).values({
          userId: admin.id,
          type: "invoice_created",
          title: "New invoice created",
          body: `Invoice ${clientInvNumber} created for ${client.companyName || "client"} - ${billable.length} orders`,
          relatedType: "invoice",
          relatedId: clientInvoice.id,
        });
      }

      return { clientInvoice, commissionInvoices };
    }, { isolationLevel: "serializable" });

    return NextResponse.json({
      ...payload,
      // Backwards compatibility for the existing UI when only one employee is involved.
      commissionInvoice: payload.commissionInvoices[0] || null,
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NO_BILLABLE_ORDERS") {
      return NextResponse.json({ error: "No billable delivered orders found in this period" }, { status: 400 });
    }
    if (/could not serialize access|serialization/i.test(message)) {
      return NextResponse.json({ error: "Another invoice is being created for these orders. Please retry." }, { status: 409 });
    }
    console.error("Invoices POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

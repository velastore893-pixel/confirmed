import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, orderCalls, callbacks, stores, clients, employees, users, deliveryCompanies, customers, activityLogs, notifications } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { dispatchOrderToConfiguredDelivery } from "@/lib/delivery-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Tenant isolation
    if (auth.role === "client" && auth.clientId !== order.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (auth.role === "employee" && auth.employeeId !== order.assignedEmployeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const history = await db.select({
      id: orderStatusHistory.id, previousStatus: orderStatusHistory.previousStatus,
      newStatus: orderStatusHistory.newStatus, reason: orderStatusHistory.reason,
      createdAt: orderStatusHistory.createdAt, changedByName: users.firstName,
      changedByLastName: users.lastName,
    }).from(orderStatusHistory)
      .leftJoin(users, eq(orderStatusHistory.changedByUserId, users.id))
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(orderStatusHistory.createdAt);

    const calls = await db.select().from(orderCalls).where(eq(orderCalls.orderId, id)).orderBy(desc(orderCalls.calledAt));
    const cbs = await db.select().from(callbacks).where(eq(callbacks.orderId, id)).orderBy(callbacks.scheduledDate);

    // Related entities
    const [store] = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
    const [client] = await db.select().from(clients).where(eq(clients.id, order.clientId)).limit(1);
    const [clientUser] = client ? await db.select().from(users).where(eq(users.id, client.userId)).limit(1) : [null];
    let empUser = null;
    if (order.assignedEmployeeId) {
      const [emp] = await db.select().from(employees).where(eq(employees.id, order.assignedEmployeeId)).limit(1);
      if (emp) [empUser] = await db.select().from(users).where(eq(users.id, emp.userId)).limit(1);
    }
    const [delComp] = order.deliveryCompanyId ? await db.select().from(deliveryCompanies).where(eq(deliveryCompanies.id, order.deliveryCompanyId)).limit(1) : [null];

    return NextResponse.json({
      order, items, history, calls, callbacks: cbs,
      store, client: client ? { ...client, firstName: clientUser?.firstName, lastName: clientUser?.lastName, email: clientUser?.email } : null,
      employee: empUser ? { firstName: empUser.firstName, lastName: empUser.lastName } : null,
      deliveryCompany: delComp,
    });
  } catch (err) {
    console.error("Order GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { status, notes, assignedEmployeeId, callResult, callbackDate, callbackNotes } = body;

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Tenant isolation
    if (auth.role === "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (auth.role === "employee" && auth.employeeId !== order.assignedEmployeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    let requestedStatus = status as typeof order.status | undefined;

    // A recorded call outcome is also an operational status change.
    // This keeps the order list, timeline and call history in sync with one action.
    if (callResult) {
      const callStatusMap: Record<string, typeof order.status> = {
        confirmed: "confirmed",
        no_answer: "no_answer",
        cancelled: "cancelled",
        callback: "callback",
      };
      requestedStatus = callStatusMap[callResult] ?? requestedStatus;
    }

    // Handle status change
    if (requestedStatus && requestedStatus !== order.status) {
      updateData.status = requestedStatus;
      if (requestedStatus === "confirmed") updateData.confirmedAt = new Date();
      if (requestedStatus === "delivered") updateData.deliveredAt = new Date();
      if (requestedStatus === "returned") updateData.returnedAt = new Date();

      await db.insert(orderStatusHistory).values({
        orderId: id,
        previousStatus: order.status,
        newStatus: requestedStatus,
        changedByUserId: auth.id,
        reason: notes || (callResult ? `Call result: ${callResult}` : undefined),
      });

      // Keep confirmed visible as a real state. Shipment creation should only move the
      // order to sent_to_delivery after a real delivery API call succeeds.
    }

    if (notes !== undefined) updateData.notes = notes;

    // Transfer (admin only)
    if (assignedEmployeeId !== undefined && auth.role === "admin") {
      updateData.assignedEmployeeId = assignedEmployeeId;
      await db.insert(activityLogs).values({
        userId: auth.id, action: "order.transferred", entityType: "order", entityId: id,
        previousValue: { employeeId: order.assignedEmployeeId },
        newValue: { employeeId: assignedEmployeeId },
      });
    }

    await db.update(orders).set(updateData).where(eq(orders.id, id));

    // After a real confirmation, create the shipment through the configured delivery API.
    // The order moves to sent_to_delivery only if the provider accepts the shipment.
    let deliveryDispatch: Awaited<ReturnType<typeof dispatchOrderToConfiguredDelivery>> | null = null;
    if (requestedStatus === "confirmed" && requestedStatus !== order.status) {
      deliveryDispatch = await dispatchOrderToConfiguredDelivery(id);
      if (deliveryDispatch.success) {
        await db.update(orders).set({
          status: "sent_to_delivery",
          trackingNumber: deliveryDispatch.trackingNumber,
          shipmentId: deliveryDispatch.shipmentId,
          updatedAt: new Date(),
        }).where(eq(orders.id, id));
        await db.insert(orderStatusHistory).values({
          orderId: id,
          previousStatus: "confirmed",
          newStatus: "sent_to_delivery",
          changedByUserId: auth.id,
          reason: `Shipment created with ${deliveryDispatch.provider || "delivery provider"}`,
          metadata: { trackingNumber: deliveryDispatch.trackingNumber, provider: deliveryDispatch.provider },
        });
      } else {
        const admins = await db.select().from(users).where(eq(users.role, "admin"));
        for (const admin of admins) {
          await db.insert(notifications).values({
            userId: admin.id,
            type: "integration_error",
            title: "Delivery integration error",
            body: `Order ${order.orderNumber}: ${deliveryDispatch.error || "Shipment creation failed"}`,
            relatedType: "order",
            relatedId: id,
            metadata: { provider: deliveryDispatch.provider, error: deliveryDispatch.error },
          });
        }
      }
    }

    // Record call. Admins may update status, but call records belong to an employee.
    if (callResult && auth.employeeId) {
      await db.insert(orderCalls).values({
        orderId: id, employeeId: auth.employeeId, callResult, notes,
      });
    }

    // Callback requires a concrete date/time and is stored for the assigned employee.
    if (callResult === "callback" && callbackDate) {
      const callbackEmployeeId = auth.employeeId || order.assignedEmployeeId;
      if (callbackEmployeeId) {
        await db.insert(callbacks).values({
          orderId: id,
          employeeId: callbackEmployeeId,
          scheduledDate: new Date(callbackDate),
          notes: callbackNotes || notes,
        });

        // Notify the employee that a callback was scheduled.
        const [employee] = await db.select().from(employees).where(eq(employees.id, callbackEmployeeId)).limit(1);
        if (employee) {
          await db.insert(notifications).values({
            userId: employee.userId,
            type: "callback_scheduled",
            title: "Callback scheduled",
            body: `Order ${order.orderNumber} callback scheduled`,
            relatedType: "order",
            relatedId: id,
            metadata: { scheduledDate: callbackDate },
          });
        }

        // The merchant/client must also be able to follow scheduled callbacks for their orders.
        const [client] = await db.select().from(clients).where(eq(clients.id, order.clientId)).limit(1);
        if (client && client.userId !== employee?.userId) {
          await db.insert(notifications).values({
            userId: client.userId,
            type: "callback_scheduled",
            title: "Customer callback scheduled",
            body: `Order ${order.orderNumber}: a follow-up call has been scheduled`,
            relatedType: "order",
            relatedId: id,
            metadata: { scheduledDate: callbackDate, employeeId: callbackEmployeeId },
          });
        }
      }
    }

    await db.insert(activityLogs).values({
      userId: auth.id, action: "order.updated", entityType: "order", entityId: id,
      previousValue: { status: order.status }, newValue: updateData,
    });

    return NextResponse.json({ success: true, deliveryDispatch });
  } catch (err) {
    console.error("Order PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
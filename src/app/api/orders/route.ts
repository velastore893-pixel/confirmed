import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, stores, clients, users, employees, customers, orderItems, orderStatusHistory, deliveryCompanies, notifications, activityLogs } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq, and, ilike, desc, count, sql, gte, lte, inArray } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";
import { chooseEmployeeForOrder } from "@/lib/distribution-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const storeId = searchParams.get("storeId");
    const employeeId = searchParams.get("employeeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    // Tenant isolation
    if (auth.role === "client" && auth.clientId) {
      conditions.push(eq(orders.clientId, auth.clientId));
    }
    if (auth.role === "employee" && auth.employeeId) {
      conditions.push(eq(orders.assignedEmployeeId, auth.employeeId));
    }
    if (status) conditions.push(eq(orders.status, status as typeof orders.$inferSelect.status));
    if (search) conditions.push(ilike(orders.orderNumber, `%${search}%`));
    if (storeId) conditions.push(eq(orders.storeId, storeId));
    if (employeeId && auth.role === "admin") conditions.push(eq(orders.assignedEmployeeId, employeeId));
    if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(orders.createdAt, new Date(dateTo + "T23:59:59")));

    const where = conditions.length ? and(...conditions) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(orders).where(where);

    const items = await db.select({
      id: orders.id, orderNumber: orders.orderNumber, status: orders.status,
      amount: orders.amount, codAmount: orders.codAmount, customerName: orders.customerName,
      customerPhone: orders.customerPhone, customerCity: orders.customerCity,
      customerRegion: orders.customerRegion, customerAddress: orders.customerAddress,
      trackingNumber: orders.trackingNumber, notes: orders.notes,
      clientId: orders.clientId, storeId: orders.storeId,
      assignedEmployeeId: orders.assignedEmployeeId, deliveryCompanyId: orders.deliveryCompanyId,
      confirmedAt: orders.confirmedAt, deliveredAt: orders.deliveredAt, returnedAt: orders.returnedAt,
      priceAtOrder: orders.priceAtOrder, commissionAtOrder: orders.commissionAtOrder,
      isBilled: orders.isBilled, createdAt: orders.createdAt, updatedAt: orders.updatedAt,
      storeName: stores.name, clientCompanyName: clients.companyName,
      employeeFirstName: users.firstName, employeeLastName: users.lastName,
      deliveryCompanyName: deliveryCompanies.name,
    }).from(orders)
      .leftJoin(stores, eq(orders.storeId, stores.id))
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .leftJoin(employees, eq(orders.assignedEmployeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(deliveryCompanies, eq(orders.deliveryCompanyId, deliveryCompanies.id))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit).offset(offset);

    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    console.error("Orders GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const { storeId, customerName, customerPhone, customerCity, customerRegion, customerAddress, amount, items: orderItemsData, notes, customerId } = body;

    if (!storeId || !customerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (auth.role === "client" && auth.clientId !== store.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (auth.role === "employee" && auth.employeeId !== store.assignedEmployeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const distributedEmployeeId = await chooseEmployeeForOrder({
      storeId: store.id,
      city: customerCity,
      region: customerRegion,
    });
    const finalEmployeeId = distributedEmployeeId || store.assignedEmployeeId;

    const orderNumber = generateOrderNumber();
    const [order] = await db.insert(orders).values({
      orderNumber, clientId: store.clientId, storeId, customerId,
      assignedEmployeeId: finalEmployeeId,
      deliveryCompanyId: store.deliveryCompanyId,
      status: finalEmployeeId ? "assigned" : "new",
      amount: amount || "0", codAmount: amount || "0",
      customerName, customerPhone, customerCity, customerRegion, customerAddress,
      notes, priceAtOrder: store.pricePerOrder || "10.00",
      commissionAtOrder: store.commissionPerOrder || "3.00",
    }).returning();

    // Insert order items
    if (orderItemsData && Array.isArray(orderItemsData)) {
      for (const item of orderItemsData) {
        await db.insert(orderItems).values({
          orderId: order.id, productName: item.productName,
          quantity: item.quantity || 1, unitPrice: item.unitPrice || "0",
          totalPrice: (parseFloat(item.unitPrice || "0") * (item.quantity || 1)).toFixed(2),
        });
      }
    }

    // Status history
    await db.insert(orderStatusHistory).values({
      orderId: order.id, newStatus: "new", changedByUserId: auth.id,
    });

    if (finalEmployeeId) {
      await db.insert(orderStatusHistory).values({
        orderId: order.id, newStatus: "assigned", previousStatus: "new", changedByUserId: auth.id,
      });
      // Notify employee
      const [emp] = await db.select().from(employees).where(eq(employees.id, finalEmployeeId)).limit(1);
      if (emp) {
        await db.insert(notifications).values({
          userId: emp.userId, type: "order_assigned", title: "New order assigned",
          body: `Order ${orderNumber} assigned to you`, relatedType: "order", relatedId: order.id,
        });
      }
    }

    await db.insert(activityLogs).values({
      userId: auth.id, action: "order.created", entityType: "order", entityId: order.id,
      newValue: { orderNumber, amount, customerName },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Orders POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, invoices, notifications, activityLogs, employees, users, callbacks } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, gte, lte, count, sql, desc, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "today";

    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (period) {
      case "yesterday":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Tenant isolation
    const tenant = auth.role === "client" && auth.clientId
      ? eq(orders.clientId, auth.clientId)
      : auth.role === "employee" && auth.employeeId
        ? eq(orders.assignedEmployeeId, auth.employeeId)
        : undefined;

    const baseWhere = tenant ? and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate), tenant) : and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate));

    // Status breakdown
    const statusCounts = await db.select({
      status: orders.status, count: count(),
    }).from(orders).where(baseWhere).groupBy(orders.status);

    const statusMap: Record<string, number> = {};
    let totalOrders = 0;
    for (const s of statusCounts) {
      statusMap[s.status] = Number(s.count);
      totalOrders += Number(s.count);
    }

    // Derived
    const confirmedCount = (statusMap["confirmed"] || 0) + (statusMap["sent_to_delivery"] || 0) + (statusMap["in_transit"] || 0) + (statusMap["out_for_delivery"] || 0) + (statusMap["delivered"] || 0);
    const deliveredCount = statusMap["delivered"] || 0;
    const returnedCount = statusMap["returned"] || 0;

    let revenue = "0", outstanding = "0", unreadNotifications = 0;
    let recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: Date | null; userName: string | null }> = [];
    let topEmployees: Array<{ name: string; orders: number; delivered: number }> = [];

    // Finance (admin/client)
    if (auth.role === "admin" || auth.role === "client") {
      const finWhere = auth.role === "client" && auth.clientId
        ? and(eq(invoices.type, "client"), eq(invoices.clientId, auth.clientId))
        : eq(invoices.type, "client");

      const [revResult] = await db.select({
        total: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total}::numeric ELSE 0 END), 0)`,
      }).from(invoices).where(and(finWhere, gte(invoices.createdAt, startDate), lte(invoices.createdAt, endDate)));

      const [outResult] = await db.select({
        total: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} NOT IN ('paid','cancelled','draft') THEN ${invoices.total}::numeric ELSE 0 END), 0)`,
      }).from(invoices).where(and(finWhere, gte(invoices.createdAt, startDate), lte(invoices.createdAt, endDate)));

      revenue = String(revResult.total || "0");
      outstanding = String(outResult.total || "0");
    }

    // Notifications
    const [notifCount] = await db.select({ count: count() }).from(notifications)
      .where(and(eq(notifications.userId, auth.id), eq(notifications.isRead, false)));
    unreadNotifications = Number(notifCount.count);

    // Recent activity (admin)
    if (auth.role === "admin") {
      recentActivity = await db.select({
        id: activityLogs.id, action: activityLogs.action, entityType: activityLogs.entityType,
        createdAt: activityLogs.createdAt, userName: users.firstName,
      }).from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .orderBy(desc(activityLogs.createdAt)).limit(10);
    }

    // Top employees (admin) — detailed stats for CRM cards
    if (auth.role === "admin") {
      const empData = await db.select({
        firstName: users.firstName, lastName: users.lastName, email: users.email,
        total: count(),
        confirmed: sql<string>`SUM(CASE WHEN ${orders.status} IN ('confirmed','sent_to_delivery','in_transit','out_for_delivery','delivered') THEN 1 ELSE 0 END)`,
        delivered: sql<string>`SUM(CASE WHEN ${orders.status} = 'delivered' THEN 1 ELSE 0 END)`,
        returned: sql<string>`SUM(CASE WHEN ${orders.status} = 'returned' THEN 1 ELSE 0 END)`,
        noAnswer: sql<string>`SUM(CASE WHEN ${orders.status} = 'no_answer' THEN 1 ELSE 0 END)`,
        cancelled: sql<string>`SUM(CASE WHEN ${orders.status} = 'cancelled' THEN 1 ELSE 0 END)`,
        pending: sql<string>`SUM(CASE WHEN ${orders.status} IN ('new','assigned','calling','callback') THEN 1 ELSE 0 END)`,
      }).from(orders)
        .leftJoin(employees, eq(orders.assignedEmployeeId, employees.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .where(and(baseWhere, sql`${users.firstName} IS NOT NULL`))
        .groupBy(users.firstName, users.lastName, users.email)
        .orderBy(desc(count())).limit(8);
      topEmployees = empData.map(e => ({
        name: `${e.firstName || "N/A"} ${e.lastName || ""}`,
        email: e.email || "",
        orders: Number(e.total),
        confirmed: Number(e.confirmed),
        delivered: Number(e.delivered),
        returned: Number(e.returned),
        noAnswer: Number(e.noAnswer),
        cancelled: Number(e.cancelled),
        pending: Number(e.pending),
      }));
    }

    // Pending scheduled callbacks. Clients see callbacks for their own orders; employees see only theirs.
    let scheduledCallbacks: Array<{
      id: string; orderId: string; orderNumber: string; customerName: string | null; customerPhone: string | null;
      scheduledDate: Date; notes: string | null; employeeName: string | null;
    }> = [];
    try {
      const callbackScope = auth.role === "client" && auth.clientId
        ? eq(orders.clientId, auth.clientId)
        : auth.role === "employee" && auth.employeeId
          ? eq(callbacks.employeeId, auth.employeeId)
          : undefined;

      const callbackWhere = callbackScope
        ? and(eq(callbacks.status, "pending"), callbackScope)
        : eq(callbacks.status, "pending");

      const cbRows = await db.select({
        id: callbacks.id,
        orderId: callbacks.orderId,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        scheduledDate: callbacks.scheduledDate,
        notes: callbacks.notes,
        employeeFirstName: users.firstName,
        employeeLastName: users.lastName,
      }).from(callbacks)
        .innerJoin(orders, eq(callbacks.orderId, orders.id))
        .leftJoin(employees, eq(callbacks.employeeId, employees.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .where(callbackWhere)
        .orderBy(asc(callbacks.scheduledDate))
        .limit(12);

      scheduledCallbacks = cbRows.map(cb => ({
        id: cb.id, orderId: cb.orderId, orderNumber: cb.orderNumber,
        customerName: cb.customerName, customerPhone: cb.customerPhone,
        scheduledDate: cb.scheduledDate, notes: cb.notes,
        employeeName: [cb.employeeFirstName, cb.employeeLastName].filter(Boolean).join(" ") || null,
      }));
    } catch {}

    // Orders by date for chart
    const ordersByDate: Array<{ date: string; total: number; confirmed: number; delivered: number; returned: number }> = [];
    try {
      const dateData = await db.select({
        date: sql<string>`TO_CHAR(${orders.createdAt}::date, 'YYYY-MM-DD')`,
        total: count(),
        confirmed: sql<string>`SUM(CASE WHEN ${orders.status} IN ('confirmed','sent_to_delivery','in_transit','out_for_delivery','delivered') THEN 1 ELSE 0 END)`,
        delivered: sql<string>`SUM(CASE WHEN ${orders.status} = 'delivered' THEN 1 ELSE 0 END)`,
        returned: sql<string>`SUM(CASE WHEN ${orders.status} = 'returned' THEN 1 ELSE 0 END)`,
      }).from(orders).where(baseWhere)
        .groupBy(sql`${orders.createdAt}::date`)
        .orderBy(sql`${orders.createdAt}::date`);
      for (const d of dateData) {
        ordersByDate.push({ date: d.date, total: Number(d.total), confirmed: Number(d.confirmed), delivered: Number(d.delivered), returned: Number(d.returned) });
      }
    } catch {}

    return NextResponse.json({
      ordersToday: totalOrders,
      confirmedToday: confirmedCount,
      deliveredToday: deliveredCount,
      returnedToday: returnedCount,
      totalOrders,
      confirmationRate: totalOrders > 0 ? (confirmedCount / totalOrders * 100).toFixed(1) : "0",
      deliveryRate: totalOrders > 0 ? (deliveredCount / totalOrders * 100).toFixed(1) : "0",
      returnRate: totalOrders > 0 ? (returnedCount / totalOrders * 100).toFixed(1) : "0",
      revenue, outstanding,
      unreadNotifications,
      recentActivity,
      topEmployees,
      scheduledCallbacks,
      statusBreakdown: statusMap,
      ordersByDate,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
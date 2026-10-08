import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, employees, users, stores, clients, deliveryCompanies } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq, and, gte, lte, count, sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const now = new Date();
    let startDate: Date;
    let endDate = new Date();
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom); endDate = new Date(dateTo + "T23:59:59");
    } else {
      switch (period) {
        case "today": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
        case "yesterday": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
        case "week": startDate = new Date(now.getTime() - 7 * 86400000); break;
        default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    const dateConditions = and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate));

    // Tenant isolation
    const baseConditions = auth.role === "client" && auth.clientId
      ? and(dateConditions, eq(orders.clientId, auth.clientId))
      : auth.role === "employee" && auth.employeeId
        ? and(dateConditions, eq(orders.assignedEmployeeId, auth.employeeId))
        : dateConditions;

    // Status counts
    const statusCounts = await db.select({
      status: orders.status, count: count(),
    }).from(orders).where(baseConditions).groupBy(orders.status);

    const statusMap: Record<string, number> = {};
    let totalOrders = 0;
    for (const s of statusCounts) {
      statusMap[s.status] = Number(s.count);
      totalOrders += Number(s.count);
    }

    // Employee performance (admin only)
    let employeePerformance: Array<{ name: string; orders: number; confirmed: number; delivered: number; returned: number }> = [];
    if (auth.role === "admin") {
      const empData = await db.select({
        firstName: users.firstName, lastName: users.lastName,
        total: count(),
        delivered: sql<string>`SUM(CASE WHEN ${orders.status} = 'delivered' THEN 1 ELSE 0 END)`,
        confirmed: sql<string>`SUM(CASE WHEN ${orders.status} = 'confirmed' OR ${orders.status} = 'sent_to_delivery' OR ${orders.status} = 'in_transit' OR ${orders.status} = 'out_for_delivery' OR ${orders.status} = 'delivered' THEN 1 ELSE 0 END)`,
        returned: sql<string>`SUM(CASE WHEN ${orders.status} = 'returned' THEN 1 ELSE 0 END)`,
      }).from(orders)
        .leftJoin(employees, eq(orders.assignedEmployeeId, employees.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .where(baseConditions)
        .groupBy(users.firstName, users.lastName)
        .orderBy(desc(count()));
      employeePerformance = empData.map(e => ({
        name: `${e.firstName || "Unassigned"} ${e.lastName || ""}`,
        orders: Number(e.total), confirmed: Number(e.confirmed),
        delivered: Number(e.delivered), returned: Number(e.returned),
      }));
    }

    return NextResponse.json({
      totalOrders,
      statusBreakdown: statusMap,
      newOrders: statusMap["new"] || 0,
      confirmed: (statusMap["confirmed"] || 0) + (statusMap["sent_to_delivery"] || 0) + (statusMap["in_transit"] || 0) + (statusMap["delivered"] || 0),
      cancelled: statusMap["cancelled"] || 0,
      noAnswer: statusMap["no_answer"] || 0,
      delivered: statusMap["delivered"] || 0,
      returned: statusMap["returned"] || 0,
      confirmationRate: totalOrders > 0 ? (((statusMap["confirmed"] || 0) + (statusMap["delivered"] || 0) + (statusMap["sent_to_delivery"] || 0) + (statusMap["in_transit"] || 0)) / totalOrders * 100).toFixed(1) : "0",
      deliveryRate: totalOrders > 0 ? ((statusMap["delivered"] || 0) / totalOrders * 100).toFixed(1) : "0",
      returnRate: totalOrders > 0 ? ((statusMap["returned"] || 0) / totalOrders * 100).toFixed(1) : "0",
      employeePerformance,
    });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
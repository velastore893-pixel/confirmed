import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, payments } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let startDate: Date;
    let endDate = new Date();
    const now = new Date();

    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo + "T23:59:59");
    } else {
      switch (period) {
        case "today": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
        case "yesterday": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
        case "week": startDate = new Date(now.getTime() - 7 * 86400000); break;
        case "year": startDate = new Date(now.getFullYear(), 0, 1); break;
        default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // Revenue from paid client invoices
    const [revenueResult] = await db.select({
      total: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
    }).from(invoices).where(and(
      eq(invoices.type, "client"),
      eq(invoices.status, "paid"),
      gte(invoices.paidAt, startDate),
      lte(invoices.paidAt, endDate),
    ));

    // Commissions from paid commission invoices
    const [commResult] = await db.select({
      total: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
    }).from(invoices).where(and(
      eq(invoices.type, "commission"),
      eq(invoices.status, "paid"),
      gte(invoices.paidAt, startDate),
      lte(invoices.paidAt, endDate),
    ));

    // Outstanding (unpaid client invoices)
    const [outstandingResult] = await db.select({
      total: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
      count: sql<string>`COUNT(*)`,
    }).from(invoices).where(and(
      eq(invoices.type, "client"),
      sql`${invoices.status} NOT IN ('paid', 'cancelled', 'draft')`,
      gte(invoices.createdAt, startDate),
      lte(invoices.createdAt, endDate),
    ));

    // Paid invoices count
    const [paidCount] = await db.select({ count: sql<string>`COUNT(*)` }).from(invoices).where(and(
      eq(invoices.type, "client"), eq(invoices.status, "paid"),
      gte(invoices.paidAt, startDate), lte(invoices.paidAt, endDate),
    ));

    // Unpaid invoices count
    const [unpaidCount] = await db.select({ count: sql<string>`COUNT(*)` }).from(invoices).where(and(
      eq(invoices.type, "client"),
      sql`${invoices.status} NOT IN ('paid', 'cancelled', 'draft')`,
      gte(invoices.createdAt, startDate), lte(invoices.createdAt, endDate),
    ));

    const revenue = parseFloat(revenueResult.total || "0");
    const commissions = parseFloat(commResult.total || "0");
    const outstanding = parseFloat(outstandingResult.total || "0");

    return NextResponse.json({
      revenue, commissions, expenses: 0,
      netAmount: revenue - commissions,
      outstanding, paidInvoices: parseInt(paidCount.count || "0"),
      unpaidInvoices: parseInt(unpaidCount.count || "0"),
      outstandingCount: parseInt(outstandingResult.count || "0"),
    });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
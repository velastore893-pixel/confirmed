import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq, and, desc, count, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    const where = search ? ilike(activityLogs.action, `%${search}%`) : undefined;
    const [{ total }] = await db.select({ total: count() }).from(activityLogs).where(where);
    const items = await db.select({
      id: activityLogs.id, userId: activityLogs.userId, action: activityLogs.action,
      entityType: activityLogs.entityType, entityId: activityLogs.entityId,
      previousValue: activityLogs.previousValue, newValue: activityLogs.newValue,
      metadata: activityLogs.metadata, ipAddress: activityLogs.ipAddress,
      createdAt: activityLogs.createdAt,
      userName: users.firstName, userLastName: users.lastName, userRole: users.role,
    }).from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(where).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset);

    return NextResponse.json({ items, total, page, limit });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
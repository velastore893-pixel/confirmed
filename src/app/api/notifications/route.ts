import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const conditions = [eq(notifications.userId, auth.id)];
    if (unreadOnly) conditions.push(eq(notifications.isRead, false));
    const where = and(...conditions);

    const [{ total }] = await db.select({ total: count() }).from(notifications).where(where);
    const [{ unread }] = await db.select({ unread: count() }).from(notifications).where(and(eq(notifications.userId, auth.id), eq(notifications.isRead, false)));
    const items = await db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset);

    return NextResponse.json({ items, total, unread, page, limit });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
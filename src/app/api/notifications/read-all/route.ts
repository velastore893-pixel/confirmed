import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST() {
  try {
    const auth = await requireAuth();
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, auth.id), eq(notifications.isRead, false)));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
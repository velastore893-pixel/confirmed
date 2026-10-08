import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await requireAuth();
    const settings = await db.select().from(systemSettings);
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json({ settings: settingsMap });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
    const body = await req.json();
    const { settings } = body;
    if (!settings || typeof settings !== "object") return NextResponse.json({ error: "Invalid settings" }, { status: 400 });

    for (const [key, value] of Object.entries(settings)) {
      const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
      if (existing.length > 0) {
        await db.update(systemSettings).set({ value, updatedAt: new Date() }).where(eq(systemSettings.key, key));
      } else {
        await db.insert(systemSettings).values({ key, value });
      }
    }

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
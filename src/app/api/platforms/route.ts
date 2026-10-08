import { NextResponse } from "next/server";
import { db } from "@/db";
import { ecommercePlatforms } from "@/db/schema";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const platforms = await db.select().from(ecommercePlatforms);
    return NextResponse.json({ items: platforms });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
import { NextResponse } from "next/server";
import { seed } from "@/db/seed";
import { requireRole } from "@/lib/auth";

export async function POST() {
  try {
    await requireRole("admin");
    await seed();
    return NextResponse.json({ success: true, message: "Database seeded" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized" || (err as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
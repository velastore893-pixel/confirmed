import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { count } from "drizzle-orm";
import { seed } from "@/db/seed";

// One-time setup endpoint: only works when database has zero users
export async function POST() {
  try {
    const [{ total }] = await db.select({ total: count() }).from(users);
    if (total > 0) {
      return NextResponse.json({ error: "System already set up. Use the admin account to log in." }, { status: 403 });
    }

    await seed();

    return NextResponse.json({
      success: true,
      message: "System initialized. Check server logs for initial account credentials.",
      notice: "Initial temporary passwords were printed to the server console. Please change them after first login.",
    });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
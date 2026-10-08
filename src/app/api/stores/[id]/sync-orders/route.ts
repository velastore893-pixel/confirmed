import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { syncGoogleSheetStore } from "@/lib/google-sheets-sync";
import { eq } from "drizzle-orm";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const [store] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (auth.role === "client" && auth.clientId !== store.clientId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (auth.role === "employee" && auth.employeeId !== store.assignedEmployeeId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const result = await syncGoogleSheetStore(id, auth.id);
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (error) {
    console.error("Google Sheets manual sync error:", error);
    return NextResponse.json({ error: "Unable to sync Google Sheets orders" }, { status: 500 });
  }
}

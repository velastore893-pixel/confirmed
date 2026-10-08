import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, stores } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST() {
  try {
    const auth = await requireRole("client");
    if (!auth.clientId) return NextResponse.json({ error: "No client profile" }, { status: 404 });

    // Check that at least one store exists
    const clientStores = await db.select().from(stores).where(eq(stores.clientId, auth.clientId));
    if (clientStores.length === 0) {
      return NextResponse.json({ error: "Please connect at least one store first" }, { status: 400 });
    }

    // Mark onboarding as complete
    await db.update(clients).set({
      onboardingComplete: true,
      onboardingStep: 3,
      updatedAt: new Date(),
    }).where(eq(clients.id, auth.clientId));

    return NextResponse.json({
      success: true,
      message: "Onboarding complete. Your store is pending admin review.",
      stores: clientStores.map(s => ({ id: s.id, name: s.name, status: s.status })),
    });
  } catch (err) {
    console.error("Onboarding complete error:", err);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
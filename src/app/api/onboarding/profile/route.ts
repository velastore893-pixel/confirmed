import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await requireRole("client");
    if (!auth.clientId) return NextResponse.json({ error: "No client profile" }, { status: 404 });
    const [client] = await db.select().from(clients).where(eq(clients.id, auth.clientId)).limit(1);
    return NextResponse.json({ client });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole("client");
    if (!auth.clientId) return NextResponse.json({ error: "No client profile" }, { status: 404 });
    const body = await req.json();
    const { companyName, city, region, address, phone, taxId, website } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (companyName !== undefined) updateData.companyName = companyName;
    if (city !== undefined) updateData.city = city;
    if (region !== undefined) updateData.region = region;
    if (address !== undefined) updateData.address = address;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (website !== undefined) updateData.website = website;

    // Move to step 1 complete
    updateData.onboardingStep = Math.max(1, 1);

    await db.update(clients).set(updateData).where(eq(clients.id, auth.clientId));

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
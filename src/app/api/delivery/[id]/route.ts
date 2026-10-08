import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryCompanies, deliveryCredentials, integrationLogs } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { encryptSecret } from "@/lib/secrets";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin", "employee");
    const { id } = await params;
    const [company] = await db.select().from(deliveryCompanies).where(eq(deliveryCompanies.id, id)).limit(1);
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const creds = await db.select({ id: deliveryCredentials.id, key: deliveryCredentials.key, isEncrypted: deliveryCredentials.isEncrypted }).from(deliveryCredentials).where(eq(deliveryCredentials.deliveryCompanyId, id));
    const logs = await db.select().from(integrationLogs).where(eq(integrationLogs.deliveryCompanyId, id)).orderBy(desc(integrationLogs.createdAt)).limit(50);
    return NextResponse.json({ company, credentials: creds, logs });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await params;
    const body = await req.json();
    const { name, hasApi, apiBaseUrl, codAvailable, isActive, cities, regions, credentials, config } = body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (hasApi !== undefined) updateData.hasApi = hasApi;
    if (apiBaseUrl !== undefined) updateData.apiBaseUrl = apiBaseUrl;
    if (codAvailable !== undefined) updateData.codAvailable = codAvailable;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (cities !== undefined) updateData.cities = cities;
    if (regions !== undefined) updateData.regions = regions;
    if (config !== undefined) updateData.config = config;
    await db.update(deliveryCompanies).set(updateData).where(eq(deliveryCompanies.id, id));
    if (credentials && Array.isArray(credentials)) {
      await db.delete(deliveryCredentials).where(eq(deliveryCredentials.deliveryCompanyId, id));
      for (const cred of credentials) {
        await db.insert(deliveryCredentials).values({ deliveryCompanyId: id, key: cred.key, value: encryptSecret(String(cred.value || "")), isEncrypted: true });
      }
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryCompanies, deliveryCredentials } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { encryptSecret } from "@/lib/secrets";

export async function GET() {
  try {
    const auth = await requireAuth();
    const companies = await db.select().from(deliveryCompanies).orderBy(desc(deliveryCompanies.createdAt));
    return NextResponse.json({ items: companies });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
    const body = await req.json();
    const { name, slug, hasApi, apiBaseUrl, codAvailable, cities, regions, credentials, config } = body;

    if (!name || !slug) return NextResponse.json({ error: "Name and slug required" }, { status: 400 });

    const [company] = await db.insert(deliveryCompanies).values({
      name, slug, hasApi: hasApi || false, apiBaseUrl, codAvailable: codAvailable !== false,
      cities: cities || [], regions: regions || [], config: config || {},
    }).returning();

    if (credentials && Array.isArray(credentials)) {
      for (const cred of credentials) {
        await db.insert(deliveryCredentials).values({
          deliveryCompanyId: company.id, key: cred.key, value: encryptSecret(String(cred.value || "")), isEncrypted: true,
        });
      }
    }

    return NextResponse.json({ company }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
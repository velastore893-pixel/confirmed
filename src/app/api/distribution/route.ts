import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { distributionRules, employees, users, stores } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  try {
    await requireRole("admin");
    const rules = await db.select({
      id: distributionRules.id, employeeId: distributionRules.employeeId,
      storeId: distributionRules.storeId, city: distributionRules.city,
      region: distributionRules.region, percentage: distributionRules.percentage,
      priority: distributionRules.priority, isActive: distributionRules.isActive,
      createdAt: distributionRules.createdAt,
      employeeFirstName: users.firstName, employeeLastName: users.lastName,
      storeName: stores.name,
    }).from(distributionRules)
      .leftJoin(employees, eq(distributionRules.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(stores, eq(distributionRules.storeId, stores.id))
      .orderBy(distributionRules.priority, desc(distributionRules.createdAt));
    return NextResponse.json({ items: rules });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
    const body = await req.json();
    const { employeeId, storeId, city, region, percentage, priority, isActive } = body;
    if (!employeeId || !percentage) return NextResponse.json({ error: "Employee and percentage required" }, { status: 400 });
    const [rule] = await db.insert(distributionRules).values({
      employeeId, storeId, city, region, percentage, priority: priority || 0, isActive: isActive !== false,
    }).returning();
    return NextResponse.json({ rule }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
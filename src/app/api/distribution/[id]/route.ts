import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { distributionRules } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.employeeId !== undefined) updateData.employeeId = body.employeeId;
    if (body.storeId !== undefined) updateData.storeId = body.storeId;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.region !== undefined) updateData.region = body.region;
    if (body.percentage !== undefined) updateData.percentage = body.percentage;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    await db.update(distributionRules).set(updateData).where(eq(distributionRules.id, id));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await params;
    await db.delete(distributionRules).where(eq(distributionRules.id, id));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stores, clients, employees, users, ecommercePlatforms, deliveryCompanies, notifications, activityLogs } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth";
import { eq, and, ilike, desc, count, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let baseQuery = db.select({
      id: stores.id, name: stores.name, status: stores.status, url: stores.url,
      clientId: stores.clientId, assignedEmployeeId: stores.assignedEmployeeId,
      platformId: stores.platformId, deliveryCompanyId: stores.deliveryCompanyId,
      pricePerOrder: stores.pricePerOrder, commissionPerOrder: stores.commissionPerOrder,
      createdAt: stores.createdAt, updatedAt: stores.updatedAt,
      clientName: clients.companyName, clientFirstName: users.firstName, clientLastName: users.lastName,
      employeeFirstName: employees.userId,
      platformName: ecommercePlatforms.name, platformSlug: ecommercePlatforms.slug,
      deliveryName: deliveryCompanies.name,
    }).from(stores)
      .leftJoin(clients, eq(stores.clientId, clients.id))
      .leftJoin(users, eq(clients.userId, users.id))
      .leftJoin(employees, eq(stores.assignedEmployeeId, employees.id))
      .leftJoin(ecommercePlatforms, eq(stores.platformId, ecommercePlatforms.id))
      .leftJoin(deliveryCompanies, eq(stores.deliveryCompanyId, deliveryCompanies.id))
      .$dynamic();

    const conditions = [];
    if (auth.role === "client" && auth.clientId) {
      conditions.push(eq(stores.clientId, auth.clientId));
    }
    if (status) conditions.push(eq(stores.status, status as "pending" | "active" | "suspended"));
    if (search) conditions.push(ilike(stores.name, `%${search}%`));
    if (conditions.length) baseQuery = baseQuery.where(and(...conditions));

    const countQ = db.select({ total: count() }).from(stores).where(conditions.length ? and(...conditions) : undefined);
    const [{ total }] = await countQ;
    const items = await baseQuery.orderBy(desc(stores.createdAt)).limit(limit).offset(offset);

    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Stores GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();
    const { name, platformId, deliveryCompanyId, url, clientId } = body;

    if (!name) return NextResponse.json({ error: "Store name required" }, { status: 400 });

    let storeClientId = clientId;
    if (auth.role === "client" && auth.clientId) {
      storeClientId = auth.clientId;
    }
    if (!storeClientId) return NextResponse.json({ error: "Client required" }, { status: 400 });

    const [store] = await db.insert(stores).values({
      name, platformId, deliveryCompanyId, url,
      clientId: storeClientId, status: "pending",
    }).returning();

    // Notify admin
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    for (const a of admins) {
      await db.insert(notifications).values({
        userId: a.id, type: "store_pending", title: "New store pending activation",
        body: `${name} requires activation`, relatedType: "store", relatedId: store.id,
      });
    }

    await db.insert(activityLogs).values({
      userId: auth.id, action: "store.created", entityType: "store", entityId: store.id,
      newValue: { name, status: "pending" },
    });

    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Stores POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
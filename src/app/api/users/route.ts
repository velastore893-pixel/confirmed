import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, employees, clients } from "@/db/schema";
import { requireRole, hashPassword } from "@/lib/auth";
import { eq, and, ilike, or, desc, count, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = db.select({
      id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName,
      phone: users.phone, role: users.role, isActive: users.isActive, locale: users.locale,
      lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
    }).from(users).$dynamic();

    const conditions = [];
    if (role) conditions.push(eq(users.role, role as "admin" | "employee" | "client"));
    if (status === "active") conditions.push(eq(users.isActive, true));
    if (status === "suspended") conditions.push(eq(users.isActive, false));
    if (search) {
      conditions.push(or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`),
      ));
    }
    if (conditions.length) query = query.where(and(...conditions));

    const [{ total }] = await db.select({ total: count() }).from(users).where(conditions.length ? and(...conditions) : undefined);
    const items = await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);

    // Attach employee/client profile data
    const enriched = await Promise.all(items.map(async (u) => {
      const base = { ...u };
      if (u.role === "employee") {
        const [emp] = await db.select().from(employees).where(eq(employees.userId, u.id)).limit(1);
        return { ...base, employeeId: emp?.id, commissionPerOrder: emp?.commissionPerOrder, maxDailyOrders: emp?.maxDailyOrders };
      }
      if (u.role === "client") {
        const [c] = await db.select().from(clients).where(eq(clients.userId, u.id)).limit(1);
        return { ...base, clientId: c?.id, companyName: c?.companyName, city: c?.city };
      }
      return base;
    }));

    return NextResponse.json({ items: enriched, total, page, limit });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((err as Error).message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Users GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
    const body = await req.json();
    const { email, password, firstName, lastName, phone, role, locale, commissionPerOrder, maxDailyOrders, companyName, city, region, defaultPricePerOrder, address } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase().trim(), passwordHash, firstName, lastName,
      phone, role, locale: locale || "ar",
    }).returning();

    if (role === "employee") {
      await db.insert(employees).values({
        userId: user.id, commissionPerOrder: commissionPerOrder || "3.00", maxDailyOrders: maxDailyOrders || null,
      });
    }
    if (role === "client") {
      await db.insert(clients).values({
        userId: user.id, companyName, city, region, defaultPricePerOrder: defaultPricePerOrder || "10.00", address,
      });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((err as Error).message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Users POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
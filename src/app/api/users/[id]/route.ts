import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, employees, clients } from "@/db/schema";
import {
  requireRole,
  hashPassword,
  destroyAllUserSessions,
} from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");

    const { id } = await params;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    let profile: Record<string, unknown> = {};

    if (user.role === "employee") {
      const [emp] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, user.id))
        .limit(1);

      profile = { employee: emp };
    }

    if (user.role === "client") {
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, user.id))
        .limit(1);

      profile = { client };
    }

    return NextResponse.json({
      user: {
        ...user,
        passwordHash: undefined,
        ...profile,
      },
    });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");

    const { id } = await params;
    const body = await req.json();

    const {
      firstName,
      lastName,
      phone,
      locale,
      isActive,
      approvalStatus,
      password,
      commissionPerOrder,
      maxDailyOrders,
      companyName,
      city,
      region,
      defaultPricePerOrder,
      address,
    } = body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) {
      updateData.firstName = firstName;
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (locale !== undefined) {
      updateData.locale = locale;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (approvalStatus !== undefined) {
      if (
        !["pending", "approved", "rejected"].includes(
          approvalStatus
        )
      ) {
        return NextResponse.json(
          { error: "Invalid approval status" },
          { status: 400 }
        );
      }

      updateData.approvalStatus = approvalStatus;
    }

    if (password) {
      updateData.passwordHash =
        await hashPassword(password);
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));

    if (
      isActive === false ||
      approvalStatus === "rejected" ||
      approvalStatus === "pending"
    ) {
      await destroyAllUserSessions(id);
    }

    if (
      user.role === "employee" &&
      (
        commissionPerOrder !== undefined ||
        maxDailyOrders !== undefined
      )
    ) {
      const empUpdate: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (commissionPerOrder !== undefined) {
        empUpdate.commissionPerOrder =
          commissionPerOrder;
      }

      if (maxDailyOrders !== undefined) {
        empUpdate.maxDailyOrders =
          maxDailyOrders;
      }

      await db
        .update(employees)
        .set(empUpdate)
        .where(eq(employees.userId, id));
    }

    if (user.role === "client") {
      const clientUpdate: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (companyName !== undefined) {
        clientUpdate.companyName = companyName;
      }

      if (city !== undefined) {
        clientUpdate.city = city;
      }

      if (region !== undefined) {
        clientUpdate.region = region;
      }

      if (defaultPricePerOrder !== undefined) {
        clientUpdate.defaultPricePerOrder =
          defaultPricePerOrder;
      }

      if (address !== undefined) {
        clientUpdate.address = address;
      }

      await db
        .update(clients)
        .set(clientUpdate)
        .where(eq(clients.userId, id));
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("Update user error:", err);

    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
}

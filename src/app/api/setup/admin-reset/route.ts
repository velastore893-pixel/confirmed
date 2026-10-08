import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { validatePassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.SETUP_SECRET;

    if (!configuredSecret || configuredSecret.length < 24) {
      return NextResponse.json(
        { error: "SETUP_SECRET is not configured securely." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { setupSecret, email, newPassword } = body ?? {};

    if (!setupSecret || setupSecret !== configuredSecret) {
      return NextResponse.json(
        { error: "Invalid setup secret." },
        { status: 401 }
      );
    }

    const cleanEmail = String(
      email || "admin@codflow.ma"
    ).toLowerCase().trim();

    const passwordCheck = validatePassword(String(newPassword || ""));

    if (!passwordCheck.valid) {
      return NextResponse.json(
        {
          error:
            passwordCheck.error ||
            "Invalid password."
        },
        { status: 400 }
      );
    }

    const [admin] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, cleanEmail),
          eq(users.role, "admin")
        )
      )
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, admin.id));

    return NextResponse.json({
      success: true,
      message: "Admin password updated successfully.",
    });
  } catch (error) {
    console.error("Admin reset error:", error);

    return NextResponse.json(
      { error: "Password reset failed." },
      { status: 500 }
    );
  }
}

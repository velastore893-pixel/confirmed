import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { validatePassword } from "@/lib/password";

const COMMON_PASSWORDS = [
  "password",
  "12345678",
  "qwerty123",
  "abc12345",
  "password1",
  "admin123",
  "letmein123",
  "welcome1",
  "123456789",
  "1234567890",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      companyName,
    } = body;

    // Required fields
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return NextResponse.json(
        {
          error: "All required fields must be filled",
        },
        { status: 400 }
      );
    }

    // Normalize + validate email
    const cleanEmail = email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address",
        },
        { status: 400 }
      );
    }

    // Validate password
    const pwCheck = validatePassword(password);

    if (!pwCheck.valid) {
      return NextResponse.json(
        {
          error: pwCheck.error,
        },
        { status: 400 }
      );
    }

    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
      return NextResponse.json(
        {
          error:
            "This password is too common. Please choose a stronger one.",
        },
        { status: 400 }
      );
    }

    // Email must be unique
    const [existing] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        {
          error: "This email is already registered.",
        },
        { status: 409 }
      );
    }

    // Create CLIENT account as PENDING
    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email: cleanEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,

        role: "client",

        locale: "ar",

        // IMPORTANT:
        // New clients require Admin approval.
        isActive: false,
      })
      .returning();

    // Create client profile
    await db.insert(clients).values({
      userId: user.id,

      companyName:
        companyName?.trim() ||
        `${firstName.trim()} ${lastName.trim()}`,

      defaultPricePerOrder: "10.00",
    });

    return NextResponse.json(
      {
        success: true,
        pendingApproval: true,
        message:
          "Account created successfully and is waiting for administrator approval.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);

    return NextResponse.json(
      {
        error: "Registration failed. Please try again later.",
      },
      { status: 500 }
    );
  }
}

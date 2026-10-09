import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-codflow-secret");

    if (!secret || secret !== process.env.GOOGLE_SHEETS_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      orderId,
      name,
      phone,
      city,
      address,
      product,
      quantity,
      price,
    } = body;

    if (!orderId || !name || !phone || !product) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    console.log("GOOGLE SHEETS ORDER RECEIVED:", {
      orderId,
      name,
      phone,
      city,
      address,
      product,
      quantity,
      price,
    });

    return NextResponse.json({
      success: true,
      message: "Order received successfully",
    });
  } catch (error) {
    console.error("Google Sheets order error:", error);

    return NextResponse.json(
      {
        error: "Invalid request",
      },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  extractSpreadsheetId,
  getSpreadsheetMetadata,
  GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
} from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const sheetUrl =
      typeof body?.sheetUrl === "string" ? body.sheetUrl.trim() : "";

    if (!sheetUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Sheet URL is required.",
        },
        { status: 400 }
      );
    }

    let spreadsheetId = "";

    try {
      spreadsheetId = extractSpreadsheetId(sheetUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Google Sheets URL.",
        },
        { status: 400 }
      );
    }

    const metadata = await getSpreadsheetMetadata(spreadsheetId);

    const sheets =
      metadata.sheets
        ?.map((sheet) => ({
          id: sheet.properties?.sheetId,
          title: sheet.properties?.title || "",
          index: sheet.properties?.index ?? 0,
        }))
        .filter((sheet) => sheet.title) || [];

    if (sheets.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No worksheet tabs were found.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetTitle: metadata.properties?.title || "",
      sheets,
      defaultSheet: sheets[0]?.title || "",
      serviceAccountEmail: GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      message: "Google Sheet connected successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not connect to Google Sheets.";

    console.error("[GOOGLE_SHEETS_CONNECT]", message);

    return NextResponse.json(
      {
        success: false,
        error: message.includes("403")
          ? "CODFlow does not have access to this Google Sheet."
          : message,
      },
      { status: 500 }
    );
  }
}

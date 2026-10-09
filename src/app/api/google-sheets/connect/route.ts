import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import {
  extractSpreadsheetId,
  extractGid,
  getSpreadsheetMetadata,
  readGoogleSheet,
  GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
} from "@/lib/google-sheets";

export const runtime = "nodejs";

type PlatformConfig = Record<string, unknown> & {
  googleSheets?: {
    spreadsheetId?: string;
    spreadsheetTitle?: string;
    sheetName?: string;
    sheetGid?: number | null;
    sheetUrl?: string;
    connectedAt?: string;
    lastCheckedAt?: string;
  };
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const EXPECTED_HEADERS = [
  "order id",
  "name",
  "phone",
  "city",
  "address",
  "product",
  "quantity",
  "price",
];

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const storeId =
      typeof body?.storeId === "string" ? body.storeId.trim() : "";

    const sheetUrl =
      typeof body?.sheetUrl === "string" ? body.sheetUrl.trim() : "";

    const requestedSheetName =
      typeof body?.sheetName === "string" ? body.sheetName.trim() : "";

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store is required." },
        { status: 400 }
      );
    }

    if (!sheetUrl) {
      return NextResponse.json(
        { success: false, error: "Google Sheet URL is required." },
        { status: 400 }
      );
    }

    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found." },
        { status: 404 }
      );
    }

    const isAdmin = auth.role === "admin";
    const isOwnerClient =
      auth.role === "client" &&
      !!auth.clientId &&
      auth.clientId === store.clientId;

    if (!isAdmin && !isOwnerClient) {
      return NextResponse.json(
        { success: false, error: "Forbidden." },
        { status: 403 }
      );
    }

    let spreadsheetId = "";

    try {
      spreadsheetId = extractSpreadsheetId(sheetUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid Google Sheets URL." },
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
        { success: false, error: "No worksheet tabs were found." },
        { status: 400 }
      );
    }

    const gid = extractGid(sheetUrl);
    const gidNumber = gid ? Number(gid) : null;

    let selectedSheet =
      requestedSheetName &&
      sheets.find((sheet) => sheet.title === requestedSheetName);

    if (!selectedSheet && gidNumber !== null && Number.isFinite(gidNumber)) {
      selectedSheet = sheets.find((sheet) => sheet.id === gidNumber);
    }

    if (!selectedSheet) {
      selectedSheet = sheets[0];
    }

    const sample = await readGoogleSheet(
      spreadsheetId,
      selectedSheet.title,
      "A1:H5"
    );

    const headers = Array.isArray(sample.values?.[0])
      ? sample.values[0].map((value) => String(value ?? "").trim())
      : [];

    const normalizedHeaders = headers.map(normalizeHeader);

    const missingHeaders = EXPECTED_HEADERS.filter(
      (expected) => !normalizedHeaders.includes(expected)
    );

    const existingConfig =
      store.platformConfig &&
      typeof store.platformConfig === "object" &&
      !Array.isArray(store.platformConfig)
        ? (store.platformConfig as PlatformConfig)
        : {};

    const now = new Date();

    const nextPlatformConfig: PlatformConfig = {
      ...existingConfig,
      googleSheets: {
        spreadsheetId,
        spreadsheetTitle: metadata.properties?.title || "",
        sheetName: selectedSheet.title,
        sheetGid: selectedSheet.id ?? null,
        sheetUrl,
        connectedAt:
          existingConfig.googleSheets?.connectedAt || now.toISOString(),
        lastCheckedAt: now.toISOString(),
      },
    };

    await db
      .update(stores)
      .set({
        platformConfig: nextPlatformConfig,
        connectionStatus: "connected",
        lastConnectionTestAt: now,
        updatedAt: now,
      })
      .where(eq(stores.id, storeId));

    return NextResponse.json({
      success: true,
      storeId,
      spreadsheetId,
      spreadsheetTitle: metadata.properties?.title || "",
      sheets,
      defaultSheet: selectedSheet.title,
      selectedSheet: selectedSheet.title,
      serviceAccountEmail: GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      headers,
      missingHeaders,
      configurationValid: missingHeaders.length === 0,
      message:
        missingHeaders.length === 0
          ? "Google Sheet connected and saved successfully."
          : "Google Sheet connected and saved, but some expected columns are missing.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not connect to Google Sheets.";

    console.error("[GOOGLE_SHEETS_CONNECT]", message);

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          message ||
          "Could not connect to Google Sheets. Make sure the sheet is shared with CODFlow as Viewer.",
      },
      { status: 500 }
    );
  }
}


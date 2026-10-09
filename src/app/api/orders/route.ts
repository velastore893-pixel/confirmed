import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  stores,
  orders,
  customers,
  orderItems,
  orderStatusHistory,
  employees,
  notifications,
  activityLogs,
} from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";
import { chooseEmployeeForOrder } from "@/lib/distribution-engine";
import { readGoogleSheet } from "@/lib/google-sheets";

export const runtime = "nodejs";

type GoogleSheetsConfig = {
  googleSheets?: {
    spreadsheetId?: string;
    spreadsheetTitle?: string;
    sheetName?: string;
    sheetGid?: number | null;
    sheetUrl?: string;
    connectedAt?: string;
    lastCheckedAt?: string;
    lastSyncAt?: string;
  };
};

type ParsedRow = {
  externalOrderId: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  product: string;
  quantity: number;
  price: string;
  rowNumber: number;
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cell(value: unknown) {
  return String(value ?? "").trim();
}

function parseQuantity(value: unknown) {
  const parsed = Number.parseInt(cell(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parsePrice(value: unknown) {
  const normalized = cell(value)
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : "0.00";
}

function getHeaderIndexes(headers: unknown[]) {
  const normalized = headers.map(normalizeHeader);

  const indexOf = (name: string) => normalized.indexOf(name);

  return {
    orderId: indexOf("order id"),
    name: indexOf("name"),
    phone: indexOf("phone"),
    city: indexOf("city"),
    address: indexOf("address"),
    product: indexOf("product"),
    quantity: indexOf("quantity"),
    price: indexOf("price"),
  };
}

function headersAreValid(indexes: ReturnType<typeof getHeaderIndexes>) {
  return Object.values(indexes).every((index) => index >= 0);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json().catch(() => ({}));

    const storeId =
      typeof body?.storeId === "string" ? body.storeId.trim() : "";

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store is required." },
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

    if (store.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Store must be active before Google Sheets orders can be imported.",
        },
        { status: 409 }
      );
    }

    const platformConfig =
      store.platformConfig &&
      typeof store.platformConfig === "object" &&
      !Array.isArray(store.platformConfig)
        ? (store.platformConfig as GoogleSheetsConfig)
        : {};

    const googleSheets = platformConfig.googleSheets;

    if (!googleSheets?.spreadsheetId || !googleSheets?.sheetName) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Sheets is not connected to this store.",
        },
        { status: 400 }
      );
    }

    const sheet = await readGoogleSheet(
      googleSheets.spreadsheetId,
      googleSheets.sheetName,
      "A:H"
    );

    const values = Array.isArray(sheet.values) ? sheet.values : [];

    if (values.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: 0,
        duplicates: 0,
        invalid: 0,
        message: "The Google Sheet is empty.",
      });
    }

    const headers = Array.isArray(values[0]) ? values[0] : [];
    const indexes = getHeaderIndexes(headers);

    if (!headersAreValid(indexes)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google Sheet columns must be: Order ID, Name, Phone, City, Address, Product, Quantity, Price",
        },
        { status: 400 }
      );
    }

    const parsedRows: ParsedRow[] = [];

    for (let i = 1; i < values.length; i++) {
      const row = Array.isArray(values[i]) ? values[i] : [];

      const externalOrderId = cell(row[indexes.orderId]);
      const name = cell(row[indexes.name]);
      const phone = cell(row[indexes.phone]);
      const city = cell(row[indexes.city]);
      const address = cell(row[indexes.address]);
      const product = cell(row[indexes.product]);
      const quantity = parseQuantity(row[indexes.quantity]);
      const price = parsePrice(row[indexes.price]);

      if (
        !externalOrderId &&
        !name &&
        !phone &&
        !city &&
        !address &&
        !product
      ) {
        continue;
      }

      parsedRows.push({
        externalOrderId,
        name,
        phone,
        city,
        address,
        product,
        quantity,
        price,
        rowNumber: i + 1,
      });
    }

    let imported = 0;
    let duplicates = 0;
    let invalid = 0;

    const errors: Array<{
      row: number;
      orderId?: string;
      error: string;
    }> = [];

    for (const row of parsedRows) {
      if (
        !row.externalOrderId ||
        !row.name ||
        !row.phone ||
        !row.product
      ) {
        invalid++;
        errors.push({
          row: row.rowNumber,
          orderId: row.externalOrderId || undefined,
          error: "Missing Order ID, Name, Phone or Product.",
        });
        continue;
      }

      const [existingOrder] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.storeId, store.id),
            eq(orders.externalOrderId, row.externalOrderId)
          )
        )
        .limit(1);

      if (existingOrder) {
        duplicates++;
        continue;
      }

      try {
        let customerId: string | null = null;

        const [existingCustomer] = await db
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.clientId, store.clientId),
              eq(customers.phone, row.phone)
            )
          )
          .limit(1);

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const [createdCustomer] = await db
            .insert(customers)
            .values({
              clientId: store.clientId,
              name: row.name,
              phone: row.phone,
              city: row.city || null,
              address: row.address || null,
            })
            .returning();

          customerId = createdCustomer.id;
        }

        const distributedEmployeeId = await chooseEmployeeForOrder({
          storeId: store.id,
          city: row.city || undefined,
          region: undefined,
        });

        const finalEmployeeId =
          distributedEmployeeId || store.assignedEmployeeId || null;

        const amount = (
          Number.parseFloat(row.price) * row.quantity
        ).toFixed(2);

        const orderNumber = generateOrderNumber();

        const [order] = await db
          .insert(orders)
          .values({
            orderNumber,
            clientId: store.clientId,
            storeId: store.id,
            customerId,
            assignedEmployeeId: finalEmployeeId,
            deliveryCompanyId: store.deliveryCompanyId,
            status: finalEmployeeId ? "assigned" : "new",
            amount,
            codAmount: amount,
            customerName: row.name,
            customerPhone: row.phone,
            customerCity: row.city || null,
            customerAddress: row.address || null,
            externalOrderId: row.externalOrderId,
            priceAtOrder: store.pricePerOrder || "10.00",
            commissionAtOrder: store.commissionPerOrder || "3.00",
            notes: `Imported from Google Sheets row ${row.rowNumber}`,
          })
          .returning();

        await db.insert(orderItems).values({
          orderId: order.id,
          productName: row.product,
          quantity: row.quantity,
          unitPrice: row.price,
          totalPrice: amount,
        });

        await db.insert(orderStatusHistory).values({
          orderId: order.id,
          newStatus: "new",
          changedByUserId: auth.id,
        });

        if (finalEmployeeId) {
          await db.insert(orderStatusHistory).values({
            orderId: order.id,
            newStatus: "assigned",
            previousStatus: "new",
            changedByUserId: auth.id,
          });

          const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, finalEmployeeId))
            .limit(1);

          if (employee) {
            await db.insert(notifications).values({
              userId: employee.userId,
              type: "order_assigned",
              title: "New order assigned",
              body: `Order ${orderNumber} assigned to you`,
              relatedType: "order",
              relatedId: order.id,
            });
          }
        }

        await db.insert(activityLogs).values({
          userId: auth.id,
          action: "order.imported.google_sheets",
          entityType: "order",
          entityId: order.id,
          newValue: {
            orderNumber,
            externalOrderId: row.externalOrderId,
            storeId: store.id,
            source: "google_sheets",
            sheetName: googleSheets.sheetName,
            rowNumber: row.rowNumber,
            amount,
            customerName: row.name,
          },
        });

        imported++;
      } catch (rowError) {
        const message =
          rowError instanceof Error
            ? rowError.message
            : "Could not import this row.";

        if (
          message.toLowerCase().includes("unique") ||
          message.toLowerCase().includes("duplicate")
        ) {
          duplicates++;
          continue;
        }

        invalid++;
        errors.push({
          row: row.rowNumber,
          orderId: row.externalOrderId,
          error: message,
        });
      }
    }

    const now = new Date();

    await db
      .update(stores)
      .set({
        platformConfig: {
          ...platformConfig,
          googleSheets: {
            ...googleSheets,
            lastCheckedAt: now.toISOString(),
            lastSyncAt: now.toISOString(),
          },
        },
        lastConnectionTestAt: now,
        updatedAt: now,
      })
      .where(eq(stores.id, store.id));

    return NextResponse.json({
      success: true,
      storeId: store.id,
      sheetName: googleSheets.sheetName,
      totalRows: parsedRows.length,
      imported,
      duplicates,
      invalid,
      skipped: duplicates + invalid,
      errors: errors.slice(0, 20),
      message:
        imported > 0
          ? `${imported} order(s) imported successfully.`
          : "No new orders to import.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Sheets sync failed.";

    console.error("[GOOGLE_SHEETS_SYNC]", error);

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Google Sheets sync failed.",
      },
      { status: 500 }
    );
  }
}

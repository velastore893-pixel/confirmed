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
import { and, eq } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";
import { chooseEmployeeForOrder } from "@/lib/distribution-engine";
import { readGoogleSheet } from "@/lib/google-sheets";

export const runtime = "nodejs";

type GoogleSheetsConfig = {
  spreadsheetId?: string;
  spreadsheetTitle?: string;
  sheetName?: string;
  sheetGid?: number | null;
  sheetUrl?: string;
  connectedAt?: string;
  lastCheckedAt?: string;
  lastSyncAt?: string;
};

type PlatformConfig = Record<string, unknown> & {
  googleSheets?: GoogleSheetsConfig;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeHeader(value: unknown) {
  return clean(value).toLowerCase().replace(/\s+/g, " ");
}

function parseQuantity(value: unknown) {
  const parsed = Number.parseInt(clean(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseMoney(value: unknown) {
  const raw = clean(value).replace(",", ".");
  const parsed = Number.parseFloat(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return "0.00";
  }

  return parsed.toFixed(2);
}

const REQUIRED_HEADERS = [
  "order id",
  "name",
  "phone",
  "city",
  "address",
  "product",
  "quantity",
  "price",
] as const;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const storeId =
      typeof body?.storeId === "string" ? body.storeId.trim() : "";

    if (!storeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Store is required.",
        },
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
        {
          success: false,
          error: "Store not found.",
        },
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
        {
          success: false,
          error: "Forbidden.",
        },
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
        { status: 400 }
      );
    }

    const platformConfig =
      store.platformConfig &&
      typeof store.platformConfig === "object" &&
      !Array.isArray(store.platformConfig)
        ? (store.platformConfig as PlatformConfig)
        : {};

    const googleSheets = platformConfig.googleSheets;

    if (!googleSheets?.spreadsheetId || !googleSheets?.sheetName) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Sheets is not connected to this store yet.",
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
        errors: 0,
        message: "The Google Sheet is empty.",
      });
    }

    const headers = (values[0] || []).map(normalizeHeader);

    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !headers.includes(header)
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Sheet columns are incomplete.",
          missingHeaders,
        },
        { status: 400 }
      );
    }

    const indexOf = (name: string) => headers.indexOf(name);

    const indexes = {
      orderId: indexOf("order id"),
      name: indexOf("name"),
      phone: indexOf("phone"),
      city: indexOf("city"),
      address: indexOf("address"),
      product: indexOf("product"),
      quantity: indexOf("quantity"),
      price: indexOf("price"),
    };

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const rowErrors: Array<{
      row: number;
      orderId?: string;
      error: string;
    }> = [];

    for (let i = 1; i < values.length; i += 1) {
      const row = values[i] || [];
      const rowNumber = i + 1;

      const externalOrderId = clean(row[indexes.orderId]);
      const customerName = clean(row[indexes.name]);
      const customerPhone = clean(row[indexes.phone]);
      const customerCity = clean(row[indexes.city]);
      const customerAddress = clean(row[indexes.address]);
      const productName = clean(row[indexes.product]);
      const quantity = parseQuantity(row[indexes.quantity]);
      const amount = parseMoney(row[indexes.price]);

      const isCompletelyEmpty = row.every(
        (cell) => clean(cell) === ""
      );

      if (isCompletelyEmpty) {
        skipped += 1;
        continue;
      }

      if (
        !externalOrderId ||
        !customerName ||
        !customerPhone ||
        !productName
      ) {
        errors += 1;

        rowErrors.push({
          row: rowNumber,
          orderId: externalOrderId || undefined,
          error:
            "Order ID, Name, Phone and Product are required.",
        });

        continue;
      }

      try {
        const [existingOrder] = await db
          .select({
            id: orders.id,
          })
          .from(orders)
          .where(
            and(
              eq(orders.storeId, store.id),
              eq(orders.externalOrderId, externalOrderId)
            )
          )
          .limit(1);

        if (existingOrder) {
          skipped += 1;
          continue;
        }

        let customerId: string | null = null;

        const [existingCustomer] = await db
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.clientId, store.clientId),
              eq(customers.phone, customerPhone)
            )
          )
          .limit(1);

        if (existingCustomer) {
          customerId = existingCustomer.id;

          await db
            .update(customers)
            .set({
              name: customerName,
              city: customerCity || existingCustomer.city,
              address:
                customerAddress || existingCustomer.address,
            })
            .where(eq(customers.id, existingCustomer.id));
        } else {
          const [createdCustomer] = await db
            .insert(customers)
            .values({
              clientId: store.clientId,
              name: customerName,
              phone: customerPhone,
              city: customerCity || null,
              address: customerAddress || null,
            })
            .returning();

          customerId = createdCustomer.id;
        }

        const distributedEmployeeId =
          await chooseEmployeeForOrder({
            storeId: store.id,
            city: customerCity,
            region: "",
          });

        const finalEmployeeId =
          distributedEmployeeId || store.assignedEmployeeId;

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

            status: finalEmployeeId
              ? "assigned"
              : "new",

            amount,
            codAmount: amount,
            currency: "MAD",

            customerName,
            customerPhone,

            customerCity:
              customerCity || null,

            customerRegion: null,

            customerAddress:
              customerAddress || null,

            externalOrderId,

            notes: "Imported from Google Sheets",

            priceAtOrder:
              store.pricePerOrder || "10.00",

            commissionAtOrder:
              store.commissionPerOrder || "3.00",
          })
          .returning();

        await db.insert(orderItems).values({
          orderId: order.id,
          productName,
          quantity,

          unitPrice:
            quantity > 0
              ? (Number(amount) / quantity).toFixed(2)
              : amount,

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
            .where(
              eq(
                employees.id,
                finalEmployeeId
              )
            )
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
            externalOrderId,
            amount,
            customerName,
            storeId: store.id,
          },
        });

        imported += 1;
      } catch (rowError) {
        errors += 1;

        const message =
          rowError instanceof Error
            ? rowError.message
            : "Unknown row error";

        if (
          message
            .toLowerCase()
            .includes("duplicate") ||
          message
            .toLowerCase()
            .includes("unique")
        ) {
          skipped += 1;
          errors -= 1;
          continue;
        }

        rowErrors.push({
          row: rowNumber,
          orderId: externalOrderId,
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
            lastSyncAt: now.toISOString(),
            lastCheckedAt: now.toISOString(),
          },
        },

        lastConnectionTestAt: now,
        updatedAt: now,
      })
      .where(eq(stores.id, store.id));

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
      rowErrors: rowErrors.slice(0, 20),

      message: `Imported ${imported} order(s), skipped ${skipped}, errors ${errors}.`,
    });
  } catch (err) {
    console.error("[GOOGLE_SHEETS_SYNC]", err);

    if ((err as Error).message === "Unauthorized") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Could not sync Google Sheets orders.",
      },
      { status: 500 }
    );
  }
}

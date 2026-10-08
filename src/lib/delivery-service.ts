import { db } from "@/db";
import { deliveryCompanies, orderItems, orders, stores } from "@/db/schema";
import { createSiftShipment } from "@/lib/integration-connectors";
import { eq } from "drizzle-orm";
import { getDeliveryProviderCatalogEntry } from "@/lib/delivery-provider-catalog";
import { decryptCredentials } from "@/lib/secrets";

export type DeliveryDispatchResult = {
  success: boolean;
  trackingNumber?: string;
  shipmentId?: string;
  provider?: string;
  error?: string;
  raw?: unknown;
};

export async function dispatchOrderToConfiguredDelivery(orderId: string): Promise<DeliveryDispatchResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { success: false, error: "Order not found" };

  const [store] = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
  if (!store?.deliveryCompanyId) return { success: false, error: "No delivery company configured for this store" };

  const [company] = await db.select().from(deliveryCompanies).where(eq(deliveryCompanies.id, store.deliveryCompanyId)).limit(1);
  if (!company) return { success: false, error: "Delivery company not found" };
  if (!company.hasApi) {
    const catalog = getDeliveryProviderCatalogEntry(company.slug);
    const pendingDocs = catalog?.integrationState === "needs_documentation";
    return {
      success: false,
      provider: company.slug,
      error: pendingDocs
        ? `${company.name} is available in CODFlow, but automatic shipment creation is disabled until its official API documentation is configured.`
        : "Selected delivery company is configured for manual mode",
    };
  }

  if (company.slug === "sift-livraison" || company.slug === "sift") {
    const creds = decryptCredentials(store.deliveryCredentials);
    const specialToken = creds.special_token || creds.token || creds.api_key || "";
    if (!specialToken) return { success: false, provider: company.slug, error: "SIFT Special-Token is missing" };

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const merchandise = items.length
      ? items.map((item) => `${item.productName}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(", ")
      : `Order ${order.orderNumber}`;
    const quantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1;
    const config = (company.config as Record<string, unknown>) || {};
    const deliveryConfig = (store.deliveryConfig as Record<string, unknown>) || {};
    const trackingNumber = order.trackingNumber || order.orderNumber;

    if (!order.customerName || !order.customerPhone || !order.customerAddress || !order.customerCity) {
      return { success: false, provider: company.slug, error: "Customer name, phone, address and city are required before sending to SIFT" };
    }

    const result = await createSiftShipment(specialToken, {
      codeSuivi: trackingNumber,
      destinataire: order.customerName,
      telephone: order.customerPhone,
      adresse: order.customerAddress,
      prix: Number(order.codAmount || order.amount || 0),
      ville: order.customerCity,
      marchandise: merchandise,
      qte: quantity,
      peutOuvrir: Boolean(deliveryConfig.peut_ouvrir ?? config.peutOuvrirDefault ?? true),
      change: Boolean(deliveryConfig.change ?? config.changeDefault ?? false),
    });

    return {
      success: result.success,
      provider: company.slug,
      trackingNumber: result.trackingNumber || trackingNumber,
      shipmentId: result.trackingNumber || trackingNumber,
      error: result.error,
      raw: result.data,
    };
  }

  return { success: false, provider: company.slug, error: `Automatic shipment creation is not implemented for ${company.name}` };
}

export type DeliveryProviderCatalogEntry = {
  name: string;
  slug: string;
  codAvailable: boolean;
  hasApi: boolean;
  apiBaseUrl?: string;
  integrationState: "ready" | "needs_documentation" | "manual";
  authType?: "bearer" | "api_key" | "basic" | "custom" | "none";
  authHeader?: string;
  authPrefix?: string;
  testPath?: string;
  testMethod?: string;
  createOrderPath?: string;
  notes?: string;
};

/**
 * Delivery-provider catalog for CODFlow.
 *
 * IMPORTANT:
 * - SIFT Livraison is the only provider below marked `ready` because its API
 *   contract was supplied and verified from the provider documentation.
 * - Other providers are intentionally NOT given guessed API endpoints or
 *   authentication formats. They remain selectable as manual / pending-
 *   integration providers until official documentation is supplied.
 */
export const DELIVERY_PROVIDER_CATALOG: DeliveryProviderCatalogEntry[] = [
  {
    name: "SIFT Livraison",
    slug: "sift-livraison",
    codAvailable: true,
    hasApi: true,
    apiBaseUrl: "https://app.siftlivraison.com",
    integrationState: "ready",
    authType: "custom",
    authHeader: "Special-Token",
    authPrefix: "",
    testPath: "/api/client/get/list-status",
    testMethod: "GET",
    createOrderPath: "/api/client/post/store-commande",
    notes: "Verified integration. Uses Special-Token and SIFT webhook status updates.",
  },
  { name: "Amana", slug: "amana", codAvailable: true, hasApi: false, integrationState: "needs_documentation", notes: "Keep manual until official API contract is configured." },
  { name: "Jibli", slug: "jibli", codAvailable: true, hasApi: false, integrationState: "needs_documentation", notes: "Keep manual until official API contract is configured." },
  { name: "Colis Privé", slug: "colis-prive", codAvailable: true, hasApi: false, integrationState: "needs_documentation", notes: "Keep manual until official API contract is configured." },
  { name: "Ozon Express", slug: "ozon-express", codAvailable: true, hasApi: false, integrationState: "needs_documentation", notes: "Keep manual until official API contract is configured." },
  { name: "Cathedis", slug: "cathedis", codAvailable: true, hasApi: false, integrationState: "needs_documentation", notes: "Keep manual until official API contract is configured." },
  { name: "Speedaf", slug: "speedaf", codAvailable: true, hasApi: false, integrationState: "needs_documentation", notes: "Keep manual until official API contract is configured." },
];

export function getDeliveryProviderCatalogEntry(slug?: string | null) {
  const normalized = String(slug || "").trim().toLowerCase();
  return DELIVERY_PROVIDER_CATALOG.find((provider) => provider.slug === normalized);
}

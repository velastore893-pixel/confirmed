export type ConnectionResult = {
  success: boolean;
  message?: string;
  error?: string;
  status?: number;
  endpoint?: string;
};

function cleanBaseUrl(value: string) {
  const trimmed = (value || "").trim();
  if (!/^https?:\/\//i.test(trimmed)) throw new Error("URL must start with http:// or https://");
  return trimmed.replace(/\/+$/, "");
}

function joinUrl(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}/${path.replace(/^\/+/, "")}`;
}


function extractGoogleSpreadsheetId(value: string) {
  const trimmed = (value || "").trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match?.[1]) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

async function testGoogleSheetsConnection(sheetUrl: string): Promise<ConnectionResult> {
  const spreadsheetId = extractGoogleSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    return { success: false, error: "Enter a valid Google Sheets URL" };
  }

  // Link-only connection: the sheet must be accessible without interactive Google login.
  const endpoint = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: { Accept: "text/csv,text/plain,*/*" },
    });

    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    if (!response.ok) {
      return { success: false, status: response.status, endpoint, error: `Google Sheets returned HTTP ${response.status}` };
    }
    if (/accounts\.google\.com|ServiceLogin|Sign in - Google Accounts/i.test(body) || contentType.includes("text/html")) {
      return {
        success: false,
        status: response.status,
        endpoint,
        error: "The sheet is private. Share it as 'Anyone with the link' or configure Google OAuth/service-account access.",
      };
    }

    return {
      success: true,
      status: response.status,
      endpoint,
      message: body.trim()
        ? "Google Sheet connected successfully and is readable from the server"
        : "Google Sheet is reachable, but it appears to be empty",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Google Sheets connection error";
    return { success: false, endpoint, error: message.includes("aborted") ? "Google Sheets connection timed out" : message };
  } finally {
    clearTimeout(timeout);
  }
}

async function probe(endpoint: string, init: RequestInit): Promise<ConnectionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json", ...(init.headers || {}) },
    });
    const body = await response.text();
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        endpoint,
        error: response.status === 401 || response.status === 403
          ? "Authentication was rejected by the provider"
          : `Provider returned HTTP ${response.status}${body ? `: ${body.slice(0, 180)}` : ""}`,
      };
    }
    return { success: true, status: response.status, endpoint, message: "Real provider request succeeded" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown connection error";
    return { success: false, endpoint, error: message.includes("aborted") ? "Connection timed out" : message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function testEcommerceConnection(
  platformSlug: string,
  storeUrl: string,
  credentials: Record<string, string>,
): Promise<ConnectionResult> {
  let base: string;
  try {
    base = cleanBaseUrl(credentials.api_base_url || credentials.store_url || storeUrl);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid store URL" };
  }

  if (platformSlug === "woocommerce") {
    if (!credentials.consumer_key || !credentials.consumer_secret) {
      return { success: false, error: "Consumer Key and Consumer Secret are required" };
    }
    const endpoint = joinUrl(base, credentials.test_path || "/wp-json/wc/v3/orders?per_page=1");
    const auth = Buffer.from(`${credentials.consumer_key}:${credentials.consumer_secret}`).toString("base64");
    return probe(endpoint, { method: "GET", headers: { Authorization: `Basic ${auth}` } });
  }

  if (platformSlug === "prestashop") {
    const webserviceKey = credentials.webservice_key || credentials.api_key;
    if (!webserviceKey) return { success: false, error: "PrestaShop Webservice Key is required" };
    const endpoint = joinUrl(base, "/api/?output_format=JSON");
    const auth = Buffer.from(`${webserviceKey}:`).toString("base64");
    return probe(endpoint, { method: "GET", headers: { Authorization: `Basic ${auth}` } });
  }

  if (platformSlug === "shopify") {
    if (!credentials.access_token) return { success: false, error: "Shopify Admin API access token is required" };
    const apiVersion = (credentials.api_version || process.env.SHOPIFY_API_VERSION || "").trim();
    if (!apiVersion) {
      return { success: false, error: "Shopify Admin API version is not configured. Set it in the connection form or SHOPIFY_API_VERSION." };
    }
    const endpoint = joinUrl(base, `/admin/api/${apiVersion}/shop.json`);
    return probe(endpoint, { method: "GET", headers: { "X-Shopify-Access-Token": credentials.access_token } });
  }


  if (platformSlug === "google_sheets") {
    return testGoogleSheetsConnection(storeUrl || credentials.sheet_url || "");
  }

  if (platformSlug === "youcan") {
    return {
      success: false,
      error: "YouCan manual API-key connection is disabled. Configure a YouCan App/Client authorization flow, then connect the store through that app instead of entering random credentials.",
    };
  }

  return { success: false, error: "This e-commerce platform does not have a configured connector" };
}



export type SiftShipmentInput = {
  codeSuivi: string;
  destinataire: string;
  telephone: string;
  adresse: string;
  prix: number;
  ville: string;
  marchandise: string;
  qte: number;
  peutOuvrir: boolean;
  change: boolean;
};

export type SiftShipmentResult = ConnectionResult & {
  trackingNumber?: string;
  data?: unknown;
};

const SIFT_BASE_URL = "https://app.siftlivraison.com";

function siftHeaders(specialToken: string): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Special-Token": specialToken,
  };
}

export async function testSiftConnection(specialToken: string): Promise<ConnectionResult> {
  if (!specialToken?.trim()) return { success: false, error: "SIFT Special-Token is required" };
  const endpoint = `${SIFT_BASE_URL}/api/client/get/list-status`;
  return probe(endpoint, { method: "GET", headers: siftHeaders(specialToken.trim()) });
}

export async function createSiftShipment(specialToken: string, input: SiftShipmentInput): Promise<SiftShipmentResult> {
  if (!specialToken?.trim()) return { success: false, error: "SIFT Special-Token is required" };
  const endpoint = `${SIFT_BASE_URL}/api/client/post/store-commande`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: siftHeaders(specialToken.trim()),
      body: JSON.stringify({
        code_suivi: input.codeSuivi,
        destinataire: input.destinataire,
        telephone: input.telephone,
        adresse: input.adresse,
        prix: input.prix,
        ville: input.ville,
        marchandise: input.marchandise,
        qte: input.qte,
        peut_ouvrir: input.peutOuvrir,
        change: input.change,
      }),
    });
    const textBody = await response.text();
    let data: unknown = textBody;
    try { data = textBody ? JSON.parse(textBody) : null; } catch {}
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        endpoint,
        error: `SIFT returned HTTP ${response.status}${textBody ? `: ${textBody.slice(0, 300)}` : ""}`,
        data,
      };
    }
    return {
      success: true,
      status: response.status,
      endpoint,
      trackingNumber: input.codeSuivi,
      message: "Order sent to SIFT Livraison successfully",
      data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SIFT connection error";
    return { success: false, endpoint, error: message.includes("aborted") ? "SIFT request timed out" : message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function testDeliveryProviderConnection(
  baseUrl: string,
  config: Record<string, unknown>,
  credentials: Record<string, string>,
  providerSlug?: string,
): Promise<ConnectionResult> {
  if ((providerSlug || "").toLowerCase() === "sift-livraison" || (providerSlug || "").toLowerCase() === "sift") {
    return testSiftConnection(credentials.special_token || credentials.token || credentials.api_key || "");
  }
  let base: string;
  try {
    base = cleanBaseUrl(credentials.api_base_url || baseUrl);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid delivery API URL" };
  }

  const testPath = String(credentials.test_path || config.testPath || "").trim();
  if (!testPath) {
    return { success: false, error: "No delivery API test endpoint configured. Admin must set API Base URL and Test Path for this company." };
  }

  const endpoint = joinUrl(base, testPath);
  const authType = String(config.authType || credentials.auth_type || "bearer");
  const headers: Record<string, string> = {};

  if (authType === "bearer") {
    const token = credentials.token || credentials.api_key || credentials.access_token;
    if (!token) return { success: false, error: "API token is required" };
    headers.Authorization = `Bearer ${token}`;
  } else if (authType === "api_key") {
    const key = credentials.api_key || credentials.token;
    if (!key) return { success: false, error: "API key is required" };
    headers[String(config.apiKeyHeader || "X-API-Key")] = key;
  } else if (authType === "basic") {
    if (!credentials.username || !credentials.password) return { success: false, error: "Username and password are required" };
    headers.Authorization = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}`;
  } else if (authType === "custom") {
    const token = credentials.token || credentials.api_key || credentials.access_token;
    const header = String(config.authHeader || credentials.auth_header || "Authorization");
    if (!token) return { success: false, error: "Credential/token is required" };
    const prefix = String(config.authPrefix || credentials.auth_prefix || "").trim();
    headers[header] = prefix ? `${prefix} ${token}` : token;
  }

  return probe(endpoint, { method: String(config.testMethod || "GET"), headers });
}

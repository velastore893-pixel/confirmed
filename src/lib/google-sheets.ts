import { createSign } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type SheetValuesResponse = {
  range?: string;
  majorDimension?: string;
  values?: unknown[][];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getGoogleCredentials() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const projectId = process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID;

  if (!clientEmail || !privateKeyRaw || !projectId) {
    throw new Error(
      "Google Service Account environment variables are not configured."
    );
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return {
    clientEmail,
    privateKey,
    projectId,
  };
}

function createServiceAccountJwt() {
  const { clientEmail, privateKey } = getGoogleCredentials();

  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(privateKey);

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

export async function getGoogleSheetsAccessToken() {
  const assertion = createServiceAccountJwt();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Could not authenticate with Google Sheets."
    );
  }

  return data.access_token;
}

export function extractSpreadsheetId(sheetUrl: string) {
  const value = sheetUrl.trim();

  const directIdMatch = value.match(/^[a-zA-Z0-9-_]{20,}$/);
  if (directIdMatch) return directIdMatch[0];

  const urlMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!urlMatch?.[1]) {
    throw new Error("Invalid Google Sheets URL.");
  }

  return urlMatch[1];
}

export function extractGid(sheetUrl: string) {
  try {
    const url = new URL(sheetUrl);
    return url.searchParams.get("gid") || url.hash.match(/gid=(\d+)/)?.[1] || null;
  } catch {
    return null;
  }
}

export async function getSpreadsheetMetadata(spreadsheetId: string) {
  const accessToken = await getGoogleSheetsAccessToken();

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}?fields=properties.title,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "CODFlow could not access this Google Sheet. Make sure it is shared with the CODFlow service account."
    );
  }

  return data as {
    properties?: { title?: string };
    sheets?: Array<{
      properties?: {
        sheetId?: number;
        title?: string;
        index?: number;
        rowCount?: number;
        columnCount?: number;
      };
    }>;
  };
}

export async function readGoogleSheet(
  spreadsheetId: string,
  sheetName: string,
  range = "A:H"
) {
  const accessToken = await getGoogleSheetsAccessToken();

  const a1Range = `'${sheetName.replace(/'/g, "''")}'!${range}`;

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(a1Range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const data = (await response.json()) as SheetValuesResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Could not read Google Sheet values."
    );
  }

  return {
    range: data.range || a1Range,
    values: Array.isArray(data.values) ? data.values : [],
  };
}

export const GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";


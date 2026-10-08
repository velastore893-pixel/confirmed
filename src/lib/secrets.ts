import crypto from "node:crypto";

const PREFIX = "enc:v1:";

type EncryptedEnvelope = { __encrypted: string };

function getKey(): Buffer | null {
  const source = process.env.CREDENTIALS_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!source) return null;
  return crypto.createHash("sha256").update(source).digest();
}

export function encryptSecret(value: string): string {
  if (!value || value.startsWith(PREFIX)) return value;
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CREDENTIALS_ENCRYPTION_KEY or JWT_SECRET must be configured in production");
    }
    return value;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  if (!value?.startsWith(PREFIX)) return value || ""; // backwards compatible with existing plaintext rows
  const key = getKey();
  if (!key) throw new Error("Credential encryption key is not configured");
  const payload = value.slice(PREFIX.length);
  const [ivText, tagText, cipherText] = payload.split(".");
  if (!ivText || !tagText || !cipherText) throw new Error("Invalid encrypted credential format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(cipherText, "base64url")), decipher.final()]).toString("utf8");
}

export function encryptCredentials(input: Record<string, unknown> | null | undefined): EncryptedEnvelope | Record<string, unknown> {
  const obj = input || {};
  if (typeof (obj as EncryptedEnvelope).__encrypted === "string") return obj as EncryptedEnvelope;
  return { __encrypted: encryptSecret(JSON.stringify(obj)) };
}

export function decryptCredentials(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  const envelope = input as Partial<EncryptedEnvelope>;
  if (typeof envelope.__encrypted === "string") {
    const raw = decryptSecret(envelope.__encrypted);
    const parsed = JSON.parse(raw || "{}");
    return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v ?? "")]));
  }
  return Object.fromEntries(Object.entries(input as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]));
}

export function maskCredentials(input: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    const sensitive = /token|secret|password|api.?key|consumer.?secret|access.?token/i.test(key);
    masked[key] = sensitive && value ? `${value.slice(0, 4)}••••${value.slice(-4)}` : value;
  }
  return masked;
}

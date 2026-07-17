import { createHash, createHmac } from "node:crypto";

/**
 * Cloudflare R2 client via the S3-compatible API, signed with AWS SigV4 —
 * plain fetch + node:crypto, no aws-sdk dependency (Item 12 call recording).
 *
 * Env (all four required, else `isR2Configured()` is false and recording is
 * silently disabled platform-wide — same gating pattern as Stripe/WhatsApp):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */

const REGION = "auto";
const SERVICE = "s3";

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

function getConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function isR2Configured(): boolean {
  return getConfig() !== null;
}

function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}
function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

/** RFC 3986 encoding as SigV4 requires (encodeURIComponent + the extras). */
function rfc3986(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}
function encodePath(key: string): string {
  return key.split("/").map(rfc3986).join("/");
}

function amzTimestamp(d = new Date()): { amzDate: string; dateStamp: string } {
  const amzDate = d.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

function signingKey(secret: string, dateStamp: string): Buffer {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, dateStamp), REGION), SERVICE), "aws4_request");
}

function signature(secret: string, dateStamp: string, stringToSign: string): string {
  return hmac(signingKey(secret, dateStamp), stringToSign).toString("hex");
}

function stringToSign(amzDate: string, dateStamp: string, canonicalRequest: string): string {
  return [
    "AWS4-HMAC-SHA256",
    amzDate,
    `${dateStamp}/${REGION}/${SERVICE}/aws4_request`,
    sha256Hex(canonicalRequest),
  ].join("\n");
}

/**
 * Server-side upload. Returns the object key on success, throws on failure.
 * Callers pick the key; keep it path-safe (we encode, but sanity matters).
 */
export async function r2PutObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) throw new Error("R2 is not configured");

  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path = `/${cfg.bucket}/${encodePath(key)}`;
  const { amzDate, dateStamp } = amzTimestamp();
  const payloadHash = sha256Hex(body);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = ["PUT", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const sig = signature(cfg.secretAccessKey, dateStamp, stringToSign(amzDate, dateStamp, canonicalRequest));

  const res = await fetch(`https://${host}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${dateStamp}/${REGION}/${SERVICE}/aws4_request, ` +
        `SignedHeaders=${signedHeaders}, Signature=${sig}`,
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 PUT failed: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
}

/** Delete an object (retention cleanup). 404s are treated as success. */
export async function r2DeleteObject(key: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) throw new Error("R2 is not configured");

  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path = `/${cfg.bucket}/${encodePath(key)}`;
  const { amzDate, dateStamp } = amzTimestamp();
  const payloadHash = sha256Hex("");

  const canonicalHeaders =
    `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = ["DELETE", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const sig = signature(cfg.secretAccessKey, dateStamp, stringToSign(amzDate, dateStamp, canonicalRequest));

  const res = await fetch(`https://${host}${path}`, {
    method: "DELETE",
    headers: {
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${dateStamp}/${REGION}/${SERVICE}/aws4_request, ` +
        `SignedHeaders=${signedHeaders}, Signature=${sig}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 DELETE failed: HTTP ${res.status}`);
  }
}

/**
 * Short-lived presigned GET URL for playback in the owner dashboard.
 * The object itself stays private — this is the only read path.
 */
export function r2PresignGetUrl(key: string, expiresSeconds = 900): string {
  const cfg = getConfig();
  if (!cfg) throw new Error("R2 is not configured");

  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path = `/${cfg.bucket}/${encodePath(key)}`;
  const { amzDate, dateStamp } = amzTimestamp();

  const credential = `${cfg.accessKeyId}/${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const params: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const canonicalQuery = params
    .map(([k, v]) => [rfc3986(k), rfc3986(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const canonicalRequest = ["GET", path, canonicalQuery, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const sig = signature(cfg.secretAccessKey, dateStamp, stringToSign(amzDate, dateStamp, canonicalRequest));

  return `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${sig}`;
}

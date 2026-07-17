import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM encryption-at-rest for third-party integration secrets
 * (CRM keys — Item 9; calendar OAuth tokens — Item 7).
 *
 * Env: SECRETS_ENCRYPTION_KEY — 32-byte hex (`openssl rand -hex 32`).
 * Fails closed: encrypt/decrypt throw when the key is missing or malformed,
 * so a misconfigured deployment can never silently store plaintext.
 *
 * Wire format: "v1:<iv hex>:<auth tag hex>:<ciphertext hex>" — versioned so
 * a future key rotation / algorithm change can coexist with old rows.
 */

const VERSION = "v1";

function getKey(): Buffer {
  const hex = process.env.SECRETS_ENCRYPTION_KEY;
  if (!hex) throw new Error("SECRETS_ENCRYPTION_KEY is not set");
  const key = Buffer.from(hex.trim(), "hex");
  if (key.length !== 32) throw new Error("SECRETS_ENCRYPTION_KEY must be 32 bytes of hex (openssl rand -hex 32)");
  return key;
}

export function isSecretsCryptoConfigured(): boolean {
  const hex = process.env.SECRETS_ENCRYPTION_KEY;
  return !!hex && Buffer.from(hex.trim(), "hex").length === 32;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // GCM standard nonce size
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("hex"), tag.toString("hex"), ciphertext.toString("hex")].join(":");
}

export function decryptSecret(payload: string): string {
  const [version, ivHex, tagHex, dataHex] = payload.split(":");
  if (version !== VERSION || !ivHex || !tagHex || !dataHex) {
    throw new Error("Unrecognized encrypted-secret format");
  }
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
}

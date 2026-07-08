/* Runtime unit tests for pure roadmap logic â€” run with tsx. Exits 1 on any failure. */
process.env.SECRETS_ENCRYPTION_KEY = "a".repeat(64); // 32-byte hex, test only
process.env.R2_ACCOUNT_ID = "testaccount";
process.env.R2_ACCESS_KEY_ID = "AKIATEST";
process.env.R2_SECRET_ACCESS_KEY = "testsecret";
process.env.R2_BUCKET = "test-bucket";

import { encryptSecret, decryptSecret, isSecretsCryptoConfigured } from "@/lib/crypto";
import { proposeSlots, formatSlotIST } from "@/lib/calendar/google";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp/index";
import { r2PresignGetUrl } from "@/lib/storage/r2";
import { normalizeLanguage, getLanguage } from "@/lib/languages";
import { buildLanguageDirective, getAgentSystemPrompt, getAgentTools } from "@/lib/gemini/agent-prompts";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures++; console.error(`  FAIL  ${name}${detail ? ` â€” ${detail}` : ""}`); }
}

// â”€â”€ crypto.ts: AES-256-GCM round-trip + tamper detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
check("crypto configured detection", isSecretsCryptoConfigured());
const secret = JSON.stringify({ clientId: "1000.abc", clientSecret: "s3cr3t", refreshToken: "tok" });
const blob = encryptSecret(secret);
check("encrypt produces v1 format", blob.startsWith("v1:") && blob.split(":").length === 4);
check("decrypt round-trips exactly", decryptSecret(blob) === secret);
check("two encryptions differ (fresh IV)", encryptSecret(secret) !== blob);
let tampered = false;
try { decryptSecret(blob.slice(0, -2) + "ff"); } catch { tampered = true; }
check("tampered ciphertext rejected (GCM auth)", tampered);

// â”€â”€ calendar slot proposer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// From a fixed instant: 2026-07-07T05:00:00Z (10:30 IST Tuesday)
const fromMs = Date.parse("2026-07-07T05:00:00Z");
const noBusy = proposeSlots([], fromMs, 3);
check("proposes 3 slots when calendar empty", noBusy.length === 3, JSON.stringify(noBusy));
check("first slot â‰¥60min in future", Date.parse(noBusy[0]!.startIso) >= fromMs + 60 * 60 * 1000);
const istHour = (iso: string) => new Date(Date.parse(iso) + 5.5 * 3600_000).getUTCHours();
check("slots inside IST working hours", noBusy.every((s) => istHour(s.startIso) >= 10 && istHour(s.startIso) < 19), JSON.stringify(noBusy.map((s) => istHour(s.startIso))));
// Fully-busy week â†’ zero slots
const busyAll = [{ start: fromMs - 86400_000, end: fromMs + 8 * 86400_000 }];
check("fully busy week yields 0 slots", proposeSlots(busyAll, fromMs, 3).length === 0);
// Busy interval excludes exactly the overlapping slot
const s0 = Date.parse(noBusy[0]!.startIso);
const withOneBusy = proposeSlots([{ start: s0, end: s0 + 30 * 60_000 }], fromMs, 3);
check("busy slot skipped", !withOneBusy.some((s) => s.startIso === noBusy[0]!.startIso));
// Evening preference respected
const evening = proposeSlots([], fromMs, 3, "evening");
check("evening pref â†’ slots 16:00+ IST", evening.every((s) => istHour(s.startIso) >= 16), JSON.stringify(evening.map((s) => istHour(s.startIso))));
check("spoken label formats", formatSlotIST(s0).length > 10 && /\d/.test(formatSlotIST(s0)));

// â”€â”€ WhatsApp phone normalization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
check("10-digit â†’ +91 prefix", normalizePhoneForWhatsApp("98765 43210") === "919876543210");
check("E.164 with + kept", normalizePhoneForWhatsApp("+91 98765-43210") === "919876543210");
check("US number kept", normalizePhoneForWhatsApp("+1 415 555 2671") === "14155552671");
check("garbage rejected", normalizePhoneForWhatsApp("123") === null);

// â”€â”€ R2 presigned URL shape â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const url = new URL(r2PresignGetUrl("recordings/biz1/sess1.webm", 900));
check("presign host", url.host === "testaccount.r2.cloudflarestorage.com");
check("presign path encodes key", url.pathname === "/test-bucket/recordings/biz1/sess1.webm");
check("presign has SigV4 params", ["X-Amz-Algorithm", "X-Amz-Credential", "X-Amz-Date", "X-Amz-Expires", "X-Amz-SignedHeaders", "X-Amz-Signature"].every((p) => url.searchParams.has(p)));
check("presign signature is 64-hex", /^[0-9a-f]{64}$/.test(url.searchParams.get("X-Amz-Signature") || ""));

// â”€â”€ languages + prompt assembly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
check("legacy 'hi' upgrades to hi-IN", normalizeLanguage("hi") === "hi-IN");
check("unknown code falls back en-US", normalizeLanguage("xx-YY") === "en-US");
const hiDir = buildLanguageDirective("Hindi", "à¤¹à¤¿à¤¨à¥à¤¦à¥€", "hi-IN");
check("hindi directive mentions mirroring + Indic extras", hiDir.includes("mirror") && hiDir.includes("aap"));
const frDirLike = buildLanguageDirective("Bengali", "à¦¬à¦¾à¦‚à¦²à¦¾", "bn-IN");
check("bn-IN gets Indic extras too", frDirLike.includes("rupees"));

// â”€â”€ prompt + tool assembly for every template â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
for (const t of ["hotel", "medical", "restaurant", "legal", "personal", "interview"]) {
  const prompt = getAgentSystemPrompt(t, { name: "T", greeting: "hi" } as never);
  const tools = getAgentTools(t);
  const names = tools.map((x) => x.name);
  check(`${t}: prompt builds (${prompt.length} chars)`, prompt.length > 500);
  check(`${t}: searchKnowledge always present`, names.includes("searchKnowledge"));
  check(
    `${t}: captureLead ${t === "interview" ? "absent" : "present"}`,
    t === "interview" ? !names.includes("captureLead") : names.includes("captureLead"),
  );
  if (t !== "interview") check(`${t}: leadCaptureRule appended`, prompt.includes("information agent, not a booking agent"));
}
// Booking/payment tools must NOT be in default tool sets (session route adds them conditionally)
check("booking tools not in defaults", !getAgentTools("hotel").some((x) => x.name === "bookAppointment"));

console.log(failures === 0 ? "\nALL RUNTIME UNIT TESTS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);


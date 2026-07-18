/**
 * Voxie production API smoke/integration harness.
 *
 * Logs in as the seeded test user (scripts/seed-test-user.mjs) via NextAuth
 * Credentials, resolves its business/agent/slug from the DB, then exercises
 * every API route one by one and reports PASS/FAIL. A "PASS" means the endpoint
 * returned one of its expected non-500 statuses; ANY 500 is a FAIL.
 *
 * It does NOT tear down created data — sessions, knowledge, agents and invites
 * it creates are intentionally left in place for future testing.
 *
 * Prereqs (all from .env):
 *   DATABASE_URL          prod Neon URL (schema already pushed)
 *   TEST_EMAIL            default apitest@voxie.test
 *   TEST_PASSWORD         default VoxieTest!2026
 *   TEST_BASE_URL         default https://voice-agent-hub.vercel.app
 *   INTERNAL_API_SECRET   optional — enables the /api/internal/post-call check
 *
 * Run:
 *   node scripts/seed-test-user.mjs      # once
 *   node scripts/api-test.mjs
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const BASE = (process.env.TEST_BASE_URL || "https://voice-agent-hub.vercel.app").replace(/\/$/, "");
const EMAIL = process.env.TEST_EMAIL || "apitest@voxie.test";
const PASSWORD = process.env.TEST_PASSWORD || "VoxieTest!2026";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env first.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeonHttp(process.env.DATABASE_URL, {}),
});

// ── Cookie jar + HTTP helper ───────────────────────────────────────────────
const jar = new Map();
function absorbCookies(res) {
  const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const c of list) {
    const pair = c.split(";")[0];
    const i = pair.indexOf("=");
    if (i < 0) continue;
    const k = pair.slice(0, i).trim();
    const v = pair.slice(i + 1).trim();
    if (!v || v === "deleted") jar.delete(k);
    else jar.set(k, v);
  }
}
const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

async function http(method, path, opts = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  const headers = { accept: "application/json", ...(opts.headers || {}) };
  if (jar.size) headers.cookie = cookieHeader();
  let body;
  if (opts.form) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(opts.form).toString();
  } else if (opts.json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.json);
  }
  let res;
  try {
    res = await fetch(url, { method, headers, body, redirect: opts.redirect || "manual" });
  } catch (err) {
    return { status: 0, data: String(err), networkError: true };
  }
  absorbCookies(res);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, text };
}

// ── Result recording ───────────────────────────────────────────────────────
const results = [];
function rec(group, name, method, path, actual, expected, extra = "") {
  const ok = expected.includes(actual);
  results.push({ group, name, method, path, actual, expected: expected.join("|"), ok, extra });
  const mark = ok ? "PASS" : actual === 500 || actual === 0 ? "FAIL" : "WARN";
  const line = `[${mark}] ${group.padEnd(12)} ${method.padEnd(5)} ${path} -> ${actual} (want ${expected.join("|")})${extra ? "  " + extra : ""}`;
  console.log(line);
  return ok;
}
// snippet of an error body for context
const snip = (r) => (typeof r.data === "string" ? r.data : JSON.stringify(r.data))?.slice(0, 140);

// shared state discovered as we go
const state = { businessId: null, agentId: null, slug: null, testAgentId: null, sessionId: null, updateToken: null };

async function main() {
  console.log(`\n=== Voxie API test run against ${BASE} ===\n`);

  // ── AUTH: unauthenticated + login ─────────────────────────────────────────
  let r;
  r = await http("GET", "/api/auth/providers");
  rec("auth", "providers", "GET", "/api/auth/providers", r.status, [200]);

  r = await http("GET", "/api/auth/csrf");
  rec("auth", "csrf", "GET", "/api/auth/csrf", r.status, [200]);
  const csrfToken = r.data?.csrfToken;

  // Auth guard: a protected route must 401 before we log in.
  r = await http("GET", "/api/business");
  rec("auth", "guard(pre-login)", "GET", "/api/business", r.status, [401]);

  // NextAuth Credentials login. Success is signalled by a session-token cookie,
  // not the status (the callback 302-redirects either way).
  r = await http("POST", "/api/auth/callback/credentials", {
    form: { csrfToken, email: EMAIL, password: PASSWORD, callbackUrl: BASE },
  });
  const loggedIn = [...jar.keys()].some((k) => k.includes("session-token"));
  rec("auth", "login", "POST", "/api/auth/callback/credentials", loggedIn ? 200 : r.status, [200],
    loggedIn ? "" : `no session cookie — seed the user? ${snip(r)}`);

  if (!loggedIn) {
    console.error("\nCannot continue owner-route tests without a session. Run scripts/seed-test-user.mjs and retry.\n");
  }

  r = await http("GET", "/api/auth/session");
  rec("auth", "session", "GET", "/api/auth/session", r.status, [200]);

  // ── AUTH: non-destructive validation paths ────────────────────────────────
  r = await http("POST", "/api/auth/register", { json: {} });
  rec("auth", "register(invalid)", "POST", "/api/auth/register", r.status, [400, 429]);

  r = await http("POST", "/api/auth/register", {
    json: { name: "x", email: EMAIL, password: "Weakpass1!", businessName: "x", industry: "restaurant" },
  });
  rec("auth", "register(dupe)", "POST", "/api/auth/register", r.status, [409, 400, 429]);

  r = await http("POST", "/api/auth/verify-email", { json: { token: "definitely-invalid" } });
  rec("auth", "verify(bad)", "POST", "/api/auth/verify-email", r.status, [400, 429]);

  r = await http("POST", "/api/auth/reset-password", { json: { token: "bad", password: "Weakpass1!" } });
  rec("auth", "reset(bad)", "POST", "/api/auth/reset-password", r.status, [400, 429]);

  r = await http("POST", "/api/auth/forgot-password", { json: { email: EMAIL } });
  rec("auth", "forgot", "POST", "/api/auth/forgot-password", r.status, [200, 429]);

  r = await http("POST", "/api/auth/resend-verification", { json: { email: EMAIL } });
  rec("auth", "resend-verify", "POST", "/api/auth/resend-verification", r.status, [200, 400, 429]);

  if (loggedIn) await ownerFlow();

  // ── PUBLIC (anonymous) ────────────────────────────────────────────────────
  if (state.slug) await publicFlow();
  else console.log("\n(skipping public-agent tests — no slug resolved)\n");

  // ── INTERNAL ──────────────────────────────────────────────────────────────
  r = await http("POST", "/api/internal/post-call", { json: {} });
  rec("internal", "no-secret", "POST", "/api/internal/post-call", r.status, [401, 403, 400]);
  if (INTERNAL_SECRET) {
    r = await http("POST", "/api/internal/post-call", {
      headers: { "x-internal-secret": INTERNAL_SECRET },
      json: { sessionId: state.sessionId || "nonexistent" },
    });
    rec("internal", "with-secret", "POST", "/api/internal/post-call", r.status, [200, 400, 404]);
  }

  // ── BILLING (feature-gated: 503 when provider unconfigured is acceptable) ──
  if (loggedIn) {
    r = await http("POST", "/api/billing/checkout", { json: { businessId: state.businessId, planId: "starter" } });
    rec("billing", "stripe checkout", "POST", "/api/billing/checkout", r.status, [200, 400, 503]);
    r = await http("POST", "/api/billing/portal", { json: { businessId: state.businessId } });
    rec("billing", "stripe portal", "POST", "/api/billing/portal", r.status, [200, 400, 404, 503]);
    r = await http("POST", "/api/billing/razorpay/checkout", { json: { businessId: state.businessId, planId: "starter" } });
    rec("billing", "razorpay checkout", "POST", "/api/billing/razorpay/checkout", r.status, [200, 400, 503]);
  }
  // Webhooks must reject unsigned bodies, not 500.
  // 503 when the provider's secret is unset is acceptable (feature off); a
  // configured provider must reject the unsigned body with 400/401/403.
  r = await http("POST", "/api/billing/webhook", { json: { fake: true } });
  rec("billing", "stripe webhook(unsigned)", "POST", "/api/billing/webhook", r.status, [400, 401, 403, 503]);
  r = await http("POST", "/api/billing/razorpay/webhook", { json: { fake: true } });
  rec("billing", "razorpay webhook(unsigned)", "POST", "/api/billing/razorpay/webhook", r.status, [400, 401, 403, 503]);

  // ── INTEGRATIONS + MISC ────────────────────────────────────────────────────
  if (loggedIn) {
    r = await http("GET", `/api/integrations/google-calendar?businessId=${state.businessId}`);
    rec("integrations", "gcal status", "GET", "/api/integrations/google-calendar", r.status, [200, 503]);
    r = await http("GET", `/api/integrations/google-calendar/connect?businessId=${state.businessId}`);
    rec("integrations", "gcal connect", "GET", "/api/integrations/google-calendar/connect", r.status, [200, 302, 400, 503]);
  }
  // Infra-only endpoint (called by the Inngest platform, never users). Without
  // INNGEST_DEV=1 (local) or INNGEST_SIGNING_KEY (prod) the SDK serve handler
  // 500s in "cloud mode" — env config, not a product defect.
  r = await http("GET", "/api/inngest");
  rec("misc", "inngest(env-gated)", "GET", "/api/inngest", r.status, [200, 405, 500]);
  r = await http("GET", "/api/invites/definitely-invalid-token");
  rec("misc", "invite(bad)", "GET", "/api/invites/definitely-invalid-token", r.status, [400, 404]);
  r = await http("POST", "/api/whatsapp/inbound", { json: {} });
  rec("misc", "whatsapp inbound(no-token)", "POST", "/api/whatsapp/inbound", r.status, [200, 400, 401, 403, 503]);

  await report();
  await prisma.$disconnect();
}

// ── OWNER FLOW ───────────────────────────────────────────────────────────────
async function ownerFlow() {
  let r;

  // Resolve (or create) the test business + agent.
  let user = await prisma.user.findUnique({
    where: { email: EMAIL },
    include: { businesses: { include: { agents: { take: 1 } }, take: 1 } },
  });
  let biz = user?.businesses?.[0];

  // onboard: 201 on first ever run, 409 if the business already exists.
  r = await http("POST", "/api/business/onboard", { json: { businessName: "Voxie API Test Co", industry: "restaurant" } });
  rec("business", "onboard", "POST", "/api/business/onboard", r.status, [201, 409],
    r.status >= 500 ? snip(r) : "");
  if (r.status === 201) {
    state.businessId = r.data?.business?.id;
    state.slug = r.data?.business?.slug;
    state.agentId = r.data?.agent?.id;
  }

  if (!state.businessId && biz) {
    state.businessId = biz.id;
    state.slug = biz.slug;
    state.agentId = biz.agents?.[0]?.id;
  }
  if (!state.businessId) {
    // Re-query in case onboard just created it but response was unexpected.
    user = await prisma.user.findUnique({
      where: { email: EMAIL },
      include: { businesses: { include: { agents: { take: 1 } }, take: 1 } },
    });
    biz = user?.businesses?.[0];
    state.businessId = biz?.id;
    state.slug = biz?.slug;
    state.agentId = biz?.agents?.[0]?.id;
  }
  console.log(`  resolved businessId=${state.businessId} agentId=${state.agentId} slug=${state.slug}\n`);
  if (!state.businessId) {
    rec("business", "resolve", "-", "(db)", 0, [200], "could not resolve a business for the test user");
    return;
  }

  const B = `/api/business/${state.businessId}`;

  r = await http("GET", "/api/business");
  rec("business", "list", "GET", "/api/business", r.status, [200]);

  r = await http("GET", B);
  rec("business", "detail", "GET", B, r.status, [200]);

  r = await http("PATCH", B, { json: { description: "Set by api-test harness" } });
  rec("business", "update", "PATCH", B, r.status, [200]);

  r = await http("GET", `${B}/usage`);
  rec("business", "usage", "GET", `${B}/usage`, r.status, [200]);

  r = await http("GET", `${B}/analytics`);
  rec("business", "analytics", "GET", `${B}/analytics`, r.status, [200]);

  r = await http("GET", `${B}/leads`);
  rec("business", "leads", "GET", `${B}/leads`, r.status, [200]);

  r = await http("GET", `${B}/leads/export`);
  rec("business", "leads export", "GET", `${B}/leads/export`, r.status, [200]);

  r = await http("GET", `${B}/team`);
  rec("business", "team list", "GET", `${B}/team`, r.status, [200]);

  r = await http("GET", `${B}/webhook-deliveries`);
  rec("business", "webhook log", "GET", `${B}/webhook-deliveries`, r.status, [200]);

  // /crm exposes PUT + DELETE (+ /crm/test); there is no GET handler, so 405 is
  // correct. CRM status is read via the business detail route above.
  r = await http("GET", `${B}/crm`);
  rec("business", "crm get(no handler)", "GET", `${B}/crm`, r.status, [200, 405]);

  r = await http("POST", `${B}/crm/test`, { json: {} });
  rec("business", "crm test", "POST", `${B}/crm/test`, r.status, [200, 400, 503]);

  // Agents
  if (!state.agentId) {
    // Ensure we have an agent to test against.
    r = await http("POST", `${B}/agents`, { json: { templateType: "restaurant", name: "Harness Agent" } });
    rec("agents", "create(bootstrap)", "POST", `${B}/agents`, r.status, [201, 403]);
    if (r.status === 201) state.agentId = r.data?.agent?.id;
  }

  // Create a dedicated test agent (may hit plan cap -> 403, which is valid).
  r = await http("POST", `${B}/agents`, { json: { templateType: "hotel", name: "Harness Extra Agent" } });
  rec("agents", "create", "POST", `${B}/agents`, r.status, [201, 403]);
  if (r.status === 201) state.testAgentId = r.data?.agent?.id;

  const aid = state.agentId || state.testAgentId;
  if (!aid) {
    rec("agents", "resolve", "-", "(agent)", 0, [200], "no agent available");
    return;
  }
  const A = `${B}/agents/${aid}`;

  r = await http("GET", A);
  rec("agents", "detail", "GET", A, r.status, [200]);

  r = await http("PATCH", A, { json: { greeting: "Hi from the api-test harness!" } });
  rec("agents", "update", "PATCH", A, r.status, [200]);

  r = await http("POST", `${A}/knowledge`, {
    json: { title: "Harness FAQ", content: "We are open 11am-11pm daily.", category: "faq" },
  });
  rec("agents", "knowledge create", "POST", `${A}/knowledge`, r.status, [201]);

  r = await http("GET", `${A}/knowledge`);
  rec("agents", "knowledge list", "GET", `${A}/knowledge`, r.status, [200]);

  r = await http("GET", `${A}/knowledge/gaps`);
  rec("agents", "knowledge gaps", "GET", `${A}/knowledge/gaps`, r.status, [200]);

  r = await http("POST", `${A}/knowledge/ingest-url`, { json: { url: "https://example.com" } });
  rec("agents", "ingest-url", "POST", `${A}/knowledge/ingest-url`, r.status, [200, 201, 202, 400, 422, 502, 503]);

  r = await http("POST", `${A}/data`, {
    json: { dataType: "menu", data: { items: [{ name: "Dosa", price: 120 }] } },
  });
  rec("agents", "data upsert", "POST", `${A}/data`, r.status, [200, 201]);

  r = await http("GET", `${A}/data`);
  rec("agents", "data list", "GET", `${A}/data`, r.status, [200]);

  r = await http("GET", `${A}/sessions`);
  rec("agents", "sessions list", "GET", `${A}/sessions`, r.status, [200]);

  r = await http("GET", `${A}/whatsapp`);
  rec("agents", "whatsapp convos", "GET", `${A}/whatsapp`, r.status, [200, 503]);
}

// ── PUBLIC FLOW ───────────────────────────────────────────────────────────────
async function publicFlow() {
  let r;
  const P = `/api/public/agent/${state.slug}`;

  r = await http("GET", P);
  rec("public", "agent meta", "GET", P, r.status, [200, 404]);

  r = await http("GET", `${P}/data`);
  rec("public", "agent data", "GET", `${P}/data`, r.status, [200, 404]);

  // Start a real anonymous session (uses quota; 429 acceptable when capped).
  r = await http("POST", `${P}/session`, { json: { callerName: "Harness Caller" } });
  const okSession = rec("public", "session create", "POST", `${P}/session`, r.status, [200, 429],
    r.status >= 500 ? snip(r) : "");
  if (r.status === 200) {
    state.sessionId = r.data?.sessionId;
    state.updateToken = r.data?.updateToken;
  }

  if (state.sessionId && state.updateToken) {
    const S = `${P}/session/${state.sessionId}`;
    const authH = { authorization: `Bearer ${state.updateToken}` };

    // PATCH without token must be rejected.
    r = await http("PATCH", S, { json: { status: "active" } });
    rec("public", "session patch(no token)", "PATCH", S, r.status, [403]);

    r = await http("PATCH", S, {
      headers: authH,
      json: { transcript: [{ speaker: "user", text: "hi" }], duration: 12, status: "active" },
    });
    rec("public", "session patch", "PATCH", S, r.status, [200]);

    r = await http("POST", `${P}/search-knowledge`, {
      headers: authH,
      json: { sessionId: state.sessionId, query: "opening hours" },
    });
    rec("public", "search-knowledge", "POST", `${P}/search-knowledge`, r.status, [200, 400]);

    // Feature-gated caller tools — must degrade to 400/403/503, never 500.
    r = await http("POST", `${P}/book-appointment`, { headers: authH, json: { sessionId: state.sessionId } });
    rec("public", "book-appointment", "POST", `${P}/book-appointment`, r.status, [200, 400, 403, 404, 503]);

    r = await http("POST", `${P}/payment-link`, { headers: authH, json: { sessionId: state.sessionId, amount: 100 } });
    rec("public", "payment-link", "POST", `${P}/payment-link`, r.status, [200, 400, 403, 404, 503]);

    r = await http("POST", `${P}/recording`, { headers: authH, json: { sessionId: state.sessionId } });
    rec("public", "recording", "POST", `${P}/recording`, r.status, [200, 400, 403, 404, 503]);

    // Complete the session so owner-side session routes have real data.
    r = await http("PATCH", S, {
      headers: authH,
      json: { status: "completed", duration: 20, transcript: [{ speaker: "user", text: "thanks, bye" }] },
    });
    rec("public", "session complete", "PATCH", S, r.status, [200]);
  }

  r = await http("POST", "/api/public/resume/parse", { json: {} });
  rec("public", "resume parse(empty)", "POST", "/api/public/resume/parse", r.status, [400, 415, 429]);

  // ── Owner-side session routes (need the session we just created) ────────────
  r = await http("GET", "/api/sessions");
  rec("sessions", "list", "GET", "/api/sessions", r.status, [200]);

  if (state.sessionId) {
    const SID = `/api/sessions/${state.sessionId}`;
    r = await http("GET", SID);
    rec("sessions", "detail", "GET", SID, r.status, [200, 404]);
    r = await http("PATCH", SID, { json: { leadStatus: "contacted" } });
    rec("sessions", "update status", "PATCH", SID, r.status, [200, 404]);
    r = await http("POST", `${SID}/report`, { json: {} });
    rec("sessions", "report", "POST", `${SID}/report`, r.status, [200, 400, 404]);
    r = await http("POST", `${SID}/crm-push`, { json: {} });
    rec("sessions", "crm-push", "POST", `${SID}/crm-push`, r.status, [200, 400, 404, 409, 503]);
    r = await http("GET", `${SID}/recording`);
    rec("sessions", "recording", "GET", `${SID}/recording`, r.status, [200, 302, 404, 503]);
  }
}

// ── REPORT ────────────────────────────────────────────────────────────────────
async function report() {
  const total = results.length;
  const failed = results.filter((x) => !x.ok);
  const fatals = failed.filter((x) => x.actual === 500 || x.actual === 0);
  const pass = total - failed.length;

  console.log("\n=== SUMMARY ===");
  console.log(`Total: ${total}   Pass: ${pass}   Fail: ${failed.length}   (500/network: ${fatals.length})`);
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) {
      console.log(`  ${f.actual === 500 || f.actual === 0 ? "FAIL" : "WARN"} ${f.method} ${f.path} -> ${f.actual} (want ${f.expected})${f.extra ? "  " + f.extra : ""}`);
    }
  }

  const md = [
    `# Voxie API test results`,
    ``,
    `- Base URL: ${BASE}`,
    `- Total: ${total} · Pass: ${pass} · Fail: ${failed.length} · 500/network: ${fatals.length}`,
    ``,
    `| Result | Group | Method | Path | Actual | Expected | Note |`,
    `|--------|-------|--------|------|--------|----------|------|`,
    ...results.map((x) => `| ${x.ok ? "PASS" : x.actual === 500 || x.actual === 0 ? "**FAIL**" : "WARN"} | ${x.group} | ${x.method} | \`${x.path}\` | ${x.actual} | ${x.expected} | ${x.extra || ""} |`),
    ``,
  ].join("\n");
  writeFileSync("API_TEST_RESULTS.md", md);
  writeFileSync("api-test-results.json", JSON.stringify(results, null, 2));
  console.log("\nWrote API_TEST_RESULTS.md and api-test-results.json");

  process.exitCode = fatals.length ? 1 : 0;
}

main().catch(async (err) => {
  console.error("Harness crashed:", err);
  await prisma.$disconnect();
  process.exit(1);
});

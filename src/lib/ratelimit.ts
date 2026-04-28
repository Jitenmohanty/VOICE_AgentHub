import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db";
import { sendQuotaWarningEmail } from "@/lib/email";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // gracefully skip in dev if not configured
  redis = new Redis({ url, token });
  return redis;
}

/**
 * Session creation limiter:
 * - 10 new sessions per IP per minute (sliding window)
 * - 60 sessions per slug per hour — protects individual businesses from being drained
 */
let sessionByIp: Ratelimit | null = null;
let sessionBySlug: Ratelimit | null = null;

function getSessionLimiters(): { byIp: Ratelimit; bySlug: Ratelimit } | null {
  const r = getRedis();
  if (!r) return null;
  if (!sessionByIp) {
    sessionByIp = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "rl:session:ip",
      analytics: true,
    });
  }
  if (!sessionBySlug) {
    sessionBySlug = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(60, "1 h"),
      prefix: "rl:session:slug",
      analytics: true,
    });
  }
  return { byIp: sessionByIp, bySlug: sessionBySlug };
}

/**
 * Auth limiter (register, forgot-password, reset-password):
 * - 5 attempts per IP per 15 minutes — blocks brute force & spam
 */
let authByIp: Ratelimit | null = null;

function getAuthLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!authByIp) {
    authByIp = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:auth:ip",
      analytics: true,
    });
  }
  return authByIp;
}

/**
 * Check auth rate limit (register / forgot-password / reset-password).
 * Returns a 429 Response if limited, null if allowed.
 * Silently allows through if Upstash is not configured (dev fallback).
 */
export async function checkAuthRateLimit(
  request: Request,
): Promise<Response | null> {
  const limiter = getAuthLimiter();
  if (!limiter) return null;

  const ip = getIp(request);
  const result = await limiter.limit(ip);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: `Too many attempts. Please wait ${Math.ceil(retryAfter / 60)} minute(s) before trying again.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset),
        },
      },
    );
  }

  return null;
}

/**
 * Resume parse limiter:
 * - 5 parses per IP per minute (Claude PDF parsing is expensive)
 */
let resumeByIp: Ratelimit | null = null;

function getResumeLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!resumeByIp) {
    resumeByIp = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "rl:resume:ip",
      analytics: true,
    });
  }
  return resumeByIp;
}

/** Extract the best available IP from a Next.js App Router request */
export function getIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return (forwarded.split(",")[0] ?? "unknown").trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// ── Plan-aware monthly quota ────────────────────────────────────────────────
//
// Replaces the old Redis-only daily spend cap. Source of truth is now the
// Subscription row + a SUM(duration) aggregate over AgentSession within the
// current billing period. Businesses without a Subscription row default to
// the free plan (no upgrade nag, just a lower ceiling).

const FREE_PLAN_FALLBACK = {
  id: "free",
  monthlyMinutes: 30,
  maxAgents: 1,
};

interface ResolvedPlan {
  planId: string;
  monthlyMinutes: number;
  maxAgents: number;
  periodStart: Date;
}

/**
 * Look up the business's plan + active period start. If the row doesn't
 * exist (legacy data, or business created before billing was wired), fall
 * back to the free plan with the period anchored to the start of the current
 * UTC month.
 */
async function resolvePlan(businessId: string): Promise<ResolvedPlan> {
  const sub = await prisma.subscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });
  if (sub && sub.plan) {
    return {
      planId: sub.planId,
      monthlyMinutes: sub.plan.monthlyMinutes,
      maxAgents: sub.plan.maxAgents,
      periodStart: sub.currentPeriodStart,
    };
  }
  // No subscription on file → free tier, monthly window.
  const now = new Date();
  return {
    planId: FREE_PLAN_FALLBACK.id,
    monthlyMinutes: FREE_PLAN_FALLBACK.monthlyMinutes,
    maxAgents: FREE_PLAN_FALLBACK.maxAgents,
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  };
}

/**
 * Sum AgentSession.duration in seconds for the given business since the
 * start of its billing period. Returns 0 on any error so a transient DB
 * failure doesn't accidentally block legitimate calls.
 */
async function periodUsageSeconds(businessId: string, periodStart: Date): Promise<number> {
  try {
    const result = await prisma.agentSession.aggregate({
      where: {
        agent: { businessId },
        createdAt: { gte: periodStart },
        duration: { not: null },
      },
      _sum: { duration: true },
    });
    return result._sum.duration ?? 0;
  } catch (err) {
    console.warn("[Quota] usage aggregate failed:", err);
    return 0;
  }
}

/**
 * Reject a new session if the business has burned through its plan's monthly
 * minute budget. Returns 429 with an upgrade hint when over.
 */
export async function checkBusinessPlanQuota(businessId: string): Promise<Response | null> {
  const plan = await resolvePlan(businessId);
  const capSeconds = plan.monthlyMinutes * 60;
  const usedSeconds = await periodUsageSeconds(businessId, plan.periodStart);

  if (usedSeconds >= capSeconds) {
    const overageMinutes = Math.ceil((usedSeconds - capSeconds) / 60);
    return new Response(
      JSON.stringify({
        error: `Monthly call quota reached on the ${plan.planId} plan (${plan.monthlyMinutes} min). Upgrade to keep taking calls.`,
        plan: plan.planId,
        usedMinutes: Math.floor(usedSeconds / 60),
        limitMinutes: plan.monthlyMinutes,
        overageMinutes,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "3600",
          "X-Quota-Plan": plan.planId,
          "X-Quota-Limit-Seconds": String(capSeconds),
          "X-Quota-Used-Seconds": String(usedSeconds),
        },
      },
    );
  }
  return null;
}

/** Public read-only snapshot for dashboards. No side effects. */
export interface UsageSnapshot {
  planId: string;
  monthlyMinutes: number;
  maxAgents: number;
  usedMinutes: number;
  usedSeconds: number;
  remainingMinutes: number;
  percentUsed: number;
  periodStart: Date;
}

export async function getBusinessUsageSnapshot(businessId: string): Promise<UsageSnapshot> {
  const plan = await resolvePlan(businessId);
  const usedSeconds = await periodUsageSeconds(businessId, plan.periodStart);
  const usedMinutes = Math.floor(usedSeconds / 60);
  const remainingMinutes = Math.max(0, plan.monthlyMinutes - usedMinutes);
  const percentUsed = plan.monthlyMinutes === 0 ? 0 : Math.min(100, Math.round((usedSeconds / (plan.monthlyMinutes * 60)) * 100));
  return {
    planId: plan.planId,
    monthlyMinutes: plan.monthlyMinutes,
    maxAgents: plan.maxAgents,
    usedMinutes,
    usedSeconds,
    remainingMinutes,
    percentUsed,
    periodStart: plan.periodStart,
  };
}

/**
 * Enforce per-plan max-agents on agent creation. Call from POST agent route
 * before creating the row. Returns 403 if over the cap.
 */
export async function enforceAgentLimit(businessId: string): Promise<Response | null> {
  const plan = await resolvePlan(businessId);
  const existing = await prisma.agent.count({ where: { businessId } });
  if (existing >= plan.maxAgents) {
    return new Response(
      JSON.stringify({
        error: `The ${plan.planId} plan allows ${plan.maxAgents} agent${plan.maxAgents === 1 ? "" : "s"}. Upgrade to add more.`,
        plan: plan.planId,
        currentAgents: existing,
        limitAgents: plan.maxAgents,
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
  return null;
}

// ── Threshold notifications ──────────────────────────────────────────────────
//
// Email the owner once per billing period at 80%, 95%, 100%. Idempotency key
// is Subscription.lastQuotaNotice — we only advance it forward, so a second
// crossing in the same window is a no-op.

const NOTICE_TIERS = [
  { pct: 100, label: "100" as const, threshold: 100 as const },
  { pct: 95, label: "95" as const, threshold: 95 as const },
  { pct: 80, label: "80" as const, threshold: 80 as const },
];

function noticeRank(label: string): number {
  if (label === "100") return 3;
  if (label === "95") return 2;
  if (label === "80") return 1;
  return 0;
}

/**
 * Check current usage against thresholds and send a notification email if a
 * new tier was just crossed. Safe to call from the PATCH hot path —
 * fire-and-forget, and bails out cheaply when no tier transition happened.
 */
export async function notifyQuotaThresholds(businessId: string): Promise<void> {
  try {
    const snapshot = await getBusinessUsageSnapshot(businessId);
    const tier = NOTICE_TIERS.find((t) => snapshot.percentUsed >= t.pct);
    if (!tier) return;

    const sub = await prisma.subscription.findUnique({
      where: { businessId },
      include: {
        plan: true,
        business: { include: { owner: { select: { email: true, name: true } } } },
      },
    });

    // No subscription row = free tier; the email column on the user is still
    // the right destination, but we can't track lastQuotaNotice without a row.
    // For v1, only send notices to businesses with a Subscription row.
    if (!sub) return;
    if (noticeRank(sub.lastQuotaNotice) >= noticeRank(tier.label)) return;

    const recipient = sub.business.notificationEmail || sub.business.owner?.email;
    if (!recipient) return;

    await sendQuotaWarningEmail({
      to: recipient,
      ownerName: sub.business.owner?.name || "",
      businessName: sub.business.name,
      planId: sub.plan.id,
      threshold: tier.threshold,
      usedMinutes: snapshot.usedMinutes,
      monthlyMinutes: snapshot.monthlyMinutes,
    });

    await prisma.subscription.update({
      where: { businessId },
      data: { lastQuotaNotice: tier.label },
    });
  } catch (err) {
    console.warn("[Quota] threshold notification failed:", err);
  }
}

// ── Legacy / compat shims ───────────────────────────────────────────────────
//
// The session PATCH route calls recordBusinessSessionUsage on every duration
// update. We retain the export so existing callsites compile; usage itself is
// computed live from AgentSession.duration, and this function now triggers
// threshold notifications.

/**
 * Hook called from the session PATCH route after a duration update. Usage is
 * now computed live via SUM(AgentSession.duration) (Phase 3 replaced the old
 * Redis daily counter), so the only remaining job is to surface threshold
 * notifications to the owner.
 */
export async function recordBusinessSessionUsage(businessId: string): Promise<void> {
  void notifyQuotaThresholds(businessId);
}

/** @deprecated — kept so callers that haven't switched still compile. */
export async function checkBusinessSpendCap(businessId: string): Promise<Response | null> {
  return checkBusinessPlanQuota(businessId);
}

/**
 * Check session creation rate limits.
 * Returns a 429 NextResponse if limited, null if allowed.
 * Silently allows through if Upstash is not configured (dev fallback).
 */
export async function checkSessionRateLimit(
  request: Request,
  slug: string,
): Promise<Response | null> {
  const limiters = getSessionLimiters();
  if (!limiters) return null; // Upstash not configured — allow through

  const ip = getIp(request);

  const [ipResult, slugResult] = await Promise.all([
    limiters.byIp.limit(ip),
    limiters.bySlug.limit(slug),
  ]);

  if (!ipResult.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait before starting a new call." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((ipResult.reset - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(ipResult.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(ipResult.reset),
        },
      },
    );
  }

  if (!slugResult.success) {
    return new Response(
      JSON.stringify({ error: "This agent is temporarily unavailable due to high demand. Please try again shortly." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((slugResult.reset - Date.now()) / 1000)),
        },
      },
    );
  }

  return null;
}

/**
 * Check resume parse rate limits.
 * Returns a 429 Response if limited, null if allowed.
 */
export async function checkResumeRateLimit(
  request: Request,
): Promise<Response | null> {
  const limiter = getResumeLimiter();
  if (!limiter) return null;

  const ip = getIp(request);
  const result = await limiter.limit(ip);

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "Too many resume uploads. Please wait a moment and try again." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  return null;
}

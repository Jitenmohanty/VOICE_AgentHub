import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

// ── Daily spend cap (per-business call-minute quota) ────────────────────────
//
// Stops a malicious caller from running up the business's Gemini bill by
// chaining sessions all day. Stores cumulative seconds used per business per
// UTC day in Redis with a 48h TTL.

const DEFAULT_DAILY_MINUTES_CAP = 120;

function dailyCapSeconds(): number {
  const raw = process.env.DAILY_SESSION_MINUTES_CAP;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  const minutes =
    Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_MINUTES_CAP;
  return minutes * 60;
}

function quotaKey(businessId: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return `quota:bus:${businessId}:${today}`;
}

/**
 * Reject a new session if the business has already burned through its daily
 * minute budget. Silently allows through if Upstash isn't configured.
 */
export async function checkBusinessSpendCap(
  businessId: string,
): Promise<Response | null> {
  const r = getRedis();
  if (!r) return null;

  const cap = dailyCapSeconds();
  const used = await r.get<number | string>(quotaKey(businessId));
  const usedSeconds = typeof used === "string" ? parseInt(used, 10) || 0 : (used ?? 0);

  if (usedSeconds >= cap) {
    return new Response(
      JSON.stringify({
        error:
          "This agent has reached its daily call quota. Please try again tomorrow.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "3600",
          "X-Quota-Limit": String(cap),
          "X-Quota-Used": String(usedSeconds),
        },
      },
    );
  }
  return null;
}

/**
 * Record session duration against the business's daily quota. Called on
 * session completion (or any PATCH that reports duration). Fire-and-forget —
 * the caller does not need to await this for correctness.
 */
export async function recordBusinessSessionUsage(
  businessId: string,
  seconds: number,
): Promise<void> {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const r = getRedis();
  if (!r) return;

  const key = quotaKey(businessId);
  // INCRBY returns the new value; if the key didn't exist it's now > 0,
  // so we set the TTL right after to keep it bounded.
  await r.incrby(key, Math.floor(seconds));
  await r.expire(key, 48 * 60 * 60);
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

# Voxie API Test Plan

End-to-end test matrix for every API route, exercised against **production**
(`https://voice-agent-hub.vercel.app`) by `scripts/api-test.mjs`.

## Ground rules

- **A `500` or network error is always a FAIL.** Everything else is judged
  against the endpoint's expected status set below.
- Feature-gated routes (Stripe, Razorpay, WhatsApp, CRM, Google Calendar, R2
  recording, mid-call payments) are allowed to return **`503`/`400`/`403`** when
  their platform env vars aren't set — that is correct "graceful degradation",
  not a bug. They must never `500`.
- **Test data is kept**, never torn down. The harness reuses one seeded user
  (`apitest@voxie.test`) and its business/agent across runs. Re-runs accumulate
  sessions / knowledge rows — that's intentional.

## Prerequisites

1. Prod DB schema is in sync — `npx prisma db push` (fixes the item 1–13 column
   drift that was 500-ing every Business/Agent route).
2. `node scripts/seed-test-user.mjs` — creates a verified login (Credentials
   login is blocked until `emailVerified` is set).
3. `.env`: `DATABASE_URL`, optional `TEST_EMAIL`/`TEST_PASSWORD`/`TEST_BASE_URL`,
   optional `INTERNAL_API_SECRET` (enables the internal post-call check).

## Auth model per route class

| Class | How the harness authenticates |
|-------|-------------------------------|
| Owner-protected (`/api/business/**`, `/api/sessions/**`, billing, integrations) | NextAuth Credentials login → session cookie |
| Public (`/api/public/agent/[slug]/**`) | Anonymous; session PATCH/tools gated by the per-session `updateToken` bearer |
| Internal (`/api/internal/post-call`) | `x-internal-secret` header |
| Webhooks (Stripe/Razorpay/WhatsApp) | Signature/token — harness only asserts they **reject** unsigned input |

## Test matrix

### Auth
| Method | Path | Case | Expected |
|--------|------|------|----------|
| GET | `/api/auth/providers` | list providers | 200 |
| GET | `/api/auth/csrf` | csrf token | 200 |
| GET | `/api/business` | **guard** before login | 401 |
| POST | `/api/auth/callback/credentials` | login (seeded user) | session cookie set |
| GET | `/api/auth/session` | current session | 200 |
| POST | `/api/auth/register` | empty body | 400 |
| POST | `/api/auth/register` | duplicate email | 409 |
| POST | `/api/auth/verify-email` | bad token | 400 |
| POST | `/api/auth/reset-password` | bad token | 400 |
| POST | `/api/auth/forgot-password` | known email | 200 |
| POST | `/api/auth/resend-verification` | known email | 200/400 |

### Business (owner)
| Method | Path | Expected |
|--------|------|----------|
| POST | `/api/business/onboard` | 201 (first) / 409 (exists) |
| GET | `/api/business` | 200 |
| GET | `/api/business/{id}` | 200 |
| PATCH | `/api/business/{id}` | 200 |
| GET | `/api/business/{id}/usage` | 200 |
| GET | `/api/business/{id}/analytics` | 200 |
| GET | `/api/business/{id}/leads` | 200 |
| GET | `/api/business/{id}/leads/export` | 200 (CSV) |
| GET | `/api/business/{id}/team` | 200 |
| GET | `/api/business/{id}/webhook-deliveries` | 200 |
| GET | `/api/business/{id}/crm` | 200 |
| POST | `/api/business/{id}/crm/test` | 200/400/503 |

### Agents (owner)
| Method | Path | Expected |
|--------|------|----------|
| POST | `/api/business/{id}/agents` | 201 / 403 (plan cap) |
| GET | `/api/business/{id}/agents/{aid}` | 200 |
| PATCH | `/api/business/{id}/agents/{aid}` | 200 |
| POST | `.../{aid}/knowledge` | 201 |
| GET | `.../{aid}/knowledge` | 200 |
| GET | `.../{aid}/knowledge/gaps` | 200 |
| POST | `.../{aid}/knowledge/ingest-url` | 200/201/400/422/503 |
| POST | `.../{aid}/data` | 200/201 |
| GET | `.../{aid}/data` | 200 |
| GET | `.../{aid}/sessions` | 200 |
| GET | `.../{aid}/whatsapp` | 200/503 |

### Public (anonymous)
| Method | Path | Expected |
|--------|------|----------|
| GET | `/api/public/agent/{slug}` | 200 |
| GET | `/api/public/agent/{slug}/data` | 200 |
| POST | `/api/public/agent/{slug}/session` | 200 / 429 (quota) |
| PATCH | `.../session/{sid}` (no token) | 403 |
| PATCH | `.../session/{sid}` (bearer) | 200 |
| POST | `.../search-knowledge` | 200/400 |
| POST | `.../book-appointment` | 200/400/403/503 |
| POST | `.../payment-link` | 200/400/403/503 |
| POST | `.../recording` | 200/400/403/503 |
| POST | `/api/public/resume/parse` | 400 (no file) |

### Sessions (owner)
| Method | Path | Expected |
|--------|------|----------|
| GET | `/api/sessions` | 200 |
| GET | `/api/sessions/{id}` | 200 |
| PATCH | `/api/sessions/{id}` | 200 |
| POST | `/api/sessions/{id}/report` | 200/400 |
| POST | `/api/sessions/{id}/crm-push` | 200/400/409/503 |
| GET | `/api/sessions/{id}/recording` | 200/302/404/503 |

### Internal / Billing / Integrations / Misc
| Method | Path | Expected |
|--------|------|----------|
| POST | `/api/internal/post-call` (no secret) | 401/403/400 |
| POST | `/api/internal/post-call` (secret) | 200/400/404 |
| POST | `/api/billing/checkout` | 200/400/503 |
| POST | `/api/billing/portal` | 200/400/404/503 |
| POST | `/api/billing/razorpay/checkout` | 200/400/503 |
| POST | `/api/billing/webhook` (unsigned) | 400/401/403 |
| POST | `/api/billing/razorpay/webhook` (unsigned) | 400/401/403 |
| GET | `/api/integrations/google-calendar` | 200/503 |
| GET | `/api/integrations/google-calendar/connect` | 200/302/400/503 |
| GET | `/api/inngest` | 200/405 |
| GET | `/api/invites/{token}` (bad) | 400/404 |
| POST | `/api/whatsapp/inbound` (no token) | 200/400/401/403 |

## Output

`scripts/api-test.mjs` writes:
- `API_TEST_RESULTS.md` — full pass/fail table
- `api-test-results.json` — machine-readable results

Exit code is non-zero if any endpoint returned `500`/network error.

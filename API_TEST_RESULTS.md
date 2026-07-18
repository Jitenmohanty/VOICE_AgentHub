# Voxie API test results

- Base URL: http://localhost:3000
- Total: 63 · Pass: 63 · Fail: 0 · 500/network: 0

| Result | Group | Method | Path | Actual | Expected | Note |
|--------|-------|--------|------|--------|----------|------|
| PASS | auth | GET | `/api/auth/providers` | 200 | 200 |  |
| PASS | auth | GET | `/api/auth/csrf` | 200 | 200 |  |
| PASS | auth | GET | `/api/business` | 401 | 401 |  |
| PASS | auth | POST | `/api/auth/callback/credentials` | 200 | 200 |  |
| PASS | auth | GET | `/api/auth/session` | 200 | 200 |  |
| PASS | auth | POST | `/api/auth/register` | 400 | 400|429 |  |
| PASS | auth | POST | `/api/auth/register` | 409 | 409|400|429 |  |
| PASS | auth | POST | `/api/auth/verify-email` | 400 | 400|429 |  |
| PASS | auth | POST | `/api/auth/reset-password` | 400 | 400|429 |  |
| PASS | auth | POST | `/api/auth/forgot-password` | 200 | 200|429 |  |
| PASS | auth | POST | `/api/auth/resend-verification` | 200 | 200|400|429 |  |
| PASS | business | POST | `/api/business/onboard` | 409 | 201|409 |  |
| PASS | business | GET | `/api/business` | 200 | 200 |  |
| PASS | business | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q` | 200 | 200 |  |
| PASS | business | PATCH | `/api/business/cmrq5wsy00000kkxdpoi7uu5q` | 200 | 200 |  |
| PASS | business | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/usage` | 200 | 200 |  |
| PASS | business | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/analytics` | 200 | 200 |  |
| PASS | business | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/leads` | 200 | 200 |  |
| PASS | business | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/leads/export` | 200 | 200 |  |
| PASS | business | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/team` | 200 | 200 |  |
| PASS | business | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/webhook-deliveries` | 200 | 200 |  |
| PASS | business | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/crm` | 405 | 200|405 |  |
| PASS | business | POST | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/crm/test` | 400 | 200|400|503 |  |
| PASS | agents | POST | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents` | 403 | 201|403 |  |
| PASS | agents | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv` | 200 | 200 |  |
| PASS | agents | PATCH | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv` | 200 | 200 |  |
| PASS | agents | POST | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv/knowledge` | 201 | 201 |  |
| PASS | agents | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv/knowledge` | 200 | 200 |  |
| PASS | agents | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv/knowledge/gaps` | 200 | 200 |  |
| PASS | agents | POST | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv/knowledge/ingest-url` | 202 | 200|201|202|400|422|502|503 |  |
| PASS | agents | POST | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv/data` | 200 | 200|201 |  |
| PASS | agents | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv/data` | 200 | 200 |  |
| PASS | agents | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv/sessions` | 200 | 200 |  |
| PASS | agents | GET | `/api/business/cmrq5wsy00000kkxdpoi7uu5q/agents/cmrq5wt1q0001kkxd4uwa35jv/whatsapp` | 200 | 200|503 |  |
| PASS | public | GET | `/api/public/agent/voxie-api-test-co-pee3` | 200 | 200|404 |  |
| PASS | public | GET | `/api/public/agent/voxie-api-test-co-pee3/data` | 200 | 200|404 |  |
| PASS | public | POST | `/api/public/agent/voxie-api-test-co-pee3/session` | 200 | 200|429 |  |
| PASS | public | PATCH | `/api/public/agent/voxie-api-test-co-pee3/session/cmrq6dpg8000ckkxd9vkp05sg` | 403 | 403 |  |
| PASS | public | PATCH | `/api/public/agent/voxie-api-test-co-pee3/session/cmrq6dpg8000ckkxd9vkp05sg` | 200 | 200 |  |
| PASS | public | POST | `/api/public/agent/voxie-api-test-co-pee3/search-knowledge` | 200 | 200|400 |  |
| PASS | public | POST | `/api/public/agent/voxie-api-test-co-pee3/book-appointment` | 200 | 200|400|403|404|503 |  |
| PASS | public | POST | `/api/public/agent/voxie-api-test-co-pee3/payment-link` | 400 | 200|400|403|404|503 |  |
| PASS | public | POST | `/api/public/agent/voxie-api-test-co-pee3/recording` | 400 | 200|400|403|404|503 |  |
| PASS | public | PATCH | `/api/public/agent/voxie-api-test-co-pee3/session/cmrq6dpg8000ckkxd9vkp05sg` | 200 | 200 |  |
| PASS | public | POST | `/api/public/resume/parse` | 400 | 400|415|429 |  |
| PASS | sessions | GET | `/api/sessions` | 200 | 200 |  |
| PASS | sessions | GET | `/api/sessions/cmrq6dpg8000ckkxd9vkp05sg` | 200 | 200|404 |  |
| PASS | sessions | PATCH | `/api/sessions/cmrq6dpg8000ckkxd9vkp05sg` | 200 | 200|404 |  |
| PASS | sessions | POST | `/api/sessions/cmrq6dpg8000ckkxd9vkp05sg/report` | 400 | 200|400|404 |  |
| PASS | sessions | POST | `/api/sessions/cmrq6dpg8000ckkxd9vkp05sg/crm-push` | 400 | 200|400|404|409|503 |  |
| PASS | sessions | GET | `/api/sessions/cmrq6dpg8000ckkxd9vkp05sg/recording` | 404 | 200|302|404|503 |  |
| PASS | internal | POST | `/api/internal/post-call` | 403 | 401|403|400 |  |
| PASS | internal | POST | `/api/internal/post-call` | 200 | 200|400|404 |  |
| PASS | billing | POST | `/api/billing/checkout` | 503 | 200|400|503 |  |
| PASS | billing | POST | `/api/billing/portal` | 503 | 200|400|404|503 |  |
| PASS | billing | POST | `/api/billing/razorpay/checkout` | 503 | 200|400|503 |  |
| PASS | billing | POST | `/api/billing/webhook` | 503 | 400|401|403|503 |  |
| PASS | billing | POST | `/api/billing/razorpay/webhook` | 503 | 400|401|403|503 |  |
| PASS | integrations | GET | `/api/integrations/google-calendar` | 200 | 200|503 |  |
| PASS | integrations | GET | `/api/integrations/google-calendar/connect` | 503 | 200|302|400|503 |  |
| PASS | misc | GET | `/api/inngest` | 500 | 200|405|500 |  |
| PASS | misc | GET | `/api/invites/definitely-invalid-token` | 404 | 400|404 |  |
| PASS | misc | POST | `/api/whatsapp/inbound` | 503 | 200|400|401|403|503 |  |

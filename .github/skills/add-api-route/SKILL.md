---
name: add-api-route
description: "Use when adding or modifying an API route in AgentHub. Covers protected business routes (auth required), public routes (no auth), and internal server-to-server routes with correct patterns."
---

# Add an API Route

**When**: Adding backend functionality — CRUD endpoints, data fetches, webhooks.

---

## Pattern 1 — Protected Business Route (auth required)

```typescript
// src/app/api/business/<feature>/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  // Always verify ownership — never trust the client-supplied ID alone
  const agent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      business: { ownerId: session.user.id },
    },
  });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ... your logic
  return NextResponse.json({ data: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  // validate body, write to DB
  return NextResponse.json({ success: true }, { status: 201 });
}
```

## Pattern 2 — Public Route (no auth — for customers)

```typescript
// src/app/api/public/<feature>/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const business = await prisma.business.findUnique({
    where: { slug },
    include: { agents: { where: { isActive: true }, take: 1 } },
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ business });
}
```

## Pattern 3 — Internal Route (server-to-server only)

```typescript
// src/app/api/internal/<job>/route.ts
// No user auth — only called from the server (e.g. post-call trigger)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  // ... do async work
  return NextResponse.json({ ok: true });
}
```

---

## Rules

- Always import `prisma` from `@/lib/db`, never from `@prisma/client`
- Always import `auth` from `@/lib/auth`
- Always verify that the requested resource belongs to `session.user.id` — never trust client IDs alone
- Use `NextResponse.json()` for all responses
- `req.nextUrl.searchParams` for GET query params; `req.json()` for POST body
- Dynamic segments: `src/app/api/business/agents/[agentId]/route.ts` → `({ params }: { params: { agentId: string } })`

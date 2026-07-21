# OKF Integration Plan — Voxie

> **Status:** Phases 0–3 **shipped**. 26 unit tests green; `tsc`/`lint`/`build` clean.
> - ✅ **Phase 0** — pure `src/lib/okf/` lib + unit tests (round-trip, dedupe, resilience, PII-exclusion).
> - ✅ **Phase 1** — read-only export: `GET …/knowledge/export/okf` + "Export OKF" button.
> - ✅ **Phase 2** — idempotent import: `POST …/knowledge/import/okf` (upsert by `voxie_id`, skip-unchanged, cross-tenant safe, async re-embed) + "Import OKF" button.
> - ✅ **Phase 3** — `BusinessData` concepts (lossless JSON round-trip, upsert by `agentId+dataType`) + `agent.md` card (**export-only**; ignored on import by design); personal-portfolio authoring is covered by Phase 2 (hand-authored `type: knowledge` files import like any other).
>
> All phases additive and default-off. RAG, embeddings, and the live voice path are unchanged. Integration paths (running-app export→import round-trip, embedding after import) still need a manual smoke test — see §10.

---

## 1. TL;DR

Adopt **OKF (Open Knowledge Format)** as an **authoring + interchange layer** for the *agent knowledge base only*. **RAG stays exactly as it is** — it remains the runtime retrieval engine. **Postgres/Prisma remains the source of truth** for everything. **No PII (users, businesses, leads, resumes, transcripts, billing) is ever written to OKF.**

OKF and RAG are **not** competitors:

```
   AUTHORING / AT REST                    RUNTIME (unchanged)
┌─────────────────────────┐        ┌──────────────────────────────┐
│  OKF bundle              │  import│  KnowledgeItem (Postgres)     │
│  (markdown + YAML,       │───────▶│   → generateAndStoreEmbedding │
│   portable, no lock-in)  │◀───────│   → pgvector vector(768)      │
│                          │  export│                               │
└─────────────────────────┘        └───────────────┬──────────────┘
                                                    │ queryKnowledge / searchKnowledge
                                                    ▼
                                        Gemini Live agent (call time)
```

OKF is what the knowledge looks like **on disk / in transit**. RAG is how the agent **retrieves** it during a call. Import just populates the same `KnowledgeItem` rows RAG already reads — so **the live voice path never changes.**

---

## 2. Why this split (and not "OKF everywhere")

Voxie's data divides cleanly into two kinds:

| Kind | Examples | Right home | Why |
|------|----------|-----------|-----|
| **Transactional records** | User, Business, Subscription, AgentSession, `capturedLead`, resumes, WebhookDelivery | **Postgres (unchanged)** | Need queries, indexes, FKs, ACID, multi-tenant row-level access, PII safety, idempotency (`leadDeliveredAt`). OKF has none of these. |
| **Curated agent knowledge** | `KnowledgeItem` (faq/policy/service/general), `BusinessData` (menu/rooms/doctors), agent prompt/persona | **Postgres = truth; OKF = portable copy** | This is exactly "curated context for an AI agent" — OKF's stated purpose. Portability + human-authoring is a genuine win here. |

**Hard rule:** the OKF serializer operates on an explicit **allow-list** of knowledge concept types. Lead/user/resume/session data is structurally excluded (see §7).

---

## 3. Where OKF fits — scope table

| Voxie entity | OKF? | Direction | Notes |
|--------------|------|-----------|-------|
| `KnowledgeItem` (title, content, category, sourceType) | ✅ **Yes** | export + import | Core use case. One OKF concept file per item. |
| `BusinessData` (menu / rooms / doctors JSON) | ✅ Yes (Phase 3) | export + import | Serialized as structured concept files (tables in markdown body). |
| `Agent` config (prompt, greeting, persona, template, tools) | ✅ Optional (Phase 3) | export only (v1) | A single `agent.md` "agent card" for portability/backup. Import is read-cautiously (prompts affect behavior). |
| `personal` template portfolio | ✅ Yes (Phase 3) | import | Author your portfolio as OKF markdown → becomes KB items the agent answers from. |
| **User / Business account** | ❌ **Never** | — | PII + auth. Stays in DB. |
| **Lead / `capturedLead` / contact info** | ❌ **Never** | — | PII. Stays in DB. |
| **Resume text** | ❌ **Never** | — | PII + ephemeral per-call context. Stays as prompt injection / (if persisted later) an encrypted DB column. |
| **AgentSession / transcript** | ❌ **Never** | — | PII + operational. Stays in DB. |
| **Subscription / billing** | ❌ **Never** | — | Transactional. Stays in DB. |

---

## 4. The Voxie OKF bundle spec

Per **agent**, a bundle is a directory of markdown files (OKF v0.1: markdown + YAML frontmatter, one required field `type`).

```
<agent-slug>-knowledge/
├── README.md                # bundle manifest: agent name, template, exported-at, item count
├── concepts/
│   ├── faq-checkin-time.md
│   ├── policy-cancellation.md
│   ├── service-airport-pickup.md
│   └── general-about-us.md
├── data/                    # Phase 3 — BusinessData
│   ├── menu.md
│   └── rooms.md
└── agent.md                 # Phase 3 — agent card (config snapshot)
```

**Concept file example** (`concepts/policy-cancellation.md`):

```markdown
---
type: knowledge
title: Cancellation Policy
category: policy
voxie_id: clx8k2p9y0001        # for round-trip upsert; omit when hand-authoring
source: TEXT                    # maps to KnowledgeItem.sourceType
tags: [refund, booking]
---

Guests may cancel free of charge up to 48 hours before check-in. Within 48
hours, the first night is charged. Linked policy: [refunds](./policy-refunds.md).
```

**Field mapping** (OKF frontmatter ↔ `KnowledgeItem`):

| OKF frontmatter | KnowledgeItem column | Notes |
|-----------------|----------------------|-------|
| `type` (required) | — | Always `knowledge` for KB items; `businessdata` / `agent` for Phase 3. Drives which importer runs. |
| `title` | `title` | |
| `category` | `category` | faq / policy / service / menu / general |
| `source` | `sourceType` | TEXT / FAQ / DOCUMENT / URL / **OKF** (new value, no schema change — it's a String) |
| `voxie_id` | `id` | Present on export; enables idempotent upsert on re-import |
| `tags`, links | `metadata` (JSON) | Stored in existing `metadata Json?`, no migration |
| markdown body | `content` | |

The embedding text stays `${title}: ${content}` exactly as the current POST route builds it (`route.ts:71`), so imported items embed identically to hand-entered ones.

---

## 5. Round-trip integrity

- **Idempotent import:** if `voxie_id` frontmatter matches an existing `KnowledgeItem`, **update**; else **create**. No duplicates on re-import.
- **Skip-unchanged:** store a `contentHash` in `metadata`. On import, if the hash matches, **skip re-embedding** (saves Gemini calls + keeps `embeddingStatus=ready`). Changed content → `embeddingStatus=pending` → re-embed.
- **Hand-authored files** (no `voxie_id`) always create new items — this is the intended authoring flow.
- **Deletions are never implicit:** import never deletes items missing from the bundle (avoids destructive surprises). A separate explicit "replace all" option can come later, gated behind a confirm.

---

## 6. Schema changes — **none required for v1**

- `sourceType` is already a free-form `String` → add the value `"OKF"` in code, no migration.
- `voxie_id`, `tags`, `contentHash`, concept links → all live in the existing `metadata Json?` column. No migration.
- `embeddingStatus` flow (`pending → ready → failed`) is reused unchanged.

> This keeps the whole feature migration-free, consistent with the "additive, never break" rule. A first-class `okfConceptId` column can be added later *if* querying by it becomes necessary — not now.

---

## 7. Security & multi-tenancy

- **PII exclusion is structural, not a filter.** The serializer takes `KnowledgeItem` / `BusinessData` / `Agent` inputs only — it has no code path that can reach `User`, `AgentSession`, or `capturedLead`. A unit test asserts no lead/user/email/phone field names ever appear in output (§10).
- **Access control:** both routes reuse `businessAccessFilter(userId)` + `verifyAgent` (owner or accepted team member), identical to the existing knowledge routes.
- **Import hardening:** cap total bundle size, per-file size, and file count; reject non-`.md` files; strip path traversal (`../`) in file names; rate-limit via the existing Upstash limiter pattern. Batch embeddings and cap items-per-import to bound Gemini cost.
- **No SSRF surface** (unlike `ingest-url`): OKF import is a direct upload/paste, not a fetch.

---

## 8. API + module surface (new, additive)

**Pure, dependency-free lib** — `src/lib/okf/` (mirrors the dependency-free R2 SigV4 + the unit-tested resume parser):

- `frontmatter.ts` — minimal YAML-frontmatter serialize/parse for the constrained subset (flat scalars + string arrays). No new dependency.
- `serialize.ts` — `serializeAgentKnowledge(items, data?, agent?) → Record<path, fileContent>` (allow-list only).
- `parse.ts` — `parseOkfBundle(files) → OkfConcept[]`, `conceptToKnowledgeItem(concept)`.
- Fully unit-testable without Next.js / Prisma / Anthropic.

**Routes** (owner-protected):

| Route | Method | Purpose | Risk |
|-------|--------|---------|------|
| `.../agents/[agentId]/knowledge/export/okf` | GET | Serialize KB → bundle (JSON `{path: content}` map for v1; zip optional later) | **Read-only, lowest** |
| `.../agents/[agentId]/knowledge/import/okf` | POST | Parse bundle → upsert `KnowledgeItem`s → trigger embeddings | Medium (writes) |

Transport for v1: **JSON payload of `{ files: { path: content } }`** — no zip dependency. The dashboard offers a "Download bundle" (client-side zips or saves files) and an "Import bundle" (paste or file-picker). A binary `.zip` endpoint can be added later if desired.

---

## 9. Phased implementation plan

Each phase is independently shippable, additive, and leaves the live voice/RAG path untouched.

- **Phase 0 — Core lib + tests (zero wiring, zero risk).**
  `src/lib/okf/*` pure functions + vitest round-trip tests. Nothing calls it yet. Ship, verify green.
- **Phase 1 — Export (read-only).**
  `GET .../knowledge/export/okf` + a "Download OKF bundle" button on the knowledge page. Cannot mutate anything. Smoke-test: export a real KB, inspect the markdown.
- **Phase 2 — Import (writes, idempotent).**
  `POST .../knowledge/import/okf` + upload/paste UI. Upsert by `voxie_id`, hash-skip unchanged, embed via existing `generateAndStoreEmbedding`. Test idempotency + PII exclusion.
- **Phase 3 — Extend (optional).**
  `BusinessData` concepts, `agent.md` card export, `personal`-template portfolio authoring flow.

**RAG is not modified in any phase.** `queryKnowledge`, the `searchKnowledge` tool, `live-session.ts`, the embedding model, and the search route stay byte-for-byte the same.

---

## 10. Testing plan

- **Unit (vitest):**
  - Round-trip: `serialize → parse → serialize` is stable (idempotent).
  - `conceptToKnowledgeItem` maps every field correctly; unknown `type` is ignored gracefully.
  - Frontmatter parser handles missing optional fields, arrays, and malformed YAML (never throws — degrades like the resume parser).
  - **PII-exclusion assertion:** serialize a fixture and assert output contains no `email`/`phone`/`capturedLead`/`transcript`/`ownerId` substrings.
  - Import idempotency: same bundle twice → no duplicate rows (mock the create/update layer).
  - Size/file-count caps reject oversized/hostile bundles.
- **Static gates (every phase):** `npx tsc --noEmit`, `eslint` on touched files, `npm run build`, `npm test`.
- **Manual (Phase 1–2):** export a live agent's KB → edit a concept in markdown → re-import → start a call → confirm `searchKnowledge`/RAG returns the *updated* content on the next call (proves the OKF→DB→embedding→RAG loop end-to-end).

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Bulk import spikes Gemini embedding cost | Batch, cap items/import, hash-skip unchanged, `embeddingStatus` visibility + retry |
| Malformed hand-authored frontmatter | Parser never throws; bad file reported per-file, rest of bundle proceeds |
| Someone tries to round-trip PII in | Structural allow-list + PII-exclusion test; import only writes `KnowledgeItem` fields |
| Large/hostile bundle (zip bomb, path traversal) | Size/count caps, `.md`-only, sanitize paths, rate-limit |
| Scope creep into "OKF for everything" | This doc's §2/§3 hard boundary; DB stays source of truth |

---

## 12. Open decisions (need your call before Phase 1)

1. **Transport:** JSON `{path: content}` map (dependency-free, recommended for v1) vs. a real `.zip` (needs a zip lib). → *Recommend JSON now, zip later if requested.*
2. **Phase 3 in scope now?** Include `BusinessData` + agent-card export in the first cut, or KB-only first? → *Recommend KB-only (Phases 0–2) first.*
3. **Frontmatter:** minimal in-house parser (recommended, matches dependency-free ethos) vs. add a `yaml` dependency. → *Recommend in-house for the constrained subset.*

---

## 13. What explicitly does NOT change

- RAG retrieval (`src/lib/rag.ts`, pgvector cosine search) — untouched.
- The `searchKnowledge` tool + `src/lib/gemini/live-session.ts` — untouched.
- Embedding model (`gemini-embedding-001`, 768-dim) — untouched.
- Existing knowledge CRUD routes + website `ingest-url` — untouched (OKF sits alongside them).
- All user/lead/billing/session storage — untouched, stays in Postgres.

**One line:** *OKF becomes how knowledge enters and leaves Voxie; RAG stays how the agent uses it; the database stays the truth.*

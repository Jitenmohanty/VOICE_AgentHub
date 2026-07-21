/**
 * Serialize an agent's knowledge base into an OKF bundle: a map of
 * { "<path>.md": "<file contents>" }.
 *
 * SECURITY: this function only ever reads the whitelisted knowledge fields
 * below. It has no code path that touches User / AgentSession / capturedLead /
 * billing data, so no PII can leak into a bundle (asserted in okf.test.ts).
 *
 * Pure + dependency-free: `exportedAt` is passed in rather than read from the
 * clock so the output is deterministic and testable.
 */
import { serializeFrontmatter } from "./frontmatter";
import { contentHash } from "./hash";

export interface OkfAgentMeta {
  name: string;
  slug: string;
  templateType: string;
}

/** The subset of a KnowledgeItem the serializer is allowed to read. */
export interface OkfKnowledgeInput {
  id: string;
  title: string;
  content: string;
  category: string;
  sourceType?: string;
  metadata?: unknown;
  isActive?: boolean;
}

/** Pull a clean string[] of tags out of the freeform metadata JSON, if present. */
function extractTags(metadata: unknown): string[] {
  if (metadata && typeof metadata === "object" && "tags" in metadata) {
    const tags = (metadata as { tags?: unknown }).tags;
    if (Array.isArray(tags)) {
      return tags.filter((t): t is string => typeof t === "string" && t.trim() !== "");
    }
  }
  return [];
}

function slugify(s: string): string {
  const out = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return out || "item";
}

function buildManifest(agent: OkfAgentMeta, count: number, exportedAt: string): string {
  return [
    `# ${agent.name} — Knowledge Bundle (OKF)`,
    "",
    "Open Knowledge Format export of this agent's knowledge base.",
    "Each file under `concepts/` is one knowledge item; edit or add files and",
    "re-import to update the agent. Voice retrieval (RAG) is unchanged — imported",
    "items are embedded and searched exactly like hand-entered ones.",
    "",
    `- **Agent template:** ${agent.templateType}`,
    `- **Slug:** ${agent.slug}`,
    `- **Concepts:** ${count}`,
    `- **Exported:** ${exportedAt}`,
    "",
    "> Do not put personal data (leads, contacts, resumes) in this bundle — it is",
    "> for curated agent knowledge only.",
    "",
  ].join("\n");
}

/**
 * Serialize active knowledge items to an OKF bundle. Inactive items
 * (`isActive === false`) are skipped. Filenames are derived from category +
 * title and de-duplicated so two items with the same title don't collide.
 */
export function serializeAgentKnowledge(
  agent: OkfAgentMeta,
  items: OkfKnowledgeInput[],
  exportedAt: string,
): Record<string, string> {
  const files: Record<string, string> = {};
  const usedNames = new Set<string>();

  const active = items.filter((i) => i.isActive !== false);

  for (const item of active) {
    const tags = extractTags(item.metadata);
    const hash = contentHash(item.content);

    const base = `${slugify(item.category)}-${slugify(item.title)}`;
    let name = base;
    let n = 2;
    while (usedNames.has(name)) {
      name = `${base}-${n++}`;
    }
    usedNames.add(name);

    const fm = serializeFrontmatter({
      type: "knowledge",
      title: item.title,
      category: item.category,
      source: item.sourceType || "TEXT",
      voxie_id: item.id,
      content_hash: hash,
      ...(tags.length ? { tags } : {}),
    });

    files[`concepts/${name}.md`] = `---\n${fm}\n---\n\n${item.content.trim()}\n`;
  }

  files["README.md"] = buildManifest(agent, active.length, exportedAt);
  return files;
}

// ── Phase 3: BusinessData + agent card ──────────────────────────────────────

/** The subset of a BusinessData row the serializer reads. */
export interface OkfBusinessDataInput {
  id: string;
  dataType: string;
  data: unknown;
}

function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Serialize structured BusinessData (menu / rooms / doctors …) to `data/*.md`
 * concepts. The canonical payload is a ```json fenced block so it round-trips
 * losslessly; a human note sits above it. These feed the info tools, NOT RAG.
 */
export function serializeBusinessData(
  dataItems: OkfBusinessDataInput[],
): Record<string, string> {
  const files: Record<string, string> = {};
  const usedNames = new Set<string>();

  for (const d of dataItems) {
    const base = slugify(d.dataType);
    let name = base;
    let n = 2;
    while (usedNames.has(name)) {
      name = `${base}-${n++}`;
    }
    usedNames.add(name);

    const fm = serializeFrontmatter({
      type: "businessdata",
      title: titleCase(d.dataType),
      data_type: d.dataType,
      voxie_id: d.id,
    });
    const json = JSON.stringify(d.data ?? {}, null, 2);
    files[`data/${name}.md`] =
      `---\n${fm}\n---\n\n` +
      `Structured data for the \`${d.dataType}\` tool. Edit inside the JSON block below.\n\n` +
      "```json\n" +
      `${json}\n` +
      "```\n";
  }

  return files;
}

/** The subset of an Agent row the card serializer reads (no secrets). */
export interface OkfAgentCardInput {
  name: string;
  templateType: string;
  greeting?: string | null;
  personality?: string | null;
  systemPrompt?: string | null;
  voiceName?: string | null;
  language?: string | null;
  enabledTools?: string[] | null;
}

/**
 * Serialize an agent's configuration to a single `agent.md` "card" for
 * portability/backup. EXPORT ONLY — importing an agent card intentionally does
 * NOT mutate the live agent (its `type: agent` concept is ignored by the
 * knowledge/businessdata importers), because prompts change behavior and must
 * be edited deliberately in the dashboard.
 */
export function serializeAgentCard(a: OkfAgentCardInput): Record<string, string> {
  const fm = serializeFrontmatter({
    type: "agent",
    title: a.name,
    template: a.templateType,
    ...(a.voiceName ? { voice: a.voiceName } : {}),
    ...(a.language ? { language: a.language } : {}),
    ...(a.enabledTools && a.enabledTools.length ? { tools: a.enabledTools } : {}),
  });

  const parts = [`---\n${fm}\n---\n`, `# ${a.name}`, ""];
  if (a.greeting) parts.push(`## Greeting\n\n${a.greeting}\n`);
  if (a.personality) parts.push(`## Personality\n\n${a.personality}\n`);
  if (a.systemPrompt) parts.push(`## System Prompt\n\n${a.systemPrompt}\n`);
  parts.push(
    "> Exported for reference/portability. Re-importing this card does NOT change " +
      "the live agent — edit agent config in the dashboard.",
  );

  return { "agent.md": parts.join("\n") };
}

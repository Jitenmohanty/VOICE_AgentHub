/**
 * Parse an OKF bundle ({ path: contents }) into concepts, and map knowledge
 * concepts to KnowledgeItem drafts ready for upsert + embedding.
 *
 * Never throws: files that aren't `.md`, the README, or lack the required
 * `type` frontmatter field are skipped; malformed frontmatter degrades to an
 * empty header (handled by parseFrontmatter). This mirrors the resilient
 * resume-parser pattern — a bad file drops out, the rest of the bundle imports.
 */
import { parseFrontmatter, type FrontmatterValue } from "./frontmatter";
import { contentHash } from "./hash";

export interface OkfConcept {
  type: string;
  title: string;
  category?: string;
  source?: string;
  voxieId?: string;
  contentHash?: string;
  dataType?: string; // businessdata concepts (menu / rooms / doctors …)
  tags: string[];
  body: string;
  path: string;
}

/** A KnowledgeItem shaped for the import route to create/update. */
export interface KnowledgeItemDraft {
  id?: string;
  title: string;
  content: string;
  category: string;
  sourceType: string;
  metadata: { tags?: string[]; contentHash: string; importedFrom: "okf" };
}

function str(v: FrontmatterValue | undefined): string {
  return typeof v === "string" ? v : "";
}

/** Parse every knowledge/data/agent concept in a bundle. */
export function parseOkfBundle(files: Record<string, string>): OkfConcept[] {
  const concepts: OkfConcept[] = [];

  for (const [path, raw] of Object.entries(files)) {
    if (!path.toLowerCase().endsWith(".md")) continue;
    const base = (path.split("/").pop() || path).toLowerCase();
    if (base === "readme.md") continue;

    const { data, body } = parseFrontmatter(raw);
    const type = str(data.type);
    if (!type) continue; // OKF requires `type`; no type → not a concept.

    concepts.push({
      type,
      title: str(data.title) || (path.split("/").pop() || path).replace(/\.md$/i, ""),
      category: str(data.category) || undefined,
      source: str(data.source) || undefined,
      voxieId: str(data.voxie_id) || undefined,
      contentHash: str(data.content_hash) || undefined,
      dataType: str(data.data_type) || undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
      body,
      path,
    });
  }

  return concepts;
}

/**
 * Map a `type: knowledge` concept to a KnowledgeItem draft. Returns null for
 * any other concept type (Phase 0/2 handle knowledge items only; BusinessData
 * and agent-card types arrive in Phase 3).
 *
 * `sourceType` preserves the original `source` for faithful round-trips, or
 * defaults to "OKF" for hand-authored files with no source field.
 */
export function conceptToKnowledgeItem(c: OkfConcept): KnowledgeItemDraft | null {
  if (c.type !== "knowledge") return null;
  const content = c.body.trim();
  const tags = c.tags.filter((t) => typeof t === "string" && t.trim() !== "");
  return {
    id: c.voxieId,
    title: c.title.trim(),
    content,
    category: c.category?.trim() || "general",
    sourceType: c.source || "OKF",
    metadata: {
      ...(tags.length ? { tags } : {}),
      contentHash: c.contentHash || contentHash(content),
      importedFrom: "okf",
    },
  };
}

/** A BusinessData row shaped for upsert by (agentId, dataType). */
export interface BusinessDataDraft {
  dataType: string;
  data: unknown;
}

/** Extract the payload of the first ```json fenced block in a markdown body. */
function extractJsonBlock(body: string): string | null {
  const m = /```json\s*\n([\s\S]*?)\n```/.exec(body);
  return m ? (m[1] ?? null) : null;
}

/**
 * Map a `type: businessdata` concept back to a BusinessData draft. Returns null
 * for other types, a missing/unknown `data_type`, or an unparseable JSON block
 * (never throws — a bad data file is skipped, the rest of the bundle imports).
 */
export function conceptToBusinessData(c: OkfConcept): BusinessDataDraft | null {
  if (c.type !== "businessdata") return null;
  const dataType = (c.dataType || "").trim();
  if (!dataType) return null;
  const jsonText = extractJsonBlock(c.body);
  if (jsonText === null) return null;
  try {
    return { dataType, data: JSON.parse(jsonText) };
  } catch {
    return null;
  }
}

/**
 * Minimal, dependency-free YAML-frontmatter serializer/parser for the
 * constrained subset OKF needs: flat scalar strings and string arrays.
 *
 * Deliberately NOT a general YAML implementation — Voxie's OKF concepts only
 * use `key: value` scalars and `key: [a, b]` string lists. Keeping it in-house
 * matches the codebase's dependency-free ethos (see the hand-rolled R2 SigV4)
 * and keeps this module pure + unit-testable. Never throws: malformed input
 * degrades to an empty frontmatter + raw body.
 */

export type FrontmatterValue = string | string[];
export interface Frontmatter {
  [key: string]: FrontmatterValue;
}

// A scalar needs quoting if it contains YAML-significant characters, has
// edge whitespace, or begins with an indicator character.
const NEEDS_QUOTE = /[:#[\]{},&*!|>'"%@`]|^\s|\s$|^[-?]/;

function serializeScalar(v: string): string {
  if (v === "") return '""';
  return NEEDS_QUOTE.test(v)
    ? `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
    : v;
}

function parseScalar(raw: string): string {
  const s = raw.trim();
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return s;
}

/** Split a `[a, "b, c", d]` inner list on commas, respecting quotes. */
function splitList(inner: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '"') {
      inQuote = !inQuote;
      cur += c;
    } else if (c === "," && !inQuote) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  if (cur.trim() !== "") out.push(cur);
  return out.map(parseScalar).filter((s) => s !== "");
}

/** Serialize a flat frontmatter object to YAML lines (no `---` fences). */
export function serializeFrontmatter(data: Frontmatter): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val == null) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      lines.push(`${key}: [${val.map(serializeScalar).join(", ")}]`);
    } else {
      lines.push(`${key}: ${serializeScalar(val)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Parse a markdown document with optional leading `--- … ---` frontmatter.
 * Returns the parsed scalar/array fields plus the trimmed body. A document
 * with no frontmatter yields `{ data: {}, body: <whole doc> }`.
 */
export function parseFrontmatter(text: string): { data: Frontmatter; body: string } {
  const t = (text ?? "").replace(/^﻿/, ""); // strip BOM
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(t);
  if (!m) return { data: {}, body: t.trim() };

  const fm = m[1] ?? "";
  const rawBody = m[2] ?? "";
  const data: Frontmatter = {};
  for (const line of fm.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (!key) continue;
    const value = line.slice(idx + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner === "" ? [] : splitList(inner);
    } else {
      data[key] = parseScalar(value);
    }
  }
  return { data, body: rawBody.trim() };
}

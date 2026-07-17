/**
 * Dependency-free website crawler for knowledge ingestion (Item 1).
 *
 * Fetches a small number of same-origin pages starting from a URL the owner
 * pastes, extracts readable text, and returns { url, title, text } per page.
 * Claude chunking + embedding happen in the caller (ingest-website.ts) —
 * this module is pure fetch + parse so it stays testable.
 *
 * Security posture:
 *  - http(s) only, public hostnames only (SSRF guard blocks localhost,
 *    RFC-1918 ranges, link-local, and *.local / *.internal names).
 *  - 10s timeout and 1.5MB body cap per page.
 *  - Crawled text is sanitized against prompt-injection phrases before it
 *    can ever reach a system prompt (it enters KnowledgeItem.content, which
 *    is injected into prompts via RAG).
 */

const MAX_PAGE_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 10_000;
export const MAX_PAGES = 8;

/** Paths that usually carry the highest-signal business info — crawled first. */
const PRIORITY_PATH_HINTS = [
  "about", "faq", "service", "pricing", "price", "menu", "contact",
  "hours", "location", "team", "treatment", "room", "book",
];

const SKIP_EXTENSIONS = /\.(pdf|jpg|jpeg|png|gif|webp|svg|ico|css|js|mp4|mp3|zip|xml|json|woff2?)($|\?)/i;

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
}

/** Reject URLs that could reach internal infrastructure. */
export function isSafePublicUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http/https URLs are allowed" };
  }
  const host = url.hostname.toLowerCase();
  const privatePatterns = [
    /^localhost$/, /^127\./, /^0\.0\.0\.0$/, /^10\./, /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^\[::1?\]$/, /^\[fc/, /^\[fe80/,
    /\.local$/, /\.internal$/, /^metadata\./,
  ];
  if (privatePatterns.some((p) => p.test(host))) {
    return { ok: false, reason: "URL points to a private/internal address" };
  }
  return { ok: true, url };
}

/**
 * Strip instruction-override phrasing from crawled text so a hostile page
 * can't smuggle prompt injections into the agent's knowledge base. This is a
 * best-effort filter, not a proof — content also stays clearly delimited as
 * data inside the RAG context block.
 */
export function sanitizeCrawledText(text: string): string {
  return text
    .replace(/ignore (all|any|previous|prior|above) (instructions|rules|prompts)[^.\n]*/gi, "")
    .replace(/disregard (all|any|previous|prior|above)[^.\n]*/gi, "")
    .replace(/you are now[^.\n]*/gi, "")
    .replace(/system\s*(prompt|instruction)\s*:/gi, "")
    .replace(/<\s*\/?\s*(system|assistant|instructions?)\s*>/gi, "");
}

/** Minimal HTML → readable text. Good enough for SMB marketing sites. */
export function htmlToText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]!.trim()).slice(0, 200) : "";

  const text = decodeEntities(
    html
      // Drop non-content subtrees entirely.
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<head[\s\S]*?<\/head>/gi, " ")
      .replace(/<(nav|footer)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      // Block-level tags become line breaks so headings/paragraphs stay separated.
      .replace(/<\/(p|div|section|article|li|tr|h[1-6]|br|ul|ol|table)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { title, text: sanitizeCrawledText(text) };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(apos|#39);/g, "'");
}

/** Extract same-origin, crawlable links from a page, priority-sorted. */
export function extractLinks(html: string, base: URL): string[] {
  const hrefs = new Set<string>();
  const re = /<a[^>]+href\s*=\s*["']([^"'#]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const resolved = new URL(m[1]!, base);
      if (resolved.origin !== base.origin) continue;
      if (SKIP_EXTENSIONS.test(resolved.pathname)) continue;
      resolved.hash = "";
      resolved.search = "";
      hrefs.add(resolved.toString());
    } catch {
      /* unparsable href — skip */
    }
  }
  return [...hrefs].sort((a, b) => linkPriority(b) - linkPriority(a));
}

function linkPriority(url: string): number {
  const path = url.toLowerCase();
  let score = 0;
  for (const hint of PRIORITY_PATH_HINTS) if (path.includes(hint)) score += 10;
  // Prefer shallow pages: /about beats /blog/2021/03/some-post.
  score -= (path.match(/\//g)?.length ?? 0);
  return score;
}

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "VoxieBot/1.0 (+knowledge-ingest; owner-initiated)" },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) return null;
    const body = await res.text();
    return body.length > MAX_PAGE_BYTES ? body.slice(0, MAX_PAGE_BYTES) : body;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * BFS crawl from startUrl, same-origin, up to maxPages pages.
 * Pages with under 200 chars of text are skipped (nav shells, redirects).
 */
export async function crawlSite(startUrl: string, maxPages: number = MAX_PAGES): Promise<CrawledPage[]> {
  const safe = isSafePublicUrl(startUrl);
  if (!safe.ok) throw new Error(safe.reason);

  const queue: string[] = [safe.url.toString()];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const html = await fetchPage(current);
    if (!html) continue;

    const { title, text } = htmlToText(html);
    if (text.length >= 200) {
      pages.push({ url: current, title: title || current, text: text.slice(0, 20_000) });
    }

    if (pages.length < maxPages) {
      for (const link of extractLinks(html, safe.url)) {
        if (!visited.has(link) && queue.length < 50) queue.push(link);
      }
    }
  }

  return pages;
}

/**
 * Fast, deterministic, dependency-free content hash (FNV-1a 32-bit → hex).
 *
 * Used ONLY for change-detection (skip re-embedding unchanged knowledge items
 * on OKF re-import). NOT a security primitive — collisions are acceptable here;
 * the cost of a rare miss is one redundant embedding call, never data loss.
 */
export function contentHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

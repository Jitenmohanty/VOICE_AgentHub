/**
 * Languages supported by Voxie voice agents.
 *
 * `code` is BCP-47 (Gemini Live's `speechConfig.languageCode` expects BCP-47;
 * a bare ISO 639-1 like "hi" works inconsistently across regions, so we always
 * include the region tag).
 *
 * Used by:
 *   - The owner-side agent settings picker (default language for the agent)
 *   - The caller-side pre-call picker (per-call language override)
 *   - GeminiLiveSession when wiring `speechConfig.languageCode`
 *   - The session route when injecting "Respond in <language>" into the prompt
 */
export interface LanguageOption {
  /** BCP-47 code passed to Gemini Live's speechConfig.languageCode */
  code: string;
  /** English label, shown in owner-side picker */
  label: string;
  /** Native-script label, shown to callers so they recognize their language */
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: "en-US", label: "English",  nativeLabel: "English" },
  { code: "hi-IN", label: "Hindi",    nativeLabel: "हिन्दी" },
  { code: "mr-IN", label: "Marathi",  nativeLabel: "मराठी" },
  { code: "bn-IN", label: "Bengali",  nativeLabel: "বাংলা" },
  { code: "ta-IN", label: "Tamil",    nativeLabel: "தமிழ்" },
  { code: "te-IN", label: "Telugu",   nativeLabel: "తెలుగు" },
  { code: "or-IN", label: "Odia",     nativeLabel: "ଓଡ଼ିଆ" },
] as const;

export const DEFAULT_LANGUAGE_CODE = "en-US";

const codeSet = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

export function isSupportedLanguage(code: string | null | undefined): boolean {
  return !!code && codeSet.has(code);
}

/**
 * Normalize a stored language value to a supported code.
 * Tolerant of legacy bare codes (e.g. "en", "hi") by upgrading them to the
 * regioned default (en-US, hi-IN). Falls back to en-US for anything unknown.
 */
export function normalizeLanguage(code: string | null | undefined): string {
  if (!code) return DEFAULT_LANGUAGE_CODE;
  if (codeSet.has(code)) return code;
  // Legacy bare ISO 639-1 codes — upgrade to the first matching regioned code.
  const match = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase().startsWith(code.toLowerCase() + "-"));
  return match ? match.code : DEFAULT_LANGUAGE_CODE;
}

export function getLanguage(code: string | null | undefined): LanguageOption {
  const normalized = normalizeLanguage(code);
  return SUPPORTED_LANGUAGES.find((l) => l.code === normalized) ?? SUPPORTED_LANGUAGES[0]!;
}

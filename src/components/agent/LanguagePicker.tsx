"use client";

import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

interface Props {
  value: string;
  onChange: (code: string) => void;
  accentColor?: string;
  disabled?: boolean;
  /** Compact variant for tight pre-call layouts. Default: false. */
  compact?: boolean;
}

/**
 * Caller-facing language picker. Rendered above every pre-call screen by
 * PublicAgentExperience so the caller can choose what language they'll speak
 * in before the call starts. The selection is sent to the session route and
 * flows into Gemini Live's speechConfig.languageCode.
 */
export function LanguagePicker({ value, onChange, disabled, compact }: Props) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "justify-center"}`}>
      <label
        htmlFor="caller-language"
        className="flex items-center gap-1.5 text-xs text-white/55 tracking-wide"
      >
        <Globe className="w-3.5 h-3.5 text-violet-300" strokeWidth={2} />
        Language
      </label>
      <select
        id="caller-language"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-300/50 hover:bg-white/[0.07] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Select language for this call"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="bg-[var(--ah-bg-raised)]">
            {l.nativeLabel} {l.nativeLabel !== l.label ? `· ${l.label}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

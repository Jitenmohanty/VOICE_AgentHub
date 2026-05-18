"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** `chip` renders a compact icon button; `pill` shows both icons with a slider. */
  variant?: "chip" | "pill";
}

/**
 * Theme toggle. Keeps a render-stable placeholder until mount so SSR markup
 * doesn't disagree with the hydrated DOM — next-themes can only resolve the
 * real theme on the client.
 */
export function ThemeToggle({ className, variant = "chip" }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme !== "light";
  const next = isDark ? "light" : "dark";

  if (variant === "pill") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!isDark}
        aria-label="Toggle color theme"
        onClick={() => setTheme(next)}
        className={cn(
          "relative inline-flex h-9 w-[78px] items-center rounded-full border transition-colors ah-focus-ring",
          "bg-white/[0.04] border-white/10",
          "light:bg-[var(--ah-surface)] light:border-[var(--ah-border)]",
          className,
        )}
      >
        {/* Sliding knob */}
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-8 w-9 rounded-full transition-transform duration-300 ease-out",
            "ah-gradient-bg shadow-[0_4px_12px_-4px_rgba(124,58,237,0.6)]",
            isDark ? "translate-x-0" : "translate-x-[36px]",
          )}
        />
        <Moon
          className={cn(
            "relative z-10 w-3.5 h-3.5 ml-2.5 transition-colors",
            isDark ? "text-white" : "text-[var(--ah-text-muted)]",
          )}
          strokeWidth={2.25}
        />
        <Sun
          className={cn(
            "relative z-10 w-3.5 h-3.5 ml-auto mr-2.5 transition-colors",
            !isDark ? "text-white" : "text-[var(--ah-text-muted)]",
          )}
          strokeWidth={2.25}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all ah-focus-ring",
        "bg-white/[0.04] border-white/10 text-[var(--ah-text-secondary)]",
        "hover:bg-white/[0.08] hover:border-white/14 hover:text-[var(--ah-text-primary)]",
        className,
      )}
    >
      {/* Render both icons; CSS handles which is visible to avoid a hydration mismatch. */}
      <Sun className={cn("w-4 h-4 transition-all", isDark ? "scale-0 rotate-90 absolute" : "scale-100 rotate-0")} strokeWidth={2} />
      <Moon className={cn("w-4 h-4 transition-all", isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90 absolute")} strokeWidth={2} />
    </button>
  );
}

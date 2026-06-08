"use client";

import type { CSSProperties } from "react";

interface AuroraBackgroundProps {
  /**
   * Density of the orb cluster. `subtle` for nested usage inside a hero,
   * `full` for top-level page wrappers. Defaults to `full`.
   */
  density?: "subtle" | "full";
  /** Custom className for the wrapper (positioning overrides). */
  className?: string;
}

/**
 * Floating gradient orbs background. Fixed-position layer that sits behind
 * page content. Pure CSS — no JS animation cost — and respects
 * prefers-reduced-motion via the `.animate-aurora` class.
 *
 * Usage:
 *   <div className="relative">
 *     <AuroraBackground />
 *     <YourContent />
 *   </div>
 */
export function AuroraBackground({ density = "full", className }: AuroraBackgroundProps) {
  const orbStyle = (color: string, size: number, blur: number, opacity: number): CSSProperties => ({
    width: `${size}px`,
    height: `${size}px`,
    background: color,
    filter: `blur(${blur}px)`,
    opacity,
    willChange: "transform",
  });

  const wrapperClass = `pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`;

  return (
    <div className={wrapperClass} aria-hidden="true">
      {/* Sage wash — top-left */}
      <div
        className="absolute -top-32 -left-24 rounded-full"
        style={orbStyle("#A8B89B", density === "full" ? 560 : 360, 160, density === "full" ? 0.18 : 0.10)}
      />
      {/* Lavender wash — top-right */}
      <div
        className="absolute -top-20 right-[-10%] rounded-full"
        style={orbStyle("#C9C2E0", density === "full" ? 520 : 340, 180, density === "full" ? 0.16 : 0.09)}
      />
      {/* Warm cream wash — bottom */}
      <div
        className="absolute bottom-[-20%] left-1/4 rounded-full"
        style={orbStyle("#F4ECDB", density === "full" ? 600 : 380, 200, density === "full" ? 0.55 : 0.35)}
      />
      {/* Subtle paper grain — keeps the cream from looking flat. */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(26,26,26,0.45) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }}
      />
    </div>
  );
}

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
      {/* Violet orb — top-left */}
      <div
        className="absolute -top-32 -left-24 rounded-full animate-aurora"
        style={orbStyle("#7C3AED", density === "full" ? 560 : 360, 120, density === "full" ? 0.35 : 0.2)}
      />
      {/* Blue orb — top-right */}
      <div
        className="absolute -top-20 right-[-10%] rounded-full animate-aurora"
        style={{
          ...orbStyle("#3B82F6", density === "full" ? 520 : 340, 140, density === "full" ? 0.3 : 0.18),
          animationDelay: "-7s",
        }}
      />
      {/* Cyan orb — bottom-center */}
      <div
        className="absolute bottom-[-20%] left-1/4 rounded-full animate-aurora"
        style={{
          ...orbStyle("#06B6D4", density === "full" ? 600 : 380, 160, density === "full" ? 0.25 : 0.15),
          animationDelay: "-14s",
        }}
      />
      {/* Subtle grain — keeps the gradient from looking flat. CSS-only,
          no image asset needed. */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }}
      />
    </div>
  );
}

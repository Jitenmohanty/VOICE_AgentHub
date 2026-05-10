"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Elevation tier — controls blur strength + shadow depth. */
  elevation?: "subtle" | "raised" | "floating";
  /** When true, renders an animated gradient border (conic). */
  gradientBorder?: boolean;
  /** When true, the panel scales + glows on hover. */
  interactive?: boolean;
  /** Border-radius preset. Defaults to "lg" (24px). */
  radius?: "md" | "lg" | "xl";
  children: React.ReactNode;
}

const elevationClass: Record<NonNullable<GlassPanelProps["elevation"]>, string> = {
  subtle: "glass",
  raised: "glass-raised",
  floating: "glass-floating",
};

const radiusClass: Record<NonNullable<GlassPanelProps["radius"]>, string> = {
  md: "rounded-2xl",   // 16px
  lg: "rounded-3xl",   // 24px
  xl: "rounded-[28px]",
};

/**
 * Premium glassmorphism container. Use this everywhere a card surface is
 * needed — replaces ad-hoc `<div className="glass …">` usage so styling
 * stays consistent.
 *
 * Examples:
 *   <GlassPanel elevation="raised">…</GlassPanel>
 *   <GlassPanel gradientBorder elevation="floating">…</GlassPanel>
 *   <GlassPanel interactive className="p-8">…</GlassPanel>
 */
export function GlassPanel({
  elevation = "subtle",
  gradientBorder,
  interactive,
  radius = "lg",
  className,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <div
      {...rest}
      className={cn(
        "relative",
        elevationClass[elevation],
        radiusClass[radius],
        gradientBorder && "gradient-border",
        interactive && [
          "transition-[transform,box-shadow,border-color] duration-500 ease-out",
          "hover:scale-[1.015] hover:border-white/20",
          "hover:shadow-[0_24px_64px_-24px_rgba(124,58,237,0.4),0_0_48px_-12px_rgba(6,182,212,0.2)]",
        ],
        className,
      )}
    >
      {children}
    </div>
  );
}

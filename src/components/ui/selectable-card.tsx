"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface SelectableCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> {
  selected: boolean;
  onSelect: () => void;
  /** Pad density. `compact` for chip-grids, `default` for industry pickers, `lg` for plan cards. */
  density?: "compact" | "default" | "lg";
  /** When true, renders a small Check mark in the corner when selected. */
  showCheck?: boolean;
  children: React.ReactNode;
}

const densityClass: Record<NonNullable<SelectableCardProps["density"]>, string> = {
  compact: "p-3 rounded-xl",
  default: "p-3.5 rounded-2xl",
  lg: "p-5 rounded-3xl",
};

/**
 * Card-shaped radio button used wherever the user picks one option from a grid
 * (industry, plan, persona, template). Active state uses the brand soft gradient
 * fill + a violet ring glow; inactive is glass with a quiet hover.
 *
 * Pair with `role="radiogroup"` on the parent container for a11y.
 */
export function SelectableCard({
  selected,
  onSelect,
  density = "default",
  showCheck = true,
  className,
  children,
  ...rest
}: SelectableCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative text-left transition-all duration-300 border outline-none ah-focus-ring",
        densityClass[density],
        selected
          ? "bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-300/40 shadow-[0_0_16px_-4px_rgba(124,58,237,0.4)]"
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/15",
        className,
      )}
      {...rest}
    >
      {selected && showCheck && (
        <Check className="w-3.5 h-3.5 absolute top-2 right-2 text-violet-300" strokeWidth={2.5} />
      )}
      {children}
    </button>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BaseProps {
  size?: "default" | "lg" | "sm";
  variant?: "primary" | "ghost" | "outline";
  className?: string;
  children: React.ReactNode;
}

interface ButtonProps extends BaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size" | "children"> {
  href?: undefined;
}

interface AnchorProps extends BaseProps {
  href: string;
  /** When true, renders as <Link>; otherwise <a>. Auto-detected for internal /paths. */
  external?: boolean;
}

type GradientButtonProps = ButtonProps | AnchorProps;

const sizeClass: Record<NonNullable<BaseProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm rounded-full",
  default: "px-6 py-3 text-sm rounded-full",
  lg: "px-8 py-4 text-base rounded-full",
};

const baseClass = [
  "relative inline-flex items-center justify-center gap-2 font-medium",
  "transition-all duration-300 ease-out select-none",
  "ah-focus-ring",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "active:scale-[0.98]",
].join(" ");

/**
 * Editorial CTA. Three variants:
 *   primary — deep forest-green pill, cream text. The marquee CTA.
 *   outline — cream pill with a sage-deep hairline border.
 *   ghost   — text-only with sage-deep hover background.
 *
 * Name kept as `GradientButton` for back-compat; the actual styling is
 * editorial (no gradient). Phase 6 cleanup will rename if needed.
 */
export function GradientButton(props: GradientButtonProps) {
  const { size = "default", variant = "primary", className, children } = props;

  const variantClass = {
    primary: cn(
      "ah-on-gradient",
      "bg-[var(--ah-cta)] text-[#FFFCF6]",
      "hover:bg-[var(--ah-cta-hover)]",
      "hover:translate-y-[-1px]",
    ),
    outline: cn(
      "bg-transparent text-[var(--ah-ink)]",
      "border border-[var(--ah-sage-deep)]",
      "hover:bg-[var(--ah-sage)]",
    ),
    ghost: cn(
      "text-[var(--ah-ink-soft)] hover:text-[var(--ah-ink)] hover:bg-[var(--ah-surface)]",
    ),
  }[variant];

  const finalClass = cn(baseClass, sizeClass[size], variantClass, "transition-[background-color,color,border-color,transform] duration-300", className);

  if ("href" in props && props.href) {
    const isExternal = props.external ?? /^(https?:)?\/\//.test(props.href);
    if (isExternal) {
      return (
        <a href={props.href} className={finalClass} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={props.href} className={finalClass}>
        {children}
      </Link>
    );
  }

  // Strip Link-only props before forwarding to <button>
  const { ...rest } = props as ButtonProps;
  return (
    <button {...rest} className={finalClass}>
      {children}
    </button>
  );
}

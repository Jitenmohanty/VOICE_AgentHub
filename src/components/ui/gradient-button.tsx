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
  sm: "px-4 py-2 text-sm rounded-xl",
  default: "px-6 py-3 text-sm rounded-2xl",
  lg: "px-8 py-4 text-base rounded-2xl",
};

const baseClass = [
  "relative inline-flex items-center justify-center gap-2 font-medium",
  "transition-all duration-300 ease-out select-none",
  "ah-focus-ring",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "active:scale-[0.98]",
].join(" ");

/**
 * Premium gradient CTA. Two layers of gradient:
 *   1. The fill (always visible) — purple → blue → cyan
 *   2. A glow halo that intensifies on hover
 *
 * `primary` is the marquee CTA; `outline` is a subtle bordered alternative
 * that still respects the brand palette via a gradient hover; `ghost` is
 * for tertiary text-only links.
 */
export function GradientButton(props: GradientButtonProps) {
  const { size = "default", variant = "primary", className, children } = props;

  const variantClass = {
    primary: cn(
      // ah-on-gradient marks "this element's text must stay white in both themes"
      // because the violet→cyan fill is dark in either mode.
      "ah-on-gradient text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)]",
      "bg-[length:200%_100%] bg-[linear-gradient(110deg,#7C3AED,#3B82F6,#06B6D4,#3B82F6,#7C3AED)]",
      "hover:bg-[position:100%_0] hover:shadow-[0_12px_40px_-8px_rgba(59,130,246,0.7)]",
    ),
    outline: cn(
      "text-white border border-white/14 bg-white/[0.04] backdrop-blur-md",
      "hover:bg-white/[0.08] hover:border-white/25 hover:shadow-[0_0_24px_-6px_rgba(124,58,237,0.4)]",
    ),
    ghost: cn(
      "text-white/65 hover:text-white hover:bg-white/[0.06]",
    ),
  }[variant];

  const finalClass = cn(baseClass, sizeClass[size], variantClass, "transition-[background-position,box-shadow,color,border-color,transform] duration-500", className);

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

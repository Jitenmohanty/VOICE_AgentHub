"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";

interface AuthShellProps {
  /** Page heading. Falls back to "Welcome" when omitted. */
  title: string;
  /** Optional supporting line below the title. */
  subtitle?: React.ReactNode;
  /** Optional element rendered after the subtitle (e.g. step indicator). */
  meta?: React.ReactNode;
  /** Optional element rendered below the children panel — usually a sign-in/up link. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Unified shell for every auth page (login, register, forgot/reset password,
 * verify-email, verify-email-sent). Encapsulates the aurora background, the
 * brand mark, the heading + subtitle, and the centered card column.
 *
 * Pages plug in their form/content via `children`; the form should already be
 * wrapped in its own GlassPanel.
 */
export function AuthShell({ title, subtitle, meta, footer, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-2 py-8 md:px-6 md:py-12 overflow-hidden">
      <AuroraBackground density="subtle" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-9">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-7 group">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "var(--ah-cta)" }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#FFFCF6" }} strokeWidth={2.5} />
            </div>
            <span
              className="font-serif text-3xl tracking-tight"
              style={{ color: "var(--ah-ink)" }}
            >
              Voxie
            </span>
          </Link>

          <h1
            className="font-serif text-4xl md:text-5xl tracking-[-0.02em] mb-2 leading-[1.1]"
            style={{ color: "var(--ah-ink)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-base max-w-sm mx-auto leading-relaxed"
              style={{ color: "var(--ah-ink-soft)" }}
            >
              {subtitle}
            </p>
          )}
          {meta && <div className="mt-5">{meta}</div>}
        </div>

        {children}

        {footer && (
          <div
            className="text-center mt-7 text-base"
            style={{ color: "var(--ah-ink-soft)" }}
          >
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Step indicator dots — used by the multi-step register page.
 */
export function AuthStepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-1 rounded-full transition-all duration-500"
          style={{
            width: i < current ? "2rem" : "1.25rem",
            background: i < current ? "var(--ah-cta)" : "var(--ah-border-strong)",
          }}
        />
      ))}
    </div>
  );
}
